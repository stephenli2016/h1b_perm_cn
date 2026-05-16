import { localFixtureData } from "@/data/fixtures/local-fixtures";
import {
  calculateCompanyPageMetrics,
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
const MAX_DIRECTORY_TEXT_LENGTH = 120;
const DEFAULT_DIRECTORY_PAGE_SIZE = 2;
const MAX_DIRECTORY_PAGE_SIZE = 50;
const H1B_STATUSES: readonly H1BLcaRecord["caseStatus"][] = [
  "CERTIFIED",
  "WITHDRAWN",
  "DENIED",
];
const PERM_STATUSES: readonly PermRecord["caseStatus"][] = [
  "Certified",
  "Denied",
  "Withdrawn",
];

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

export type PublicDirectorySearchInput = {
  employer?: string;
  fiscalYear?: number;
  state?: string;
  city?: string;
  jobOrSoc?: string;
  caseStatus?: string;
  page?: number;
  pageSize?: number;
};

export type PublicDirectoryFilters = {
  employer?: string;
  fiscalYear?: number;
  state?: string;
  city?: string;
  jobOrSoc?: string;
  caseStatus?: string;
  hasActiveFilters: boolean;
};

export type PublicDirectoryPagination = {
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PublicDirectoryFilterOptions = {
  fiscalYears: readonly number[];
  states: readonly string[];
  caseStatuses: readonly string[];
};

export type PublicDisclosureRecordRow = {
  id: string;
  employer: Employer;
  companyHref: string;
  caseNumber: string;
  caseStatus: string;
  fiscalYear: number;
  jobTitle: string;
  socCode: string;
  socTitle: string;
  city: string;
  state: string;
  wageAmount: number;
  wageUnit: "Year" | "Hour";
  decisionDate: string;
  sourceFileId: string;
  dataSource: "h1b_lca" | "perm";
};

export type PublicDisclosureSearchPayload = {
  dataset: "h1b" | "perm";
  filters: PublicDirectoryFilters;
  pagination: PublicDirectoryPagination;
  records: readonly PublicDisclosureRecordRow[];
  availableFilters: PublicDirectoryFilterOptions;
  sourceNames: readonly string[];
  latestDataDate?: string;
  interpretationNoteZh: string;
  seo: {
    noindex: true;
    noindexReasonZh: string;
  };
};

export type PublicCompanyDirectoryResult = {
  employer: Employer;
  h1bRecordCount: number;
  permRecordCount: number;
  matchedRecordCount: number;
  latestFiscalYear: number;
  topJobTitles: readonly { value: string; count: number }[];
  topLocations: readonly { value: string; count: number }[];
  qualityScore: number;
  indexable: boolean;
  noindexReason?: string;
};

export type PublicCompanyDirectoryPayload = {
  filters: PublicDirectoryFilters;
  pagination: PublicDirectoryPagination;
  results: readonly PublicCompanyDirectoryResult[];
  availableFilters: PublicDirectoryFilterOptions;
  sourceNames: readonly string[];
  latestDataDate?: string;
  interpretationNoteZh: string;
  seo: {
    noindex: true;
    noindexReasonZh: string;
  };
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

    searchH1BRecords(
      input: PublicDirectorySearchInput = {},
    ): PublicQueryResult<PublicDisclosureSearchPayload> {
      const normalized = normalizeDirectoryInput(input, H1B_STATUSES);

      if (!normalized.ok) {
        return normalized;
      }

      return runCached("searchH1BRecords", normalized.data, () => {
        const allRows = data.h1bLcaRecords
          .map((record) => toH1BDirectoryRow(record, data))
          .filter((row): row is PublicDisclosureRecordRow => Boolean(row))
          .sort(compareDirectoryRows);
        const rows = allRows.filter((row) =>
          matchesDirectoryFilters(row, normalized.data.filters),
        );
        const paginated = paginate(
          rows,
          normalized.data.page,
          normalized.data.pageSize,
        );
        const sourceInfo = summarizeSourceFiles(
          allRows.map((row) => row.sourceFileId),
          data,
        );

        return success({
          dataset: "h1b" as const,
          filters: normalized.data.filters,
          pagination: paginated.pagination,
          records: paginated.items,
          availableFilters: getDirectoryFilterOptions(allRows),
          sourceNames: sourceInfo.sourceNames,
          latestDataDate: sourceInfo.latestDataDate,
          interpretationNoteZh:
            "LCA 是 H-1B 流程中的劳工条件申请记录，不等于 H-1B petition 批准，也不代表雇主实际录用或未来承诺。",
          seo: noindexDirectorySeo(normalized.data.filters),
        });
      });
    },

    searchPermRecords(
      input: PublicDirectorySearchInput = {},
    ): PublicQueryResult<PublicDisclosureSearchPayload> {
      const normalized = normalizeDirectoryInput(input, PERM_STATUSES);

      if (!normalized.ok) {
        return normalized;
      }

      return runCached("searchPermRecords", normalized.data, () => {
        const allRows = data.permRecords
          .map((record) => toPermDirectoryRow(record, data))
          .filter((row): row is PublicDisclosureRecordRow => Boolean(row))
          .sort(compareDirectoryRows);
        const rows = allRows.filter((row) =>
          matchesDirectoryFilters(row, normalized.data.filters),
        );
        const paginated = paginate(
          rows,
          normalized.data.page,
          normalized.data.pageSize,
        );
        const sourceInfo = summarizeSourceFiles(
          allRows.map((row) => row.sourceFileId),
          data,
        );

        return success({
          dataset: "perm" as const,
          filters: normalized.data.filters,
          pagination: paginated.pagination,
          records: paginated.items,
          availableFilters: getDirectoryFilterOptions(allRows),
          sourceNames: sourceInfo.sourceNames,
          latestDataDate: sourceInfo.latestDataDate,
          interpretationNoteZh:
            "PERM certification 是劳工认证公开记录，不等于 I-140、I-485 或绿卡最终获批。",
          seo: noindexDirectorySeo(normalized.data.filters),
        });
      });
    },

    searchCompanyDirectory(
      input: PublicDirectorySearchInput = {},
    ): PublicQueryResult<PublicCompanyDirectoryPayload> {
      const normalized = normalizeDirectoryInput(input, [
        ...H1B_STATUSES,
        ...PERM_STATUSES,
      ]);

      if (!normalized.ok) {
        return normalized;
      }

      return runCached("searchCompanyDirectory", normalized.data, () => {
        const allRows = [
          ...data.h1bLcaRecords
            .map((record) => toH1BDirectoryRow(record, data))
            .filter((row): row is PublicDisclosureRecordRow => Boolean(row)),
          ...data.permRecords
            .map((record) => toPermDirectoryRow(record, data))
            .filter((row): row is PublicDisclosureRecordRow => Boolean(row)),
        ].sort(compareDirectoryRows);
        const rows = allRows.filter((row) =>
          matchesDirectoryFilters(row, normalized.data.filters),
        );
        const metricsByEmployerId = new Map(
          calculateCompanyPageMetrics(data).map((metrics) => [
            metrics.employerId,
            metrics,
          ]),
        );
        const grouped = new Map<string, PublicDisclosureRecordRow[]>();

        for (const row of rows) {
          grouped.set(row.employer.id, [
            ...(grouped.get(row.employer.id) ?? []),
            row,
          ]);
        }

        const results = [...grouped.entries()]
          .map(([employerId, employerRows]) => {
            const employer = employerRows[0]!.employer;
            const metrics = metricsByEmployerId.get(employerId);

            return {
              employer,
              h1bRecordCount: employerRows.filter(
                (row) => row.dataSource === "h1b_lca",
              ).length,
              permRecordCount: employerRows.filter(
                (row) => row.dataSource === "perm",
              ).length,
              matchedRecordCount: employerRows.length,
              latestFiscalYear: Math.max(
                ...employerRows.map((row) => row.fiscalYear),
              ),
              topJobTitles: topCounts(employerRows.map((row) => row.jobTitle)),
              topLocations: topCounts(
                employerRows.map((row) => `${row.city}, ${row.state}`),
              ),
              qualityScore: metrics?.qualityScore ?? 0,
              indexable: metrics?.indexable ?? false,
              noindexReason: metrics?.noindexReason,
            };
          })
          .sort(compareCompanyDirectoryResults);
        const paginated = paginate(
          results,
          normalized.data.page,
          normalized.data.pageSize,
        );
        const sourceInfo = summarizeSourceFiles(
          allRows.map((row) => row.sourceFileId),
          data,
        );

        return success({
          filters: normalized.data.filters,
          pagination: paginated.pagination,
          results: paginated.items,
          availableFilters: getDirectoryFilterOptions(allRows),
          sourceNames: sourceInfo.sourceNames,
          latestDataDate: sourceInfo.latestDataDate,
          interpretationNoteZh:
            "公司目录把 H-1B LCA 与 PERM 公开记录作为雇主信号合并展示，不代表个案批准、实际招聘或未来 sponsor 承诺。",
          seo: noindexDirectorySeo(normalized.data.filters),
        });
      });
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

type NormalizedDirectoryInput = {
  filters: PublicDirectoryFilters;
  page: number;
  pageSize: number;
};

function normalizeDirectoryInput(
  input: PublicDirectorySearchInput,
  allowedStatuses: readonly string[],
): PublicQueryResult<NormalizedDirectoryInput> {
  const employer = trimOptionalDirectoryText(input.employer, "employer");
  if (!employer.ok) {
    return employer;
  }

  const city = trimOptionalDirectoryText(input.city, "city");
  if (!city.ok) {
    return city;
  }

  const jobOrSoc = trimOptionalDirectoryText(input.jobOrSoc, "jobOrSoc");
  if (!jobOrSoc.ok) {
    return jobOrSoc;
  }

  const fiscalYear = normalizeFiscalYear(input.fiscalYear);
  if (!fiscalYear.ok) {
    return fiscalYear;
  }

  const state = normalizeOptionalState(input.state);
  if (!state.ok) {
    return state;
  }

  const caseStatus = normalizeOptionalCaseStatus(
    input.caseStatus,
    allowedStatuses,
  );
  if (!caseStatus.ok) {
    return caseStatus;
  }

  const page = normalizePage(input.page);
  if (!page.ok) {
    return page;
  }

  const pageSize = normalizeLimit(
    input.pageSize,
    DEFAULT_DIRECTORY_PAGE_SIZE,
    MAX_DIRECTORY_PAGE_SIZE,
  );
  if (!pageSize.ok) {
    return pageSize;
  }

  const filters = {
    employer: employer.data,
    fiscalYear: fiscalYear.data,
    state: state.data,
    city: city.data,
    jobOrSoc: jobOrSoc.data,
    caseStatus: caseStatus.data,
    hasActiveFilters: Boolean(
      employer.data ||
      fiscalYear.data ||
      state.data ||
      city.data ||
      jobOrSoc.data ||
      caseStatus.data,
    ),
  };

  return success({
    filters,
    page: page.data,
    pageSize: pageSize.data,
  });
}

function trimOptionalDirectoryText(
  value: string | undefined,
  field: string,
): PublicQueryResult<string | undefined> {
  const trimmed = value?.trim();

  if (!trimmed) {
    return success(undefined);
  }

  if (trimmed.length > MAX_DIRECTORY_TEXT_LENGTH) {
    return failure(
      "invalid_input",
      "筛选条件太长。",
      field,
      `请控制在 ${MAX_DIRECTORY_TEXT_LENGTH} 个字符以内。`,
    );
  }

  return success(trimmed);
}

function normalizeFiscalYear(
  value: number | undefined,
): PublicQueryResult<number | undefined> {
  if (value === undefined) {
    return success(undefined);
  }

  if (!Number.isInteger(value) || value < 2000 || value > 2100) {
    return failure(
      "invalid_input",
      "Fiscal year 格式无效。",
      "fiscalYear",
      "请使用四位年份，例如 2025。",
    );
  }

  return success(value);
}

function normalizeOptionalState(
  value: string | undefined,
): PublicQueryResult<string | undefined> {
  const state = value?.trim().toUpperCase();

  if (!state) {
    return success(undefined);
  }

  if (!/^[A-Z]{2}$/.test(state)) {
    return failure("invalid_input", "州代码格式无效。", "state");
  }

  return success(state);
}

function normalizeOptionalCaseStatus(
  value: string | undefined,
  allowedStatuses: readonly string[],
): PublicQueryResult<string | undefined> {
  const trimmed = value?.trim();

  if (!trimmed) {
    return success(undefined);
  }

  const matchedStatus = allowedStatuses.find(
    (status) => status.toLowerCase() === trimmed.toLowerCase(),
  );

  if (!matchedStatus) {
    return failure(
      "invalid_input",
      "Case status 不在当前数据集支持范围内。",
      "caseStatus",
      `可选状态：${allowedStatuses.join(", ")}。`,
    );
  }

  return success(matchedStatus);
}

function normalizePage(value: number | undefined): PublicQueryResult<number> {
  if (value === undefined) {
    return success(1);
  }

  if (!Number.isInteger(value) || value < 1) {
    return failure("invalid_input", "page 必须是正整数。", "page");
  }

  return success(value);
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

function toH1BDirectoryRow(
  record: H1BLcaRecord,
  data: FixtureData,
): PublicDisclosureRecordRow | undefined {
  const employer = data.employers.find(
    (candidate) => candidate.id === record.employerId,
  );

  if (!employer) {
    return undefined;
  }

  return {
    id: record.id,
    employer,
    companyHref: `/h1b/company/${employer.slug}`,
    caseNumber: record.caseNumber,
    caseStatus: record.caseStatus,
    fiscalYear: record.fiscalYear,
    jobTitle: record.jobTitle,
    socCode: record.socCode,
    socTitle: record.socTitle,
    city: record.worksiteCity,
    state: record.worksiteState,
    wageAmount: record.annualizedWageFrom,
    wageUnit: "Year",
    decisionDate: record.decisionDate,
    sourceFileId: record.sourceFileId,
    dataSource: "h1b_lca",
  };
}

function toPermDirectoryRow(
  record: PermRecord,
  data: FixtureData,
): PublicDisclosureRecordRow | undefined {
  const employer = data.employers.find(
    (candidate) => candidate.id === record.employerId,
  );

  if (!employer) {
    return undefined;
  }

  return {
    id: record.id,
    employer,
    companyHref: `/perm/company/${employer.slug}`,
    caseNumber: record.caseNumber,
    caseStatus: record.caseStatus,
    fiscalYear: record.fiscalYear,
    jobTitle: record.jobTitle,
    socCode: record.socCode,
    socTitle: record.socTitle,
    city: record.worksiteCity,
    state: record.worksiteState,
    wageAmount: record.wageOfferFrom,
    wageUnit: record.wageUnit,
    decisionDate: record.decisionDate,
    sourceFileId: record.sourceFileId,
    dataSource: "perm",
  };
}

function matchesDirectoryFilters(
  row: PublicDisclosureRecordRow,
  filters: PublicDirectoryFilters,
) {
  if (filters.employer) {
    const employerQuery = normalizeEmployerName(filters.employer);
    const rawEmployerQuery = filters.employer.toLowerCase();
    const employerValues = [
      row.employer.canonicalName,
      row.employer.displayName,
      row.employer.normalizedName,
    ].map(normalizeEmployerName);
    const rawEmployerValues = [
      row.employer.canonicalName,
      row.employer.displayName,
      row.employer.normalizedName,
    ].map((value) => value.toLowerCase());
    const matchedByNormalizedName =
      employerQuery &&
      employerValues.some((value) => value.includes(employerQuery));
    const matchedByRawName = rawEmployerValues.some((value) =>
      value.includes(rawEmployerQuery),
    );

    if (!matchedByNormalizedName && !matchedByRawName) {
      return false;
    }
  }

  if (filters.fiscalYear && row.fiscalYear !== filters.fiscalYear) {
    return false;
  }

  if (filters.state && row.state.toUpperCase() !== filters.state) {
    return false;
  }

  if (
    filters.city &&
    !normalizeLocationText(row.city).includes(
      normalizeLocationText(filters.city),
    )
  ) {
    return false;
  }

  if (filters.jobOrSoc) {
    const normalizedJob = normalizeEmployerName(filters.jobOrSoc);
    const normalizedSoc = filters.jobOrSoc.trim().toLowerCase();
    const rowValues = [row.jobTitle, row.socTitle, row.socCode].map((value) =>
      value.toLowerCase(),
    );
    const matched = rowValues.some((value) => value.includes(normalizedSoc));
    const matchedByNormalizedText =
      normalizeEmployerName(row.jobTitle).includes(normalizedJob) ||
      normalizeEmployerName(row.socTitle).includes(normalizedJob);

    if (!matched && !matchedByNormalizedText) {
      return false;
    }
  }

  if (
    filters.caseStatus &&
    row.caseStatus.toLowerCase() !== filters.caseStatus.toLowerCase()
  ) {
    return false;
  }

  return true;
}

function paginate<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize: number,
) {
  const totalResults = items.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      totalResults,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
}

function getDirectoryFilterOptions(
  rows: readonly PublicDisclosureRecordRow[],
): PublicDirectoryFilterOptions {
  return {
    fiscalYears: uniqueSorted(rows.map((row) => row.fiscalYear)),
    states: uniqueStrings(rows.map((row) => row.state.toUpperCase())),
    caseStatuses: uniqueCaseStatuses(rows.map((row) => row.caseStatus)),
  };
}

function summarizeSourceFiles(
  sourceFileIds: readonly string[],
  data: FixtureData,
) {
  const sourceIds = new Set(sourceFileIds);
  const sourceFiles = data.sourceFiles.filter((sourceFile) =>
    sourceIds.has(sourceFile.id),
  );

  return {
    sourceNames: uniqueStrings(sourceFiles.map((source) => source.sourceName)),
    latestDataDate: sourceFiles
      .map((sourceFile) => sourceFile.latestDataDate)
      .filter((date): date is string => Boolean(date))
      .sort()
      .at(-1),
  };
}

function noindexDirectorySeo(filters: PublicDirectoryFilters) {
  return {
    noindex: true as const,
    noindexReasonZh: filters.hasActiveFilters
      ? "筛选组合 URL 默认 noindex，避免把低价值参数组合提交给搜索引擎。"
      : "当前目录仍使用 fixture / 本地数据，生产数据质量达标前保持 noindex。",
  };
}

function compareDirectoryRows(
  left: PublicDisclosureRecordRow,
  right: PublicDisclosureRecordRow,
) {
  return (
    right.fiscalYear - left.fiscalYear ||
    right.decisionDate.localeCompare(left.decisionDate) ||
    left.employer.displayName.localeCompare(right.employer.displayName) ||
    left.caseNumber.localeCompare(right.caseNumber)
  );
}

function compareCompanyDirectoryResults(
  left: PublicCompanyDirectoryResult,
  right: PublicCompanyDirectoryResult,
) {
  return (
    right.matchedRecordCount - left.matchedRecordCount ||
    right.qualityScore - left.qualityScore ||
    left.employer.displayName.localeCompare(right.employer.displayName)
  );
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

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))].sort();
}

function uniqueCaseStatuses(values: readonly string[]) {
  const statuses = new Map<string, string>();

  for (const value of values.filter(Boolean)) {
    const key = value.toLowerCase();

    if (!statuses.has(key)) {
      statuses.set(key, value);
    }
  }

  return [...statuses.values()].sort((left, right) =>
    left.localeCompare(right),
  );
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
