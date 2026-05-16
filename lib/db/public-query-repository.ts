import { localFixtureData } from "@/data/fixtures/local-fixtures";
import {
  calculateCompanyPageMetrics,
  checkVisaBulletinPriorityDate as checkLocalVisaBulletinPriorityDate,
  getCompanyIndexabilityDecision,
  getEmployerBySlug as getLocalEmployerBySlug,
  getEmployerImmigrationSummary,
  getLatestVisaBulletinMonth,
  listVisaBulletinRows,
  lookupPrevailingWage,
  matchWageAmountToLevels,
  normalizeEmployerName,
  searchEmployers as searchLocalEmployers,
  type PrevailingWageLookupResult,
  type WageLevelMatchResult,
} from "@/lib/db/local-repository";
import type {
  CompanyPageMetrics,
  Employer,
  FixtureData,
  H1BLcaRecord,
  PermRecord,
  PwdRecord,
  VisaBulletinDate,
  VisaBulletinMonth,
} from "@/lib/db/types";
import {
  listCompanyStaticSlugs as selectCompanyStaticSlugs,
  COMPANY_PAGE_VISIBLE_LIMITS,
  EXPANDED_COMPANY_PAGE_TARGET,
} from "@/lib/seo/company-page-selection";
import type { CompanyPageMode } from "@/lib/seo/company-quality";

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const SOC_CODE_PATTERN = /^\d{2}-\d{4}$/;
const MAX_DIRECTORY_TEXT_LENGTH = 120;
const MAX_WAGE_LOOKUP_TEXT_LENGTH = 120;
const DEFAULT_DIRECTORY_PAGE_SIZE = 2;
const MAX_DIRECTORY_PAGE_SIZE = 50;
const ANNUAL_HOURS = 2080;
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
const VISA_BULLETIN_CATEGORIES: readonly VisaBulletinDate["category"][] = [
  "EB-1",
  "EB-2",
  "EB-3",
];
const VISA_BULLETIN_CHART_TYPES: readonly VisaBulletinDate["chartType"][] = [
  "final_action",
  "dates_for_filing",
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

export type PublicH1BWageLevelCheckInput = {
  socOrJobTitle?: string;
  city?: string;
  state?: string;
  offeredWage?: number;
  wageYear?: number;
  wageUnit?: "Year" | "Hour";
};

export type PublicResolvedSocCode = {
  socCode: string;
  socTitle: string;
  matchMethod: "soc_code" | "pwd_soc_title" | "h1b_job_title";
  matchedLabel: string;
  alternativeSocCodes: readonly {
    socCode: string;
    socTitle: string;
    matchScore: number;
  }[];
};

export type PublicWageLevelRow = {
  level: 1 | 2 | 3 | 4;
  amount: number;
};

export type PublicWageLevelComparison = {
  band: WageLevelMatchResult["band"];
  labelZh: string;
  messageZh: string;
  cautionLevel: "low" | "medium" | "high";
  offeredWageForComparison: number;
  offeredWageUnitForComparison: "Year" | "Hour";
  lowerLevel?: 1 | 2 | 3 | 4;
  lowerAmount?: number;
  nextLevel?: 1 | 2 | 3 | 4;
  nextAmount?: number;
};

export type PublicWageUnitConversion = {
  originalAmount: number;
  originalUnit: "Year" | "Hour";
  comparisonAmount: number;
  comparisonUnit: "Year" | "Hour";
  noteZh: string;
};

export type PublicH1BWageLevelCheckPayload = {
  input: {
    socOrJobTitle: string;
    city?: string;
    state: string;
    offeredWage: number;
    wageYear: number;
    wageUnit: "Year" | "Hour";
  };
  resolvedSoc: PublicResolvedSocCode;
  lookupStatus: PrevailingWageLookupResult["status"];
  matchScope?: PrevailingWageLookupResult["matchScope"];
  wageRecord?: {
    id: string;
    effectiveYear: number;
    socCode: string;
    socTitle: string;
    areaName: string;
    city: string;
    state: string;
    dataSeries: string;
    wageUnit: "Year" | "Hour";
    levels: readonly PublicWageLevelRow[];
  };
  comparison?: PublicWageLevelComparison;
  unitConversion?: PublicWageUnitConversion;
  related: {
    sampleCount: number;
    sampleWarningZh?: string;
    companies: readonly {
      employer: Employer;
      href: string;
      recordCount: number;
      medianAnnualWage?: number;
    }[];
    jobTitles: readonly { value: string; count: number }[];
    locations: readonly { value: string; count: number }[];
  };
  sourceNames: readonly string[];
  latestDataDate?: string;
  interpretationNoteZh: string;
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

export type PublicVisaBulletinPriorityDateInput = {
  monthKey?: string;
  category?: VisaBulletinDate["category"];
  chargeabilityArea?: VisaBulletinDate["chargeabilityArea"];
  priorityDate?: string;
  chartType?: VisaBulletinDate["chartType"];
};

export type PublicVisaBulletinPriorityDatePayload = {
  input: {
    monthKey: string;
    category: VisaBulletinDate["category"];
    chargeabilityArea: VisaBulletinDate["chargeabilityArea"];
    priorityDate: string;
    chartType: VisaBulletinDate["chartType"];
  };
  month: VisaBulletinMonth;
  selectedDate: VisaBulletinDate;
  rows: PublicVisaBulletinDatesPayload["rows"];
  resultStatus: "current" | "current_all" | "not_current" | "unavailable";
  isCurrentOnSelectedChart: boolean;
  selectedChartUsableForAdjustment: boolean;
  sourceUrl: string;
  sourceNames: readonly string[];
  interpretationNoteZh: string;
  uscisFilingChartNoteZh: string;
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

export type PublicCompanyFiscalYearSummary = {
  fiscalYear: number;
  h1bTotal: number;
  h1bCertified: number;
  h1bWithdrawn: number;
  h1bDenied: number;
  permTotal: number;
  permCertified: number;
  permDenied: number;
  permWithdrawn: number;
};

export type PublicCompanyBreakdownRow = {
  key: string;
  label: string;
  socCode?: string;
  socTitle?: string;
  city?: string;
  state?: string;
  h1bCount: number;
  permCount: number;
  totalCount: number;
};

export type PublicCompanyPermTimelineRow = {
  id: string;
  fiscalYear: number;
  caseNumber: string;
  caseStatus: PermRecord["caseStatus"];
  jobTitle: string;
  socCode: string;
  socTitle: string;
  city: string;
  state: string;
  wageOfferFrom: number;
  wageUnit: PermRecord["wageUnit"];
  priorityDate?: string;
  receivedDate: string;
  decisionDate: string;
};

export type PublicCompanyWageDistribution = {
  count: number;
  wageUnit: "Year";
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  fiscalYears: readonly number[];
  sampleWarningZh?: string;
};

export type PublicCompanyProfilePayload = {
  employer: Employer;
  aliases: readonly string[];
  metrics?: CompanyPageMetrics;
  h1b: PublicH1BSummaryPayload["h1b"];
  perm: PublicPermSummaryPayload["perm"];
  uscis: PublicH1BSummaryPayload["uscis"];
  fiscalYears: readonly PublicCompanyFiscalYearSummary[];
  h1bRecentRecords: readonly PublicDisclosureRecordRow[];
  permTimeline: readonly PublicCompanyPermTimelineRow[];
  jobBreakdown: readonly PublicCompanyBreakdownRow[];
  locationBreakdown: readonly PublicCompanyBreakdownRow[];
  wageDistribution?: PublicCompanyWageDistribution;
  relatedCompanies: PublicRelatedEntitiesPayload["relatedEmployers"];
  relatedJobTitles: PublicRelatedEntitiesPayload["relatedJobTitles"];
  relatedLocations: PublicRelatedEntitiesPayload["relatedLocations"];
  sourceNames: readonly string[];
  latestDataDate?: string;
  interpretationNoteZh: string;
  seo: {
    indexable: boolean;
    noindex: boolean;
    qualityScore: number;
    matchedThresholds: readonly string[];
    noindexReason?: string;
    noindexReasonZh?: string;
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

    listCompanySlugs() {
      return data.employers
        .map((employer) => employer.slug)
        .sort((left, right) => left.localeCompare(right));
    },

    listCompanyStaticSlugs(
      mode: CompanyPageMode,
      limit = EXPANDED_COMPANY_PAGE_TARGET,
    ) {
      return selectCompanyStaticSlugs(data, mode, limit);
    },

    listVisaBulletinMonths() {
      return [...data.visaBulletinMonths].sort((left, right) =>
        right.monthKey.localeCompare(left.monthKey),
      );
    },

    getCompanyProfileBySlug(
      input: PublicEmployerBySlugInput,
    ): PublicQueryResult<PublicCompanyProfilePayload> {
      const invalidSlug = validateSlugOrFailure(input.slug);
      if (invalidSlug) {
        return invalidSlug;
      }

      const slug = input.slug.trim();
      return runCached("getCompanyProfileBySlug", { slug }, () => {
        const summary = getEmployerImmigrationSummary(slug, data);

        if (!summary) {
          return failure(
            "not_found",
            "未找到对应公司的公开数据页面。",
            "slug",
            "请检查公司 URL，或从公司目录重新进入。",
          );
        }

        const employer = summary.employer;
        const h1bRecords = data.h1bLcaRecords.filter(
          (record) => record.employerId === employer.id,
        );
        const permRecords = data.permRecords.filter(
          (record) => record.employerId === employer.id,
        );
        const uscisRecords = data.uscisH1BEmployerRecords.filter(
          (record) => record.employerId === employer.id,
        );
        const sourceInfo = summarizeSourceFiles(
          [
            ...h1bRecords.map((record) => record.sourceFileId),
            ...permRecords.map((record) => record.sourceFileId),
            ...uscisRecords.map((record) => record.sourceFileId),
          ],
          data,
        );
        const metrics = calculateCompanyPageMetrics(data).find(
          (candidate) => candidate.employerId === employer.id,
        );
        const related = buildRelatedEntities(employer, data);
        const indexability = metrics
          ? getCompanyIndexabilityDecision(metrics)
          : undefined;

        return success({
          employer,
          aliases: data.employerAliases
            .filter((alias) => alias.employerId === employer.id)
            .map((alias) => alias.rawName)
            .sort((left, right) => left.localeCompare(right)),
          metrics,
          h1b: summary.h1b,
          perm: summary.perm,
          uscis: summary.uscis,
          fiscalYears: buildCompanyFiscalYears(h1bRecords, permRecords),
          h1bRecentRecords: h1bRecords
            .map((record) => toH1BDirectoryRow(record, data))
            .filter((row): row is PublicDisclosureRecordRow => Boolean(row))
            .sort(compareDirectoryRows)
            .slice(0, COMPANY_PAGE_VISIBLE_LIMITS.h1bRecentRecords),
          permTimeline: buildPermTimeline(permRecords),
          jobBreakdown: buildJobBreakdown(h1bRecords, permRecords),
          locationBreakdown: buildLocationBreakdown(h1bRecords, permRecords),
          wageDistribution: buildCompanyWageDistribution(h1bRecords),
          relatedCompanies: related.relatedEmployers,
          relatedJobTitles: related.relatedJobTitles,
          relatedLocations: related.relatedLocations,
          sourceNames: sourceInfo.sourceNames,
          latestDataDate: sourceInfo.latestDataDate,
          interpretationNoteZh:
            "公司页把 H-1B LCA、PERM 和 USCIS Employer Data Hub 公开记录作为历史活动信号展示，不代表个案批准、实际录用、未来 sponsor 承诺或法律意见。",
          seo: {
            indexable: indexability?.indexable ?? false,
            noindex: !(indexability?.indexable ?? false),
            qualityScore: metrics?.qualityScore ?? 0,
            matchedThresholds: indexability?.matchedThresholds ?? [],
            noindexReason: indexability?.noindexReason,
            noindexReasonZh: indexability?.noindexReasonZh,
          },
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

    checkH1BWageLevel(
      input: PublicH1BWageLevelCheckInput,
    ): PublicQueryResult<PublicH1BWageLevelCheckPayload> {
      const normalized = normalizeWageLevelCheckInput(input);
      if (!normalized.ok) {
        return normalized;
      }

      return runCached("checkH1BWageLevel", normalized.data, () => {
        const resolvedSoc = resolveSocCode(normalized.data.socOrJobTitle, data);
        if (!resolvedSoc) {
          return failure(
            "not_found",
            "未能从 SOC code 或职位关键词匹配到可用的工资数据。",
            "socOrJobTitle",
            "请尝试输入标准 SOC code，例如 15-1252，或使用更接近公开数据中的英文职位名称。",
          );
        }

        const lookup = lookupPrevailingWage(
          {
            socCode: resolvedSoc.socCode,
            city: normalized.data.city,
            state: normalized.data.state,
            effectiveYear: normalized.data.wageYear,
          },
          data,
        );
        const related = buildWageLevelRelatedData(
          resolvedSoc.socCode,
          normalized.data.city,
          normalized.data.state,
          data,
        );
        const sourceIds = [
          lookup.record?.sourceFileId,
          ...related.sourceFileIds,
        ].filter((sourceId): sourceId is string => Boolean(sourceId));
        const sourceInfo = summarizeSourceFiles(sourceIds, data);

        if (!lookup.record) {
          return failure(
            "not_found",
            "未找到匹配该 SOC、州和年份的 prevailing wage 记录。",
            "socOrJobTitle",
            "可以先保留 SOC code，尝试去掉城市或换一个已覆盖的 wage year。",
          );
        }

        const normalizedWage = normalizeWageForComparison(
          normalized.data.offeredWage,
          normalized.data.wageUnit,
          lookup.record.wageUnit,
        );
        const comparison = buildWageLevelComparison(
          matchWageAmountToLevels(lookup.record, normalizedWage.amount),
          normalizedWage.amount,
          lookup.record.wageUnit,
        );

        return success({
          input: normalized.data,
          resolvedSoc,
          lookupStatus: lookup.status,
          matchScope: lookup.matchScope,
          wageRecord: toPublicWageRecord(lookup.record),
          comparison,
          unitConversion: normalizedWage.conversion,
          related: related.payload,
          sourceNames: sourceInfo.sourceNames,
          latestDataDate: sourceInfo.latestDataDate,
          interpretationNoteZh:
            "此工具只把输入工资与 DOL/FLAG prevailing wage level 公开数值做近似对照；它不判断职位职责、case 分类、LCA/PWD 填写是否正确，也不构成法律、移民、税务或职业建议。",
        });
      });
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

        return success(buildRelatedEntities(employer, data));
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

    checkVisaBulletinPriorityDate(
      input: PublicVisaBulletinPriorityDateInput,
    ): PublicQueryResult<PublicVisaBulletinPriorityDatePayload> {
      const normalized = normalizeVisaBulletinPriorityDateInput(input);
      if (!normalized.ok) {
        return normalized;
      }

      return runCached("checkVisaBulletinPriorityDate", normalized.data, () => {
        const month = normalized.data.monthKey
          ? data.visaBulletinMonths.find(
              (candidate) => candidate.monthKey === normalized.data.monthKey,
            )
          : getLatestVisaBulletinMonth(data);

        if (!month) {
          return failure(
            data.visaBulletinMonths.length === 0 ? "empty_data" : "not_found",
            "未找到对应月份的 Visa Bulletin 数据。",
            "monthKey",
          );
        }

        const localResult = checkLocalVisaBulletinPriorityDate(
          {
            monthKey: month.monthKey,
            category: normalized.data.category,
            chargeabilityArea: normalized.data.chargeabilityArea,
            chartType: normalized.data.chartType,
            priorityDate: normalized.data.priorityDate,
          },
          data,
        );

        if (localResult.status === "not_found" || !localResult.date) {
          return failure(
            "not_found",
            "未找到对应类别、地区和图表的排期记录。",
            "category",
          );
        }

        return success({
          input: {
            ...normalized.data,
            monthKey: month.monthKey,
          },
          month,
          selectedDate: localResult.date,
          rows: listVisaBulletinRows(month.monthKey, data),
          resultStatus:
            localResult.status === "current" &&
            localResult.date.cutoffStatus === "current"
              ? "current_all"
              : localResult.status,
          isCurrentOnSelectedChart: localResult.canProceedByChart,
          selectedChartUsableForAdjustment:
            normalized.data.chartType === month.uscisFilingChart,
          sourceUrl: month.sourceUrl,
          sourceNames: [
            "U.S. Department of State Visa Bulletin",
            "USCIS Adjustment of Status filing chart",
          ],
          interpretationNoteZh: `${localResult.messageZh} 这个结果只回答优先日与所选公开表格的日期关系，不判断 I-485 是否一定可交、是否能获批，或任何个人法律结论。`,
          uscisFilingChartNoteZh: buildUscisFilingChartNote(
            normalized.data.chartType,
            month.uscisFilingChart,
          ),
        });
      });
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

function normalizeWageLevelCheckInput(
  input: PublicH1BWageLevelCheckInput,
): PublicQueryResult<PublicH1BWageLevelCheckPayload["input"]> {
  const socOrJobTitle = input.socOrJobTitle?.trim();
  const city = input.city?.trim();
  const state = input.state?.trim().toUpperCase();
  const wageUnit = input.wageUnit ?? "Year";
  const offeredWage = input.offeredWage;
  const wageYear = input.wageYear;

  if (!socOrJobTitle) {
    return failure(
      "invalid_input",
      "请输入 SOC code 或英文职位关键词。",
      "socOrJobTitle",
      "例如 15-1252、Software Developers 或 Software Engineer。",
    );
  }

  if (
    socOrJobTitle.length < 2 ||
    socOrJobTitle.length > MAX_WAGE_LOOKUP_TEXT_LENGTH
  ) {
    return failure(
      "invalid_input",
      "SOC/职位关键词长度无效。",
      "socOrJobTitle",
      `请控制在 2-${MAX_WAGE_LOOKUP_TEXT_LENGTH} 个字符以内。`,
    );
  }

  if (!state || !/^[A-Z]{2}$/.test(state)) {
    return failure(
      "invalid_input",
      "请输入两位美国州代码。",
      "state",
      "例如 WA、CA、TX、NY。",
    );
  }

  if (city && city.length > MAX_WAGE_LOOKUP_TEXT_LENGTH) {
    return failure(
      "invalid_input",
      "城市名称太长。",
      "city",
      `请控制在 ${MAX_WAGE_LOOKUP_TEXT_LENGTH} 个字符以内。`,
    );
  }

  if (!Number.isFinite(offeredWage) || offeredWage === undefined) {
    return failure(
      "invalid_input",
      "请输入 offered wage 数字。",
      "offeredWage",
      "请只输入数字，不需要输入 $ 或逗号。",
    );
  }

  if (offeredWage <= 0 || offeredWage > 10_000_000) {
    return failure(
      "invalid_input",
      "offered wage 数值无效。",
      "offeredWage",
      "请确认工资单位是年薪或时薪，并输入正数。",
    );
  }

  if (!Number.isInteger(wageYear) || wageYear === undefined) {
    return failure(
      "invalid_input",
      "请输入 wage year。",
      "wageYear",
      "请使用四位年份，例如 2025。",
    );
  }

  if (wageYear < 2000 || wageYear > 2100) {
    return failure(
      "invalid_input",
      "wage year 格式无效。",
      "wageYear",
      "请使用四位年份，例如 2025。",
    );
  }

  if (!["Year", "Hour"].includes(wageUnit)) {
    return failure(
      "invalid_input",
      "工资单位无效。",
      "wageUnit",
      "当前只支持 Year 或 Hour。",
    );
  }

  return success({
    socOrJobTitle,
    city,
    state,
    offeredWage,
    wageYear,
    wageUnit,
  });
}

function normalizeVisaBulletinPriorityDateInput(
  input: PublicVisaBulletinPriorityDateInput,
): PublicQueryResult<{
  monthKey?: string;
  category: VisaBulletinDate["category"];
  chargeabilityArea: VisaBulletinDate["chargeabilityArea"];
  priorityDate: string;
  chartType: VisaBulletinDate["chartType"];
}> {
  const monthKey = input.monthKey?.trim();
  const category = input.category ?? "EB-2";
  const chargeabilityArea = input.chargeabilityArea ?? "china-mainland";
  const priorityDate = input.priorityDate?.trim();
  const chartType = input.chartType ?? "final_action";

  if (monthKey && !MONTH_KEY_PATTERN.test(monthKey)) {
    return failure(
      "invalid_input",
      "Visa Bulletin 月份格式无效。",
      "monthKey",
      "请使用 YYYY-MM 格式，例如 2026-06。",
    );
  }

  if (!VISA_BULLETIN_CATEGORIES.includes(category)) {
    return failure("invalid_input", "职业移民类别无效。", "category");
  }

  if (chargeabilityArea !== "china-mainland") {
    return failure(
      "invalid_input",
      "当前工具只支持中国大陆出生 chargeability area。",
      "chargeabilityArea",
    );
  }

  if (!priorityDate || !isValidIsoDate(priorityDate)) {
    return failure(
      "invalid_input",
      "请输入有效的 priority date。",
      "priorityDate",
      "请使用 YYYY-MM-DD 格式，例如 2021-08-31。",
    );
  }

  if (!VISA_BULLETIN_CHART_TYPES.includes(chartType)) {
    return failure(
      "invalid_input",
      "排期表类型无效。",
      "chartType",
      "请选择 Final Action Dates 或 Dates for Filing。",
    );
  }

  return success({
    monthKey,
    category,
    chargeabilityArea,
    priorityDate,
    chartType,
  });
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

type SocResolutionCandidate = {
  socCode: string;
  socTitle: string;
  matchMethod: PublicResolvedSocCode["matchMethod"];
  matchedLabel: string;
  matchScore: number;
};

function resolveSocCode(
  socOrJobTitle: string,
  data: FixtureData,
): PublicResolvedSocCode | undefined {
  const trimmed = socOrJobTitle.trim();
  const queryKey = normalizeEmployerName(trimmed);

  if (SOC_CODE_PATTERN.test(trimmed)) {
    const title =
      data.pwdRecords.find((record) => record.socCode === trimmed)?.socTitle ??
      data.h1bLcaRecords.find((record) => record.socCode === trimmed)
        ?.socTitle ??
      "Unknown SOC title";

    return {
      socCode: trimmed,
      socTitle: title,
      matchMethod: "soc_code",
      matchedLabel: trimmed,
      alternativeSocCodes: buildSocAlternatives(trimmed, data),
    };
  }

  const candidates = new Map<string, SocResolutionCandidate>();
  const addCandidate = (
    socCode: string,
    socTitle: string,
    matchMethod: PublicResolvedSocCode["matchMethod"],
    matchedLabel: string,
    score: number,
  ) => {
    const existing = candidates.get(socCode);
    const nextScore = (existing?.matchScore ?? 0) + score;

    candidates.set(socCode, {
      socCode,
      socTitle: existing?.socTitle ?? socTitle,
      matchMethod: existing?.matchMethod ?? matchMethod,
      matchedLabel: existing?.matchedLabel ?? matchedLabel,
      matchScore: nextScore,
    });
  };

  for (const record of data.pwdRecords) {
    const titleKey = normalizeEmployerName(record.socTitle);
    if (titleKey.includes(queryKey) || queryKey.includes(titleKey)) {
      addCandidate(
        record.socCode,
        record.socTitle,
        "pwd_soc_title",
        record.socTitle,
        titleKey === queryKey ? 40 : 24,
      );
    }
  }

  for (const record of data.h1bLcaRecords) {
    const jobKey = normalizeEmployerName(record.jobTitle);
    const titleKey = normalizeEmployerName(record.socTitle);
    if (jobKey.includes(queryKey) || queryKey.includes(jobKey)) {
      addCandidate(
        record.socCode,
        record.socTitle,
        "h1b_job_title",
        record.jobTitle,
        jobKey === queryKey ? 16 : 8,
      );
    } else if (titleKey.includes(queryKey) || queryKey.includes(titleKey)) {
      addCandidate(
        record.socCode,
        record.socTitle,
        "h1b_job_title",
        record.socTitle,
        titleKey === queryKey ? 12 : 6,
      );
    }
  }

  const sortedCandidates = [...candidates.values()].sort(
    (left, right) =>
      right.matchScore - left.matchScore ||
      left.socCode.localeCompare(right.socCode),
  );
  const selected = sortedCandidates[0];

  if (!selected) {
    return undefined;
  }

  return {
    socCode: selected.socCode,
    socTitle: selected.socTitle,
    matchMethod: selected.matchMethod,
    matchedLabel: selected.matchedLabel,
    alternativeSocCodes: sortedCandidates
      .filter((candidate) => candidate.socCode !== selected.socCode)
      .slice(0, 4)
      .map((candidate) => ({
        socCode: candidate.socCode,
        socTitle: candidate.socTitle,
        matchScore: candidate.matchScore,
      })),
  };
}

function buildSocAlternatives(
  selectedSocCode: string,
  data: FixtureData,
): PublicResolvedSocCode["alternativeSocCodes"] {
  const candidates = new Map<string, SocResolutionCandidate>();
  const selectedPrefix = selectedSocCode.slice(0, 2);

  for (const record of [...data.pwdRecords, ...data.h1bLcaRecords]) {
    if (record.socCode === selectedSocCode) {
      continue;
    }

    if (!record.socCode.startsWith(selectedPrefix)) {
      continue;
    }

    const existing = candidates.get(record.socCode);
    candidates.set(record.socCode, {
      socCode: record.socCode,
      socTitle: existing?.socTitle ?? record.socTitle,
      matchMethod: existing?.matchMethod ?? "pwd_soc_title",
      matchedLabel: existing?.matchedLabel ?? record.socTitle,
      matchScore: (existing?.matchScore ?? 0) + 1,
    });
  }

  return [...candidates.values()]
    .sort(
      (left, right) =>
        right.matchScore - left.matchScore ||
        left.socCode.localeCompare(right.socCode),
    )
    .slice(0, 4)
    .map((candidate) => ({
      socCode: candidate.socCode,
      socTitle: candidate.socTitle,
      matchScore: candidate.matchScore,
    }));
}

function toPublicWageRecord(
  record: PwdRecord,
): NonNullable<PublicH1BWageLevelCheckPayload["wageRecord"]> {
  return {
    id: record.id,
    effectiveYear: record.effectiveYear,
    socCode: record.socCode,
    socTitle: record.socTitle,
    areaName: record.areaName,
    city: record.city,
    state: record.state,
    dataSeries: record.dataSeries,
    wageUnit: record.wageUnit,
    levels: [
      { level: 1 as const, amount: record.wageLevel1 },
      { level: 2 as const, amount: record.wageLevel2 },
      { level: 3 as const, amount: record.wageLevel3 },
      { level: 4 as const, amount: record.wageLevel4 },
    ].filter((level) => Number.isFinite(level.amount)),
  };
}

function normalizeWageForComparison(
  amount: number,
  inputUnit: "Year" | "Hour",
  comparisonUnit: "Year" | "Hour",
): {
  amount: number;
  conversion?: PublicWageUnitConversion;
} {
  if (inputUnit === comparisonUnit) {
    return { amount };
  }

  const convertedAmount =
    inputUnit === "Year" ? amount / ANNUAL_HOURS : amount * ANNUAL_HOURS;

  return {
    amount: convertedAmount,
    conversion: {
      originalAmount: amount,
      originalUnit: inputUnit,
      comparisonAmount: convertedAmount,
      comparisonUnit,
      noteZh:
        inputUnit === "Year"
          ? "该 wage record 使用小时工资，工具按 2,080 小时/年把输入年薪换算为小时工资，仅用于粗略对照。"
          : "该 wage record 使用年薪，工具按 2,080 小时/年把输入时薪换算为年薪，仅用于粗略对照。",
    },
  };
}

function buildWageLevelComparison(
  match: WageLevelMatchResult,
  offeredWageForComparison: number,
  offeredWageUnitForComparison: "Year" | "Hour",
): PublicWageLevelComparison {
  const labels: Record<WageLevelMatchResult["band"], string> = {
    below_level_1: "低于 Level 1 公开数值",
    level_1_to_2: "介于 Level 1 和 Level 2",
    level_2_to_3: "介于 Level 2 和 Level 3",
    level_3_to_4: "介于 Level 3 和 Level 4",
    level_4_or_above: "达到或高于 Level 4",
    unknown: "无法判断区间",
  };
  const cautionLevels: Record<
    WageLevelMatchResult["band"],
    PublicWageLevelComparison["cautionLevel"]
  > = {
    below_level_1: "high",
    level_1_to_2: "medium",
    level_2_to_3: "medium",
    level_3_to_4: "low",
    level_4_or_above: "low",
    unknown: "medium",
  };

  return {
    band: match.band,
    labelZh: labels[match.band],
    messageZh: wageLevelMessageZh(match),
    cautionLevel: cautionLevels[match.band],
    offeredWageForComparison,
    offeredWageUnitForComparison,
    lowerLevel: match.lowerLevel,
    lowerAmount: match.lowerAmount,
    nextLevel: match.nextLevel,
    nextAmount: match.nextAmount,
  };
}

function buildUscisFilingChartNote(
  selectedChart: VisaBulletinDate["chartType"],
  uscisChart: VisaBulletinMonth["uscisFilingChart"],
) {
  const selectedLabel = chartTypeLabelZh(selectedChart);
  const uscisLabel = chartTypeLabelZh(uscisChart);

  if (selectedChart === uscisChart) {
    return `USCIS 当月职业移民调整身份说明使用 ${uscisLabel}。本工具仍只做公开日期对照，不代表一定可以提交 I-485。`;
  }

  return `USCIS 当月职业移民调整身份说明使用 ${uscisLabel}，你选择的 ${selectedLabel} 更适合作为背景参考；是否可用这张表提交 I-485 不能由本站判断。`;
}

function chartTypeLabelZh(chartType: VisaBulletinDate["chartType"]) {
  return chartType === "final_action"
    ? "Final Action Dates"
    : "Dates for Filing";
}

function wageLevelMessageZh(match: WageLevelMatchResult) {
  if (match.band === "below_level_1") {
    return "输入工资低于该公开记录的 Level 1 数值。请把它视为需要进一步核对的信号，而不是个案法律结论。";
  }

  if (match.band === "level_4_or_above") {
    return "输入工资达到或高于该公开记录的最高 level 数值。仍需结合职位职责、地区、正式 PWD/LCA 和律师判断。";
  }

  if (match.lowerLevel && match.nextLevel) {
    return `输入工资介于 Level ${match.lowerLevel} 和 Level ${match.nextLevel} 之间。这个区间只能说明与公开 wage table 的相对位置，不能单独判断 H-1B 合规。`;
  }

  return "当前公开记录的 level 数值不完整，工具无法给出可靠区间。";
}

function buildWageLevelRelatedData(
  socCode: string,
  city: string | undefined,
  state: string,
  data: FixtureData,
) {
  const sameSocRecords = data.h1bLcaRecords.filter(
    (record) => record.socCode === socCode,
  );
  const stateRecords = sameSocRecords.filter(
    (record) => record.worksiteState.toUpperCase() === state,
  );
  const cityRecords = city
    ? stateRecords.filter(
        (record) =>
          normalizeLocationText(record.worksiteCity) ===
          normalizeLocationText(city),
      )
    : [];
  const records =
    cityRecords.length > 0
      ? cityRecords
      : stateRecords.length > 0
        ? stateRecords
        : sameSocRecords;
  const companiesById = new Map<string, H1BLcaRecord[]>();

  for (const record of records) {
    const employerRecords = companiesById.get(record.employerId);
    if (employerRecords) {
      employerRecords.push(record);
    } else {
      companiesById.set(record.employerId, [record]);
    }
  }

  const companies = [...companiesById.entries()]
    .map(([employerId, employerRecords]) => {
      const employer = data.employers.find(
        (candidate) => candidate.id === employerId,
      );
      const wages = employerRecords
        .map((record) => record.annualizedWageFrom)
        .filter((wage) => Number.isFinite(wage))
        .sort((left, right) => left - right);

      return employer
        ? {
            employer,
            href: `/h1b/company/${employer.slug}`,
            recordCount: employerRecords.length,
            medianAnnualWage:
              wages.length > 0 ? percentile(wages, 0.5) : undefined,
          }
        : undefined;
    })
    .filter((company): company is NonNullable<typeof company> =>
      Boolean(company),
    )
    .sort(
      (left, right) =>
        right.recordCount - left.recordCount ||
        left.employer.displayName.localeCompare(right.employer.displayName),
    )
    .slice(0, 5);

  return {
    payload: {
      sampleCount: records.length,
      sampleWarningZh:
        records.length > 0 && records.length < 3
          ? "相关 H-1B LCA 样本少于 3 条，只适合作为很弱的公开数据背景。"
          : undefined,
      companies,
      jobTitles: topCounts(records.map((record) => record.jobTitle)).slice(
        0,
        5,
      ),
      locations: topCounts(
        records.map(
          (record) => `${record.worksiteCity}, ${record.worksiteState}`,
        ),
      ).slice(0, 5),
    },
    sourceFileIds: records.map((record) => record.sourceFileId),
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

function buildCompanyFiscalYears(
  h1bRecords: readonly H1BLcaRecord[],
  permRecords: readonly PermRecord[],
): PublicCompanyFiscalYearSummary[] {
  const fiscalYears = uniqueSorted([
    ...h1bRecords.map((record) => record.fiscalYear),
    ...permRecords.map((record) => record.fiscalYear),
  ]).slice(0, COMPANY_PAGE_VISIBLE_LIMITS.fiscalYearRows);

  return fiscalYears.map((fiscalYear) => {
    const yearH1BRecords = h1bRecords.filter(
      (record) => record.fiscalYear === fiscalYear,
    );
    const yearPermRecords = permRecords.filter(
      (record) => record.fiscalYear === fiscalYear,
    );

    return {
      fiscalYear,
      h1bTotal: yearH1BRecords.length,
      h1bCertified: countH1BStatusForRows(yearH1BRecords, "CERTIFIED"),
      h1bWithdrawn: countH1BStatusForRows(yearH1BRecords, "WITHDRAWN"),
      h1bDenied: countH1BStatusForRows(yearH1BRecords, "DENIED"),
      permTotal: yearPermRecords.length,
      permCertified: countPermStatusForRows(yearPermRecords, "Certified"),
      permDenied: countPermStatusForRows(yearPermRecords, "Denied"),
      permWithdrawn: countPermStatusForRows(yearPermRecords, "Withdrawn"),
    };
  });
}

function buildJobBreakdown(
  h1bRecords: readonly H1BLcaRecord[],
  permRecords: readonly PermRecord[],
): PublicCompanyBreakdownRow[] {
  const rows = new Map<string, PublicCompanyBreakdownRow>();

  for (const record of h1bRecords) {
    addBreakdownRecord(rows, {
      key: `${normalizeEmployerName(record.jobTitle)}:${record.socCode}`,
      label: record.jobTitle,
      socCode: record.socCode,
      socTitle: record.socTitle,
      source: "h1b",
    });
  }

  for (const record of permRecords) {
    addBreakdownRecord(rows, {
      key: `${normalizeEmployerName(record.jobTitle)}:${record.socCode}`,
      label: record.jobTitle,
      socCode: record.socCode,
      socTitle: record.socTitle,
      source: "perm",
    });
  }

  return sortCompanyBreakdowns([...rows.values()]).slice(
    0,
    COMPANY_PAGE_VISIBLE_LIMITS.jobBreakdownRows,
  );
}

function buildLocationBreakdown(
  h1bRecords: readonly H1BLcaRecord[],
  permRecords: readonly PermRecord[],
): PublicCompanyBreakdownRow[] {
  const rows = new Map<string, PublicCompanyBreakdownRow>();

  for (const record of h1bRecords) {
    addBreakdownRecord(rows, {
      key: normalizeLocationText(
        `${record.worksiteCity}, ${record.worksiteState}`,
      ),
      label: `${record.worksiteCity}, ${record.worksiteState}`,
      city: record.worksiteCity,
      state: record.worksiteState,
      source: "h1b",
    });
  }

  for (const record of permRecords) {
    addBreakdownRecord(rows, {
      key: normalizeLocationText(
        `${record.worksiteCity}, ${record.worksiteState}`,
      ),
      label: `${record.worksiteCity}, ${record.worksiteState}`,
      city: record.worksiteCity,
      state: record.worksiteState,
      source: "perm",
    });
  }

  return sortCompanyBreakdowns([...rows.values()]).slice(
    0,
    COMPANY_PAGE_VISIBLE_LIMITS.locationBreakdownRows,
  );
}

function addBreakdownRecord(
  rows: Map<string, PublicCompanyBreakdownRow>,
  input: {
    key: string;
    label: string;
    socCode?: string;
    socTitle?: string;
    city?: string;
    state?: string;
    source: "h1b" | "perm";
  },
) {
  const existing = rows.get(input.key) ?? {
    key: input.key,
    label: input.label,
    socCode: input.socCode,
    socTitle: input.socTitle,
    city: input.city,
    state: input.state,
    h1bCount: 0,
    permCount: 0,
    totalCount: 0,
  };

  rows.set(input.key, {
    ...existing,
    h1bCount: existing.h1bCount + (input.source === "h1b" ? 1 : 0),
    permCount: existing.permCount + (input.source === "perm" ? 1 : 0),
    totalCount: existing.totalCount + 1,
  });
}

function sortCompanyBreakdowns(
  rows: readonly PublicCompanyBreakdownRow[],
): PublicCompanyBreakdownRow[] {
  return [...rows].sort(
    (left, right) =>
      right.totalCount - left.totalCount ||
      left.label.localeCompare(right.label),
  );
}

function buildPermTimeline(
  records: readonly PermRecord[],
): PublicCompanyPermTimelineRow[] {
  return [...records]
    .sort(
      (left, right) =>
        right.decisionDate.localeCompare(left.decisionDate) ||
        left.caseNumber.localeCompare(right.caseNumber),
    )
    .slice(0, COMPANY_PAGE_VISIBLE_LIMITS.permTimelineRows)
    .map((record) => ({
      id: record.id,
      fiscalYear: record.fiscalYear,
      caseNumber: record.caseNumber,
      caseStatus: record.caseStatus,
      jobTitle: record.jobTitle,
      socCode: record.socCode,
      socTitle: record.socTitle,
      city: record.worksiteCity,
      state: record.worksiteState,
      wageOfferFrom: record.wageOfferFrom,
      wageUnit: record.wageUnit,
      priorityDate: record.priorityDate,
      receivedDate: record.receivedDate,
      decisionDate: record.decisionDate,
    }));
}

function buildCompanyWageDistribution(
  records: readonly H1BLcaRecord[],
): PublicCompanyWageDistribution | undefined {
  const wages = records
    .map((record) => record.annualizedWageFrom)
    .filter((wage) => Number.isFinite(wage))
    .sort((left, right) => left - right);

  if (wages.length === 0) {
    return undefined;
  }

  return {
    count: wages.length,
    wageUnit: "Year",
    min: wages[0]!,
    p25: percentile(wages, 0.25),
    median: percentile(wages, 0.5),
    p75: percentile(wages, 0.75),
    max: wages.at(-1)!,
    fiscalYears: uniqueSorted(records.map((record) => record.fiscalYear)),
    sampleWarningZh:
      wages.length < 3
        ? "样本少于 3 条，只能作为非常粗略的公开数据参考。"
        : undefined,
  };
}

function buildRelatedEntities(
  employer: Employer,
  data: FixtureData,
): PublicRelatedEntitiesPayload {
  const currentRecords = recordsForEmployer(employer.id, data);
  const currentJobTitles = new Set(
    currentRecords.map((record) => normalizeEmployerName(record.jobTitle)),
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
        if (currentJobTitles.has(normalizeEmployerName(record.jobTitle))) {
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
        left.employer.displayName.localeCompare(right.employer.displayName),
    )
    .slice(0, 5);

  return {
    employer,
    relatedEmployers,
    relatedJobTitles: topCounts(
      currentRecords.map((record) => record.jobTitle),
    ),
    relatedLocations: topCounts(
      currentRecords.map((record) => `${record.city}, ${record.state}`),
    ),
  };
}

function countH1BStatusForRows(
  records: readonly H1BLcaRecord[],
  status: H1BLcaRecord["caseStatus"],
) {
  return records.filter((record) => record.caseStatus === status).length;
}

function countPermStatusForRows(
  records: readonly PermRecord[],
  status: PermRecord["caseStatus"],
) {
  return records.filter((record) => record.caseStatus === status).length;
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

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
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
