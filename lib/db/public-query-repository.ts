import { localFixtureData } from "@/data/fixtures/local-fixtures";
import {
  getEmployerBySlug as getLocalEmployerBySlug,
  getEmployerImmigrationSummary,
  getLatestVisaBulletinMonth,
  listVisaBulletinRows,
  normalizeEmployerName,
  searchEmployers as searchLocalEmployers,
} from "@/lib/db/local-repository";
import type {
  Employer,
  FixtureData,
  H1BLcaRecord,
  PermRecord,
  VisaBulletinDate,
  VisaBulletinMonth,
} from "@/lib/db/types";

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const SOC_CODE_PATTERN = /^\d{2}-\d{4}$/;

export type PublicQueryErrorCode = "empty_data" | "invalid_input" | "not_found";

export type PublicQueryError = {
  code: PublicQueryErrorCode;
  messageZh: string;
  field?: string;
  hintZh?: string;
};

export type PublicQueryResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: PublicQueryError;
    };

export type PublicQueryCacheStats = {
  enabled: boolean;
  size: number;
  hits: number;
  misses: number;
  ttlMs: number;
};

export type PublicRepositoryOptions = {
  data?: FixtureData;
  cacheTtlMs?: number;
  cacheEnabled?: boolean;
  now?: () => number;
};

export type PublicEmployerSearchInput = {
  query: string;
  limit?: number;
};

export type PublicEmployerSearchPayload = {
  query: string;
  results: readonly {
    employer: Employer;
    matchedAliases: readonly string[];
  }[];
};

export type PublicEmployerBySlugInput = {
  slug: string;
};

export type PublicH1BSummaryPayload = {
  employer: Employer;
  h1b: {
    total: number;
    certified: number;
    withdrawn: number;
    denied: number;
    fiscalYears: readonly number[];
  };
  uscis: {
    totalRecords: number;
    initialApprovals: number;
    initialDenials: number;
    continuingApprovals: number;
    continuingDenials: number;
  };
  topJobTitles: readonly { jobTitle: string; count: number }[];
  topLocations: readonly { location: string; count: number }[];
  sourceNames: readonly string[];
  latestDataDate?: string;
  interpretationNoteZh: string;
};

export type PublicPermSummaryPayload = {
  employer: Employer;
  perm: {
    total: number;
    certified: number;
    denied: number;
    withdrawn: number;
    fiscalYears: readonly number[];
  };
  topJobTitles: readonly { jobTitle: string; count: number }[];
  topLocations: readonly { location: string; count: number }[];
  sourceNames: readonly string[];
  latestDataDate?: string;
  interpretationNoteZh: string;
};

export type PublicWageDistributionInput = {
  employerSlug?: string;
  jobTitle?: string;
  city?: string;
  state?: string;
  socCode?: string;
};

export type PublicWageDistributionPayload = {
  filters: {
    employerSlug?: string;
    jobTitle?: string;
    city?: string;
    state?: string;
    socCode?: string;
  };
  count: number;
  wageUnit: "Year";
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  fiscalYears: readonly number[];
  jobTitles: readonly { value: string; count: number }[];
  locations: readonly { value: string; count: number }[];
  sampleWarningZh?: string;
};

export type PublicRelatedEntitiesPayload = {
  employer: Employer;
  relatedEmployers: readonly {
    employer: Employer;
    sharedSignals: readonly string[];
    score: number;
  }[];
  relatedJobTitles: readonly { value: string; count: number }[];
  relatedLocations: readonly { value: string; count: number }[];
};

export type PublicVisaBulletinDatesInput = {
  monthKey?: string;
  category?: VisaBulletinDate["category"];
  chargeabilityArea?: VisaBulletinDate["chargeabilityArea"];
};

export type PublicVisaBulletinDatesPayload = {
  month: VisaBulletinMonth;
  rows: readonly {
    category: VisaBulletinDate["category"];
    finalAction?: VisaBulletinDate;
    datesForFiling?: VisaBulletinDate;
  }[];
  sourceUrl: string;
  interpretationNoteZh: string;
};

export type PublicQueryRepository = ReturnType<
  typeof createPublicQueryRepository
>;

export function createPublicQueryRepository(
  options: PublicRepositoryOptions = {},
) {
  const data = options.data ?? localFixtureData;
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const cacheEnabled = options.cacheEnabled ?? true;
  const now = options.now ?? (() => Date.now());
  const dataSignature = getDataSignature(data);
  const cache = new Map<string, { expiresAt: number; value: unknown }>();
  let hits = 0;
  let misses = 0;

  function runCached<T>(
    namespace: string,
    input: object,
    producer: () => PublicQueryResult<T>,
  ): PublicQueryResult<T> {
    if (!cacheEnabled) {
      return producer();
    }

    const key = stableCacheKey(namespace, dataSignature, input);
    const entry = cache.get(key);
    const timestamp = now();

    if (entry && entry.expiresAt > timestamp) {
      hits += 1;
      return entry.value as PublicQueryResult<T>;
    }

    misses += 1;
    const value = producer();
    cache.set(key, {
      expiresAt: timestamp + cacheTtlMs,
      value,
    });
    return value;
  }

  function validateSlugOrFailure(
    slug: string,
  ): PublicQueryResult<never> | undefined {
    const normalizedSlug = slug.trim();

    if (!SLUG_PATTERN.test(normalizedSlug)) {
      return failure(
        "invalid_input",
        "公司 slug 格式无效。",
        "slug",
        "slug 只能包含小写英文字母、数字和连字符，且不能包含路径符号。",
      );
    }

    return undefined;
  }

  return {
    searchEmployers(
      input: PublicEmployerSearchInput,
    ): PublicQueryResult<PublicEmployerSearchPayload> {
      const query = input.query.trim();
      const limit = normalizeLimit(input.limit, 10, 50);

      if (query.length < 2) {
        return failure(
          "invalid_input",
          "请输入至少 2 个字符来搜索公司。",
          "query",
        );
      }

      if (!limit.ok) {
        return limit;
      }

      return runCached("searchEmployers", { query, limit: limit.data }, () =>
        success({
          query,
          results: searchLocalEmployers(query, data).slice(0, limit.data),
        }),
      );
    },

    getEmployerBySlug(
      input: PublicEmployerBySlugInput,
    ): PublicQueryResult<Employer> {
      const invalidSlug = validateSlugOrFailure(input.slug);
      if (invalidSlug) {
        return invalidSlug;
      }

      const slug = input.slug.trim();
      return runCached("getEmployerBySlug", { slug }, () => {
        const employer = getLocalEmployerBySlug(slug, data);

        if (!employer) {
          return failure(
            "not_found",
            "未找到对应公司。",
            "slug",
            "请检查公司 URL 或通过公司搜索入口重新查找。",
          );
        }

        return success(employer);
      });
    },

    getH1BSummaryByEmployer(
      input: PublicEmployerBySlugInput,
    ): PublicQueryResult<PublicH1BSummaryPayload> {
      const invalidSlug = validateSlugOrFailure(input.slug);
      if (invalidSlug) {
        return invalidSlug;
      }

      const slug = input.slug.trim();
      return runCached("getH1BSummaryByEmployer", { slug }, () => {
        const summary = getEmployerImmigrationSummary(slug, data);

        if (!summary) {
          return failure("not_found", "未找到该公司的 H-1B 摘要。", "slug");
        }

        return success({
          employer: summary.employer,
          h1b: summary.h1b,
          uscis: summary.uscis,
          topJobTitles: summary.topJobTitles,
          topLocations: summary.topLocations,
          sourceNames: summary.sourceNames,
          latestDataDate: summary.latestDataDate,
          interpretationNoteZh:
            "LCA 和 USCIS Employer Data Hub 是公开数据信号，不代表个案批准、实际录用或未来 sponsor 承诺。",
        });
      });
    },

    getPermSummaryByEmployer(
      input: PublicEmployerBySlugInput,
    ): PublicQueryResult<PublicPermSummaryPayload> {
      const invalidSlug = validateSlugOrFailure(input.slug);
      if (invalidSlug) {
        return invalidSlug;
      }

      const slug = input.slug.trim();
      return runCached("getPermSummaryByEmployer", { slug }, () => {
        const summary = getEmployerImmigrationSummary(slug, data);

        if (!summary) {
          return failure("not_found", "未找到该公司的 PERM 摘要。", "slug");
        }

        return success({
          employer: summary.employer,
          perm: summary.perm,
          topJobTitles: summary.topJobTitles,
          topLocations: summary.topLocations,
          sourceNames: summary.sourceNames,
          latestDataDate: summary.latestDataDate,
          interpretationNoteZh:
            "PERM certification 是劳工认证公开记录，不等于 I-140、I-485 或绿卡获批。",
        });
      });
    },

    getWageDistribution(
      input: PublicWageDistributionInput,
    ): PublicQueryResult<PublicWageDistributionPayload> {
      const employerSlug = input.employerSlug?.trim();
      const state = input.state?.trim().toUpperCase();
      const city = input.city?.trim();
      const socCode = input.socCode?.trim();
      const jobTitle = input.jobTitle?.trim();

      if (employerSlug) {
        const invalidSlug = validateSlugOrFailure(employerSlug);
        if (invalidSlug) {
          return invalidSlug;
        }
      }

      if (socCode && !SOC_CODE_PATTERN.test(socCode)) {
        return failure(
          "invalid_input",
          "SOC code 格式无效。",
          "socCode",
          "请使用类似 15-1252 的 SOC code 格式。",
        );
      }

      if (state && !/^[A-Z]{2}$/.test(state)) {
        return failure("invalid_input", "州代码格式无效。", "state");
      }

      return runCached(
        "getWageDistribution",
        { employerSlug, jobTitle, city, state, socCode },
        () => {
          const employer = employerSlug
            ? getLocalEmployerBySlug(employerSlug, data)
            : undefined;

          if (employerSlug && !employer) {
            return failure(
              "not_found",
              "未找到工资查询对应公司。",
              "employerSlug",
            );
          }

          const records = data.h1bLcaRecords
            .filter((record) => !employer || record.employerId === employer.id)
            .filter((record) => !socCode || record.socCode === socCode)
            .filter(
              (record) =>
                !jobTitle ||
                normalizeEmployerName(record.jobTitle).includes(
                  normalizeEmployerName(jobTitle),
                ),
            )
            .filter(
              (record) =>
                !city ||
                normalizeLocationText(record.worksiteCity) ===
                  normalizeLocationText(city),
            )
            .filter(
              (record) =>
                !state || record.worksiteState.toUpperCase() === state,
            );
          const wages = records
            .map((record) => record.annualizedWageFrom)
            .filter((wage) => Number.isFinite(wage))
            .sort((left, right) => left - right);

          if (wages.length === 0) {
            return failure(
              records.length === 0 ? "not_found" : "empty_data",
              "未找到符合条件的 H-1B 工资记录。",
            );
          }

          return success({
            filters: {
              employerSlug,
              jobTitle,
              city,
              state,
              socCode,
            },
            count: wages.length,
            wageUnit: "Year" as const,
            min: wages[0]!,
            p25: percentile(wages, 0.25),
            median: percentile(wages, 0.5),
            p75: percentile(wages, 0.75),
            max: wages.at(-1)!,
            fiscalYears: uniqueSorted(
              records.map((record) => record.fiscalYear),
            ),
            jobTitles: topCounts(records.map((record) => record.jobTitle)),
            locations: topCounts(
              records.map(
                (record) => `${record.worksiteCity}, ${record.worksiteState}`,
              ),
            ),
            sampleWarningZh:
              wages.length < 3
                ? "样本少于 3 条，只能作为非常粗略的公开数据参考。"
                : undefined,
          });
        },
      );
    },

    getRelatedEntities(
      input: PublicEmployerBySlugInput,
    ): PublicQueryResult<PublicRelatedEntitiesPayload> {
      const invalidSlug = validateSlugOrFailure(input.slug);
      if (invalidSlug) {
        return invalidSlug;
      }

      const slug = input.slug.trim();
      return runCached("getRelatedEntities", { slug }, () => {
        const employer = getLocalEmployerBySlug(slug, data);

        if (!employer) {
          return failure("not_found", "未找到相关实体对应公司。", "slug");
        }

        const currentRecords = recordsForEmployer(employer.id, data);
        const currentJobTitles = new Set(
          currentRecords.map((record) =>
            normalizeEmployerName(record.jobTitle),
          ),
        );
        const currentSocCodes = new Set(
          currentRecords.map((record) => record.socCode).filter(Boolean),
        );
        const currentLocations = new Set(
          currentRecords.map((record) =>
            normalizeLocationText(`${record.city}, ${record.state}`),
          ),
        );
        const relatedEmployers = data.employers
          .filter((candidate) => candidate.id !== employer.id)
          .map((candidate) => {
            const candidateRecords = recordsForEmployer(candidate.id, data);
            const sharedSignals = new Set<string>();
            let score = 0;

            for (const record of candidateRecords) {
              if (
                currentJobTitles.has(normalizeEmployerName(record.jobTitle))
              ) {
                sharedSignals.add(`职位: ${record.jobTitle}`);
                score += 2;
              }
              if (currentSocCodes.has(record.socCode)) {
                sharedSignals.add(`SOC: ${record.socCode}`);
                score += 2;
              }
              if (
                currentLocations.has(
                  normalizeLocationText(`${record.city}, ${record.state}`),
                )
              ) {
                sharedSignals.add(`地点: ${record.city}, ${record.state}`);
                score += 1;
              }
            }

            return {
              employer: candidate,
              sharedSignals: [...sharedSignals].sort(),
              score,
            };
          })
          .filter((candidate) => candidate.score > 0)
          .sort(
            (left, right) =>
              right.score - left.score ||
              left.employer.displayName.localeCompare(
                right.employer.displayName,
              ),
          )
          .slice(0, 5);

        return success({
          employer,
          relatedEmployers,
          relatedJobTitles: topCounts(
            currentRecords.map((record) => record.jobTitle),
          ),
          relatedLocations: topCounts(
            currentRecords.map((record) => `${record.city}, ${record.state}`),
          ),
        });
      });
    },

    getVisaBulletinDates(
      input: PublicVisaBulletinDatesInput = {},
    ): PublicQueryResult<PublicVisaBulletinDatesPayload> {
      const monthKey = input.monthKey?.trim();
      const category = input.category;
      const chargeabilityArea = input.chargeabilityArea ?? "china-mainland";

      if (monthKey && !MONTH_KEY_PATTERN.test(monthKey)) {
        return failure(
          "invalid_input",
          "Visa Bulletin 月份格式无效。",
          "monthKey",
          "请使用 YYYY-MM 格式，例如 2026-06。",
        );
      }

      if (category && !["EB-1", "EB-2", "EB-3"].includes(category)) {
        return failure("invalid_input", "职业移民类别无效。", "category");
      }

      if (chargeabilityArea !== "china-mainland") {
        return failure(
          "invalid_input",
          "当前 fixture 查询层只支持中国大陆出生 chargeability area。",
          "chargeabilityArea",
        );
      }

      return runCached(
        "getVisaBulletinDates",
        { monthKey, category, chargeabilityArea },
        () => {
          const month = monthKey
            ? data.visaBulletinMonths.find(
                (candidate) => candidate.monthKey === monthKey,
              )
            : getLatestVisaBulletinMonth(data);

          if (!month) {
            return failure(
              data.visaBulletinMonths.length === 0 ? "empty_data" : "not_found",
              "未找到对应月份的 Visa Bulletin 数据。",
              "monthKey",
            );
          }

          const rows = listVisaBulletinRows(month.monthKey, data).filter(
            (row) => !category || row.category === category,
          );

          return success({
            month,
            rows,
            sourceUrl: month.sourceUrl,
            interpretationNoteZh:
              "Visa Bulletin 日期只是公开排期表信号；实际 I-485 filing chart 还需看 USCIS 当月选择和个人情况。",
          });
        },
      );
    },

    cacheStats(): PublicQueryCacheStats {
      return {
        enabled: cacheEnabled,
        size: cache.size,
        hits,
        misses,
        ttlMs: cacheTtlMs,
      };
    },

    clearCache() {
      cache.clear();
      hits = 0;
      misses = 0;
    },
  };
}

export const publicQueryRepository = createPublicQueryRepository();

function success<T>(data: T): PublicQueryResult<T> {
  return {
    ok: true,
    data,
  };
}

function failure(
  code: PublicQueryErrorCode,
  messageZh: string,
  field?: string,
  hintZh?: string,
): PublicQueryResult<never> {
  return {
    ok: false,
    error: {
      code,
      messageZh,
      field,
      hintZh,
    },
  };
}

function normalizeLimit(
  value: number | undefined,
  defaultValue: number,
  maxValue: number,
): PublicQueryResult<number> {
  if (value === undefined) {
    return success(defaultValue);
  }

  if (!Number.isInteger(value) || value < 1) {
    return failure("invalid_input", "limit 必须是正整数。", "limit");
  }

  return success(Math.min(value, maxValue));
}

function recordsForEmployer(
  employerId: string,
  data: FixtureData,
): readonly RelatedSourceRecord[] {
  return [
    ...data.h1bLcaRecords
      .filter((record) => record.employerId === employerId)
      .map(toRelatedRecordFromH1B),
    ...data.permRecords
      .filter((record) => record.employerId === employerId)
      .map(toRelatedRecordFromPerm),
  ];
}

type RelatedSourceRecord = {
  jobTitle: string;
  socCode: string;
  city: string;
  state: string;
};

function toRelatedRecordFromH1B(record: H1BLcaRecord): RelatedSourceRecord {
  return {
    jobTitle: record.jobTitle,
    socCode: record.socCode,
    city: record.worksiteCity,
    state: record.worksiteState,
  };
}

function toRelatedRecordFromPerm(record: PermRecord): RelatedSourceRecord {
  return {
    jobTitle: record.jobTitle,
    socCode: record.socCode,
    city: record.worksiteCity,
    state: record.worksiteState,
  };
}

function stableCacheKey(namespace: string, signature: string, input: object) {
  return `${namespace}:${signature}:${JSON.stringify(sortObjectKeys(input))}`;
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, sortObjectKeys(entryValue)]),
    );
  }

  return value;
}

function getDataSignature(data: FixtureData) {
  return [
    data.employers.length,
    data.h1bLcaRecords.length,
    data.permRecords.length,
    data.pwdRecords.length,
    data.uscisH1BEmployerRecords.length,
    data.visaBulletinMonths.length,
    data.visaBulletinDates.length,
  ].join(":");
}

function percentile(sortedValues: readonly number[], percentileValue: number) {
  if (sortedValues.length === 0) {
    return 0;
  }
  if (sortedValues.length === 1) {
    return sortedValues[0]!;
  }

  const index = (sortedValues.length - 1) * percentileValue;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const lowerValue = sortedValues[lowerIndex]!;
  const upperValue = sortedValues[upperIndex]!;

  if (lowerIndex === upperIndex) {
    return lowerValue;
  }

  return lowerValue + (upperValue - lowerValue) * (index - lowerIndex);
}

function uniqueSorted(values: readonly number[]) {
  return [...new Set(values)].sort((left, right) => right - left);
}

function topCounts(values: readonly string[]) {
  const counts = new Map<string, number>();

  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.value.localeCompare(right.value),
    )
    .slice(0, 8);
}

function normalizeLocationText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
