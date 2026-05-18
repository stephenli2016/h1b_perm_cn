import { normalizeEmployerName } from "@/lib/db/local-repository";
import { queryPostgresRows } from "@/lib/db/postgres-fixture-data";
import type {
  PublicCompanyBreakdownRow,
  PublicCompanyDirectoryPayload,
  PublicCompanyDirectoryResult,
  PublicCompanyFiscalYearSummary,
  PublicCompanyPermTimelineRow,
  PublicCompanyProfilePayload,
  PublicCompanyWageDistribution,
  PublicDirectoryFilterOptions,
  PublicDirectoryFilters,
  PublicDirectoryPagination,
  PublicDirectorySearchInput,
  PublicDisclosureRecordRow,
  PublicDisclosureSearchPayload,
  PublicQueryErrorCode,
  PublicQueryResult,
  PublicRelatedEntitiesPayload,
  PublicVisaBulletinDatesInput,
  PublicVisaBulletinDatesPayload,
} from "@/lib/db/public-query-repository";
import type {
  CompanyPageMetrics,
  CompanyYearlyImmigrationStats,
  Employer,
  VisaBulletinDate,
  VisaBulletinMonth,
} from "@/lib/db/types";
import type {
  CompanyImmigrationSignal,
  CompanyImmigrationSignalDimensionKey,
} from "@/lib/company-immigration-signals";
import {
  COMPANY_IMMIGRATION_SIGNAL_DIMENSIONS,
  COMPANY_IMMIGRATION_SIGNAL_METHODOLOGY_HREF,
} from "@/lib/company-immigration-signals";
import { getCompanyIndexabilityDecision } from "@/lib/db/local-repository";
import {
  getStateFilterAliases,
  normalizeCaseStatusForAllowed,
  normalizeCaseStatusForDataset,
  normalizeCaseStatusOptions,
  normalizeStateCode,
  normalizeStateOptions,
} from "@/lib/directory-filter-normalization";
import { COMPANY_PAGE_VISIBLE_LIMITS } from "@/lib/seo/company-page-selection";

const DEFAULT_DIRECTORY_PAGE_SIZE = 2;
const MAX_DIRECTORY_PAGE_SIZE = 50;
const MAX_DIRECTORY_TEXT_LENGTH = 120;
const DEFAULT_DIRECTORY_AUX_CACHE_TTL_MS = 5 * 60 * 1000;

const H1B_STATUSES = ["CERTIFIED", "WITHDRAWN", "DENIED"] as const;
const PERM_STATUSES = ["Certified", "Denied", "Withdrawn"] as const;
const COMBINED_STATUSES = ["CERTIFIED", "WITHDRAWN", "DENIED"] as const;

type Dataset = "h1b" | "perm";

type NormalizedDirectoryInput = {
  filters: PublicDirectoryFilters;
  page: number;
  pageSize: number;
};

type SqlBuilder = {
  conditions: string[];
  values: unknown[];
  add: (value: unknown) => string;
};

type CountRow = {
  total: string | number;
};

type SourceInfoRow = {
  source_names: string[] | null;
  latest_data_date: Date | string | null;
};

type FilterOptionRow = {
  fiscal_years: number[] | null;
  states: string[] | null;
  case_statuses: string[] | null;
};

type SourceInfo = {
  sourceNames: string[];
  latestDataDate?: string;
};

let cachedCompanyFilterOptions:
  | {
      expiresAt: number;
      value: PublicDirectoryFilterOptions;
    }
  | undefined;
let cachedGlobalSourceInfo:
  | {
      expiresAt: number;
      value: SourceInfo;
    }
  | undefined;

type DisclosureRow = {
  id: string;
  source_file_id: string;
  employer_id: string;
  canonical_name: string;
  display_name: string;
  slug: string;
  normalized_name: string;
  headquarters_location_id: string | null;
  case_number: string;
  case_status: string;
  fiscal_year: number;
  job_title: string;
  soc_code: string;
  soc_title: string;
  worksite_city: string;
  worksite_state: string;
  wage_amount: string | number | null;
  wage_unit: string | null;
  decision_date: Date | string | null;
};

type CompanyDirectoryRow = {
  employer_id: string;
  canonical_name: string;
  display_name: string;
  slug: string;
  normalized_name: string;
  headquarters_location_id: string | null;
  h1b_record_count: string | number | null;
  perm_record_count: string | number | null;
  latest_fiscal_year: string | number | null;
  quality_score: string | number | null;
  indexable: boolean | null;
  noindex_reason: string | null;
  top_job_titles: unknown;
  top_locations: unknown;
};

type CompanyProfileBaseRow = {
  employer_id: string;
  canonical_name: string;
  display_name: string;
  slug: string;
  normalized_name: string;
  headquarters_location_id: string | null;
  metrics_id: string | null;
  lca_count_5y: string | number | null;
  perm_count_5y: string | number | null;
  uscis_record_count_5y: string | number | null;
  job_title_count: string | number | null;
  location_count: string | number | null;
  latest_fiscal_year: string | number | null;
  quality_score: string | number | null;
  indexable: boolean | null;
  noindex_reason: string | null;
};

type AliasRow = {
  raw_name: string;
  review_status: string;
};

type YearlyStatsRow = {
  id: string;
  employer_id: string;
  fiscal_year: number;
  h1b_total: number;
  h1b_certified: number;
  h1b_withdrawn: number;
  h1b_denied: number;
  perm_total: number;
  perm_certified: number;
  perm_denied: number;
  perm_withdrawn: number;
  uscis_record_count: number;
  uscis_initial_approvals: number;
  uscis_initial_denials: number;
  uscis_continuing_approvals: number;
  uscis_continuing_denials: number;
};

type BreakdownStatsRow = {
  key: string;
  label: string;
  soc_code: string | null;
  soc_title: string | null;
  city: string | null;
  state: string | null;
  h1b_count: number;
  perm_count: number;
  total_count: number;
};

type WageStatsRow = {
  record_count: string | number;
  min_wage: string | number;
  p25_wage: string | number;
  median_wage: string | number;
  p75_wage: string | number;
  max_wage: string | number;
  fiscal_years_json: unknown;
};

type SourceStatsRow = {
  source_names_json: unknown;
  latest_data_date: Date | string | null;
};

type PermTimelineRow = {
  id: string;
  fiscal_year: number;
  case_number: string;
  case_status: string;
  job_title: string;
  soc_code: string;
  soc_title: string;
  worksite_city: string;
  worksite_state: string;
  wage_offer_from: string | number | null;
  wage_unit: string | null;
  priority_date: Date | string | null;
  received_date: Date | string | null;
  decision_date: Date | string | null;
};

type RelatedCompanyRow = {
  employer_id: string;
  canonical_name: string;
  display_name: string;
  slug: string;
  normalized_name: string;
  headquarters_location_id: string | null;
  score: string | number;
  shared_signals: string[] | null;
};

type VisaBulletinMonthRow = {
  id: string;
  month_key: string;
  bulletin_year: string | number;
  bulletin_month: string | number;
  source_url: string;
  published_at: Date | string | null;
  uscis_filing_chart: string;
};

type VisaBulletinDateRow = {
  id: string;
  bulletin_month_id: string;
  category: string;
  chargeability_area: string;
  chart_type: string;
  cutoff_date: Date | string | null;
  cutoff_status: string;
  raw_value: string;
};

export async function searchPostgresH1BRecords(
  input: PublicDirectorySearchInput = {},
): Promise<PublicQueryResult<PublicDisclosureSearchPayload>> {
  return searchPostgresDisclosureRecords("h1b", input);
}

export async function searchPostgresPermRecords(
  input: PublicDirectorySearchInput = {},
): Promise<PublicQueryResult<PublicDisclosureSearchPayload>> {
  return searchPostgresDisclosureRecords("perm", input);
}

export async function searchPostgresCompanyDirectory(
  input: PublicDirectorySearchInput = {},
): Promise<PublicQueryResult<PublicCompanyDirectoryPayload>> {
  const normalized = normalizeDirectoryInput(input, COMBINED_STATUSES);

  if (!normalized.ok) {
    return normalized;
  }

  const countBuilder = createSqlBuilder();
  addCompanyDirectoryFilters(countBuilder, normalized.data.filters);
  const whereClause = toWhereClause(countBuilder.conditions);
  const countRows = await queryPostgresRows<CountRow>(
    `
      select count(*)::text as total
      from public.company_page_metrics m
      join public.employers e on e.id = m.employer_id
      ${whereClause}
    `,
    countBuilder.values,
  );
  const pagination = paginateCount(
    toNumber(countRows[0]?.total),
    normalized.data.page,
    normalized.data.pageSize,
  );

  const rowBuilder = cloneSqlBuilder(countBuilder);
  const limitParam = rowBuilder.add(pagination.pageSize);
  const offsetParam = rowBuilder.add(
    (pagination.page - 1) * pagination.pageSize,
  );
  const [rows, availableFilters, sourceInfo] = await Promise.all([
    queryPostgresRows<CompanyDirectoryRow>(
      `
        select
          e.id as employer_id,
          e.canonical_name,
          e.display_name,
          e.slug,
          e.normalized_name,
          e.headquarters_location_id,
          (m.lca_count_5y + m.uscis_record_count_5y)::text as h1b_record_count,
          m.perm_count_5y::text as perm_record_count,
          m.latest_fiscal_year::text as latest_fiscal_year,
          m.quality_score::text as quality_score,
          m.indexable,
          m.noindex_reason,
          coalesce(job_titles.top_items, '[]'::jsonb) as top_job_titles,
          coalesce(locations.top_items, '[]'::jsonb) as top_locations
        from public.company_page_metrics m
        join public.employers e on e.id = m.employer_id
        left join lateral (
          select jsonb_agg(
            jsonb_build_object('value', label, 'count', total_count)
            order by total_count desc, latest_fiscal_year desc, label
          ) as top_items
          from (
            select label, total_count, latest_fiscal_year
            from public.company_breakdown_stats
            where employer_id = m.employer_id and kind = 'job_title'
            order by total_count desc, latest_fiscal_year desc, label
            limit 5
          ) ranked
        ) job_titles on true
        left join lateral (
          select jsonb_agg(
            jsonb_build_object('value', label, 'count', total_count)
            order by total_count desc, latest_fiscal_year desc, label
          ) as top_items
          from (
            select label, total_count, latest_fiscal_year
            from public.company_breakdown_stats
            where employer_id = m.employer_id and kind = 'location'
            order by total_count desc, latest_fiscal_year desc, label
            limit 5
          ) ranked
        ) locations on true
        ${whereClause}
        order by m.quality_score desc, m.latest_fiscal_year desc nulls last, e.display_name asc, e.id asc
        limit ${limitParam} offset ${offsetParam}
      `,
      rowBuilder.values,
    ),
    getPostgresCompanyFilterOptions(),
    getGlobalSourceInfo(),
  ]);

  return success({
    filters: normalized.data.filters,
    pagination,
    results: rows.map(toCompanyDirectoryResult),
    availableFilters,
    sourceNames: sourceInfo.sourceNames,
    latestDataDate: sourceInfo.latestDataDate,
    interpretationNoteZh:
      "公司目录把 H-1B LCA 与 PERM 公开记录的聚合结果作为雇主信号合并展示，不代表个案批准、实际招聘或未来担保承诺。",
    seo: noindexDirectorySeo(normalized.data.filters),
  });
}

export async function getPostgresCompanyProfileBySlug(
  slug: string,
): Promise<PublicQueryResult<PublicCompanyProfilePayload>> {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(slug)) {
    return failure(
      "invalid_input",
      "公司网址格式无效。",
      "slug",
      "公司网址标识只能包含小写英文字母、数字和连字符，且不能包含路径符号。",
    );
  }

  const baseRows = await queryPostgresRows<CompanyProfileBaseRow>(
    `
      select
        e.id as employer_id,
        e.canonical_name,
        e.display_name,
        e.slug,
        e.normalized_name,
        e.headquarters_location_id,
        m.id as metrics_id,
        m.lca_count_5y::text as lca_count_5y,
        m.perm_count_5y::text as perm_count_5y,
        m.uscis_record_count_5y::text as uscis_record_count_5y,
        m.job_title_count::text as job_title_count,
        m.location_count::text as location_count,
        m.latest_fiscal_year::text as latest_fiscal_year,
        m.quality_score::text as quality_score,
        m.indexable,
        m.noindex_reason
      from public.employers e
      left join public.company_page_metrics m on m.employer_id = e.id
      where e.slug = $1
      limit 1
    `,
    [slug],
  );
  const base = baseRows[0];

  if (!base) {
    return failure(
      "not_found",
      "未找到对应公司的公开数据页面。",
      "slug",
      "请检查公司 URL，或从公司目录重新进入。",
    );
  }

  const employer = toEmployer(base);
  const [
    aliases,
    yearly,
    h1bRecentRecords,
    permTimeline,
    jobBreakdown,
    locationBreakdown,
    wageDistribution,
    sourceInfo,
    relatedCompanies,
  ] = await Promise.all([
    getCompanyAliases(employer.id),
    getCompanyYearlyStats(employer.id),
    getCompanyRecentH1BRecords(employer.id),
    getCompanyPermTimeline(employer.id),
    getCompanyBreakdown(employer.id, "job_title"),
    getCompanyBreakdown(employer.id, "location"),
    getCompanyWageDistribution(employer.id),
    getCompanySourceInfo(employer.id),
    getRelatedCompanies(employer.id),
  ]);

  const metrics = toCompanyPageMetrics(base);

  if (yearly.length === 0 && !metrics) {
    return failure(
      "not_found",
      "未找到对应公司的聚合数据页面。",
      "slug",
      "请检查公司 URL，或从公司目录重新进入。",
    );
  }

  const indexability = metrics
    ? getCompanyIndexabilityDecision(metrics)
    : undefined;

  return success({
    employer,
    aliases: aliases.map((alias) => alias.raw_name),
    metrics,
    h1b: {
      total: sum(yearly.map((row) => row.h1bTotal)),
      certified: sum(yearly.map((row) => row.h1bCertified)),
      withdrawn: sum(yearly.map((row) => row.h1bWithdrawn)),
      denied: sum(yearly.map((row) => row.h1bDenied)),
      fiscalYears: yearly
        .filter((row) => row.h1bTotal > 0)
        .map((row) => row.fiscalYear),
    },
    perm: {
      total: sum(yearly.map((row) => row.permTotal)),
      certified: sum(yearly.map((row) => row.permCertified)),
      denied: sum(yearly.map((row) => row.permDenied)),
      withdrawn: sum(yearly.map((row) => row.permWithdrawn)),
      fiscalYears: yearly
        .filter((row) => row.permTotal > 0)
        .map((row) => row.fiscalYear),
    },
    uscis: {
      totalRecords: sum(yearly.map((row) => row.uscisRecordCount)),
      initialApprovals: sum(yearly.map((row) => row.uscisInitialApprovals)),
      initialDenials: sum(yearly.map((row) => row.uscisInitialDenials)),
      continuingApprovals: sum(
        yearly.map((row) => row.uscisContinuingApprovals),
      ),
      continuingDenials: sum(yearly.map((row) => row.uscisContinuingDenials)),
    },
    fiscalYears: yearly
      .slice(0, COMPANY_PAGE_VISIBLE_LIMITS.fiscalYearRows)
      .map(toFiscalYearSummary),
    h1bRecentRecords,
    permTimeline,
    jobBreakdown,
    locationBreakdown,
    wageDistribution,
    immigrationSignal: buildPostgresImmigrationSignal({
      yearly,
      aliases,
      jobBreakdown,
      locationBreakdown,
      wageDistribution,
      sourceNames: sourceInfo.sourceNames,
      latestDataDate: sourceInfo.latestDataDate,
    }),
    relatedCompanies,
    relatedJobTitles: jobBreakdown.map((row) => ({
      value: row.label,
      count: row.totalCount,
    })),
    relatedLocations: locationBreakdown.map((row) => ({
      value: row.label,
      count: row.totalCount,
    })),
    sourceNames: sourceInfo.sourceNames,
    latestDataDate: sourceInfo.latestDataDate,
    interpretationNoteZh:
      "公司页把 H-1B LCA、PERM 和 USCIS Employer Data Hub 公开记录的聚合结果作为历史活动信号展示，不代表个案批准、实际录用、未来担保承诺或法律意见。",
    seo: {
      indexable: indexability?.indexable ?? false,
      noindex: !(indexability?.indexable ?? false),
      qualityScore: metrics?.qualityScore ?? 0,
      matchedThresholds: indexability?.matchedThresholds ?? [],
      noindexReason: indexability?.noindexReason,
      noindexReasonZh: indexability?.noindexReasonZh,
    },
  });
}

export async function getPostgresVisaBulletinDates(
  input: PublicVisaBulletinDatesInput = {},
): Promise<PublicQueryResult<PublicVisaBulletinDatesPayload>> {
  const monthKey = input.monthKey?.trim();
  const category = input.category;
  const chargeabilityArea = input.chargeabilityArea ?? "china-mainland";

  if (monthKey && !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) {
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
      "当前查询层只支持中国大陆出生地/Chargeability。",
      "chargeabilityArea",
    );
  }

  const monthRows = await queryPostgresRows<VisaBulletinMonthRow>(
    monthKey
      ? `
        select id, month_key, bulletin_year, bulletin_month, source_url, published_at, uscis_filing_chart
        from public.visa_bulletin_months
        where month_key = $1
        limit 1
      `
      : `
        select id, month_key, bulletin_year, bulletin_month, source_url, published_at, uscis_filing_chart
        from public.visa_bulletin_months
        order by month_key desc
        limit 1
      `,
    monthKey ? [monthKey] : [],
  );
  const month = toVisaBulletinMonth(monthRows[0]);

  if (!month) {
    return failure(
      "not_found",
      "未找到对应月份的 Visa Bulletin 数据。",
      "monthKey",
    );
  }

  const dateRows = await queryPostgresRows<VisaBulletinDateRow>(
    `
      select id, bulletin_month_id, category, chargeability_area, chart_type, cutoff_date, cutoff_status, raw_value
      from public.visa_bulletin_dates
      where bulletin_month_id = $1
        and chargeability_area = 'china-mainland'
        and category in ('EB-1', 'EB-2', 'EB-3')
        and chart_type in ('final_action', 'dates_for_filing')
      order by category, chart_type
    `,
    [month.id],
  );
  const records = dateRows.map(toVisaBulletinDate);
  const categories: VisaBulletinDate["category"][] = ["EB-1", "EB-2", "EB-3"];

  return success({
    month,
    rows: categories
      .filter((rowCategory) => !category || rowCategory === category)
      .map((rowCategory) => ({
        category: rowCategory,
        finalAction: records.find(
          (record) =>
            record.category === rowCategory &&
            record.chartType === "final_action",
        ),
        datesForFiling: records.find(
          (record) =>
            record.category === rowCategory &&
            record.chartType === "dates_for_filing",
        ),
      })),
    sourceUrl: month.sourceUrl,
    interpretationNoteZh:
      "Visa Bulletin 日期只是公开排期表信号；实际 I-485 用表还需看 USCIS 当月选择和个人情况。",
  });
}

async function searchPostgresDisclosureRecords(
  dataset: Dataset,
  input: PublicDirectorySearchInput,
): Promise<PublicQueryResult<PublicDisclosureSearchPayload>> {
  const allowedStatuses = dataset === "h1b" ? H1B_STATUSES : PERM_STATUSES;
  const normalized = normalizeDirectoryInput(input, allowedStatuses);

  if (!normalized.ok) {
    return normalized;
  }

  const table =
    dataset === "h1b"
      ? "public.company_recent_h1b_samples"
      : "public.company_recent_perm_samples";
  const wageColumn =
    dataset === "h1b" ? "s.annualized_wage_from" : "s.wage_offer_from";
  const companyBasePath = dataset === "h1b" ? "/h1b/company" : "/perm/company";
  const countBuilder = createSqlBuilder();
  addDisclosureFilters(countBuilder, normalized.data.filters);
  const whereClause = toWhereClause(countBuilder.conditions);
  const countRows = await queryPostgresRows<CountRow>(
    `
      select count(*)::text as total
      from ${table} s
      join public.employers e on e.id = s.employer_id
      ${whereClause}
    `,
    countBuilder.values,
  );
  const pagination = paginateCount(
    toNumber(countRows[0]?.total),
    normalized.data.page,
    normalized.data.pageSize,
  );
  const rowBuilder = cloneSqlBuilder(countBuilder);
  const limitParam = rowBuilder.add(pagination.pageSize);
  const offsetParam = rowBuilder.add(
    (pagination.page - 1) * pagination.pageSize,
  );
  const [rows, availableFilters, sourceInfo] = await Promise.all([
    queryPostgresRows<DisclosureRow>(
      `
        select
          s.id,
          s.source_file_id,
          e.id as employer_id,
          e.canonical_name,
          e.display_name,
          e.slug,
          e.normalized_name,
          e.headquarters_location_id,
          s.case_number,
          s.case_status,
          s.fiscal_year,
          s.job_title,
          s.soc_code,
          s.soc_title,
          s.worksite_city,
          s.worksite_state,
          ${wageColumn}::text as wage_amount,
          s.wage_unit,
          s.decision_date
        from ${table} s
        join public.employers e on e.id = s.employer_id
        ${whereClause}
        order by s.decision_date desc nulls last, s.fiscal_year desc, e.display_name asc, s.id asc
        limit ${limitParam} offset ${offsetParam}
      `,
      rowBuilder.values,
    ),
    getPostgresDisclosureFilterOptions(dataset),
    getDisclosureSourceInfo(dataset),
  ]);

  return success({
    dataset,
    filters: normalized.data.filters,
    pagination,
    records: rows.map((row) =>
      toDisclosureRecordRow(row, dataset, companyBasePath),
    ),
    availableFilters,
    sourceNames: sourceInfo.sourceNames,
    latestDataDate: sourceInfo.latestDataDate,
    interpretationNoteZh:
      dataset === "h1b"
        ? "LCA 是 H-1B 流程中的劳工条件申请记录，不等于 H-1B 申请批准，也不代表雇主实际录用或未来承诺。"
        : "PERM 劳工认证是公开记录，不等于 I-140、I-485 或绿卡最终获批。",
    seo: noindexDirectorySeo(normalized.data.filters),
  });
}

async function getCompanyAliases(employerId: string) {
  return queryPostgresRows<AliasRow>(
    `
      select raw_name, review_status
      from public.employer_aliases
      where employer_id = $1
      order by
        case review_status when 'manual' then 0 when 'auto' then 1 else 2 end,
        raw_name
      limit 20
    `,
    [employerId],
  );
}

async function getCompanyYearlyStats(
  employerId: string,
): Promise<CompanyYearlyImmigrationStats[]> {
  const rows = await queryPostgresRows<YearlyStatsRow>(
    `
      select
        id,
        employer_id,
        fiscal_year,
        h1b_total,
        h1b_certified,
        h1b_withdrawn,
        h1b_denied,
        perm_total,
        perm_certified,
        perm_denied,
        perm_withdrawn,
        uscis_record_count,
        uscis_initial_approvals,
        uscis_initial_denials,
        uscis_continuing_approvals,
        uscis_continuing_denials
      from public.company_yearly_immigration_stats
      where employer_id = $1
      order by fiscal_year desc
    `,
    [employerId],
  );

  return rows.map((row) => ({
    id: row.id,
    employerId: row.employer_id,
    fiscalYear: toNumber(row.fiscal_year),
    h1bTotal: toNumber(row.h1b_total),
    h1bCertified: toNumber(row.h1b_certified),
    h1bWithdrawn: toNumber(row.h1b_withdrawn),
    h1bDenied: toNumber(row.h1b_denied),
    permTotal: toNumber(row.perm_total),
    permCertified: toNumber(row.perm_certified),
    permDenied: toNumber(row.perm_denied),
    permWithdrawn: toNumber(row.perm_withdrawn),
    uscisRecordCount: toNumber(row.uscis_record_count),
    uscisInitialApprovals: toNumber(row.uscis_initial_approvals),
    uscisInitialDenials: toNumber(row.uscis_initial_denials),
    uscisContinuingApprovals: toNumber(row.uscis_continuing_approvals),
    uscisContinuingDenials: toNumber(row.uscis_continuing_denials),
  }));
}

async function getCompanyRecentH1BRecords(
  employerId: string,
): Promise<PublicDisclosureRecordRow[]> {
  const rows = await queryPostgresRows<DisclosureRow>(
    `
      select
        s.id,
        s.source_file_id,
        e.id as employer_id,
        e.canonical_name,
        e.display_name,
        e.slug,
        e.normalized_name,
        e.headquarters_location_id,
        s.case_number,
        s.case_status,
        s.fiscal_year,
        s.job_title,
        s.soc_code,
        s.soc_title,
        s.worksite_city,
        s.worksite_state,
        s.annualized_wage_from::text as wage_amount,
        s.wage_unit,
        s.decision_date
      from public.company_recent_h1b_samples s
      join public.employers e on e.id = s.employer_id
      where s.employer_id = $1
      order by s.decision_date desc nulls last, s.fiscal_year desc, s.id asc
      limit $2
    `,
    [employerId, COMPANY_PAGE_VISIBLE_LIMITS.h1bRecentRecords],
  );

  return rows.map((row) => toDisclosureRecordRow(row, "h1b", "/h1b/company"));
}

async function getCompanyPermTimeline(
  employerId: string,
): Promise<PublicCompanyPermTimelineRow[]> {
  const rows = await queryPostgresRows<PermTimelineRow>(
    `
      select
        id,
        fiscal_year,
        case_number,
        case_status,
        job_title,
        soc_code,
        soc_title,
        worksite_city,
        worksite_state,
        wage_offer_from::text as wage_offer_from,
        wage_unit,
        priority_date,
        received_date,
        decision_date
      from public.company_recent_perm_samples
      where employer_id = $1
      order by decision_date desc nulls last, case_number asc, id asc
      limit $2
    `,
    [employerId, COMPANY_PAGE_VISIBLE_LIMITS.permTimelineRows],
  );

  return rows.map((row) => ({
    id: row.id,
    fiscalYear: toNumber(row.fiscal_year),
    caseNumber: row.case_number,
    caseStatus:
      row.case_status === "Denied" || row.case_status === "Withdrawn"
        ? row.case_status
        : "Certified",
    jobTitle: row.job_title,
    socCode: row.soc_code,
    socTitle: row.soc_title,
    city: row.worksite_city,
    state: normalizeStateCode(row.worksite_state) ?? row.worksite_state,
    wageOfferFrom: toNumber(row.wage_offer_from),
    wageUnit: row.wage_unit === "Hour" ? "Hour" : "Year",
    priorityDate: toDateKey(row.priority_date),
    receivedDate: toDateKey(row.received_date) ?? "",
    decisionDate: toDateKey(row.decision_date) ?? "",
  }));
}

async function getCompanyBreakdown(
  employerId: string,
  kind: "job_title" | "location",
): Promise<PublicCompanyBreakdownRow[]> {
  const limit =
    kind === "job_title"
      ? COMPANY_PAGE_VISIBLE_LIMITS.jobBreakdownRows
      : COMPANY_PAGE_VISIBLE_LIMITS.locationBreakdownRows;
  const rows = await queryPostgresRows<BreakdownStatsRow>(
    `
      select
        key,
        label,
        soc_code,
        soc_title,
        city,
        state,
        h1b_count,
        perm_count,
        total_count
      from public.company_breakdown_stats
      where employer_id = $1 and kind = $2
      order by total_count desc, latest_fiscal_year desc, label asc
      limit $3
    `,
    [employerId, kind, limit],
  );

  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    socCode: row.soc_code ?? undefined,
    socTitle: row.soc_title ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    h1bCount: toNumber(row.h1b_count),
    permCount: toNumber(row.perm_count),
    totalCount: toNumber(row.total_count),
  }));
}

async function getCompanyWageDistribution(
  employerId: string,
): Promise<PublicCompanyWageDistribution | undefined> {
  const rows = await queryPostgresRows<WageStatsRow>(
    `
      select
        record_count::text as record_count,
        min_wage::text as min_wage,
        p25_wage::text as p25_wage,
        median_wage::text as median_wage,
        p75_wage::text as p75_wage,
        max_wage::text as max_wage,
        fiscal_years_json
      from public.company_wage_stats
      where employer_id = $1
      limit 1
    `,
    [employerId],
  );
  const row = rows[0];
  const count = toNumber(row?.record_count);

  if (!row || count === 0) {
    return undefined;
  }

  return {
    count,
    wageUnit: "Year",
    min: toNumber(row.min_wage),
    p25: toNumber(row.p25_wage),
    median: toNumber(row.median_wage),
    p75: toNumber(row.p75_wage),
    max: toNumber(row.max_wage),
    fiscalYears: parseNumberArray(row.fiscal_years_json),
    sampleWarningZh:
      count < 3 ? "样本少于 3 条，只能作为非常粗略的公开数据参考。" : undefined,
  };
}

async function getCompanySourceInfo(employerId: string) {
  const rows = await queryPostgresRows<SourceStatsRow>(
    `
      select source_names_json, latest_data_date
      from public.company_source_stats
      where employer_id = $1
      limit 1
    `,
    [employerId],
  );
  const row = rows[0];

  if (!row) {
    return getGlobalSourceInfo();
  }

  return {
    sourceNames: parseStringArray(row.source_names_json),
    latestDataDate: toDateKey(row.latest_data_date),
  };
}

async function getRelatedCompanies(
  employerId: string,
): Promise<PublicRelatedEntitiesPayload["relatedEmployers"]> {
  const rows = await queryPostgresRows<RelatedCompanyRow>(
    `
      with current_keys as (
        select kind, key
        from public.company_breakdown_stats
        where employer_id = $1
        order by total_count desc
        limit 40
      ),
      scored as (
        select
          e.id as employer_id,
          e.canonical_name,
          e.display_name,
          e.slug,
          e.normalized_name,
          e.headquarters_location_id,
          sum(case when b.kind = 'job_title' then 2 else 1 end) as score,
          array_agg(
            distinct case
              when b.kind = 'job_title' and b.soc_code is not null then 'SOC: ' || b.soc_code
              when b.kind = 'job_title' then '职位: ' || b.label
              else '地点: ' || b.label
            end
          ) as shared_signals
        from current_keys ck
        join public.company_breakdown_stats b
          on b.kind = ck.kind and b.key = ck.key and b.employer_id <> $1
        join public.employers e on e.id = b.employer_id
        group by e.id, e.canonical_name, e.display_name, e.slug, e.normalized_name, e.headquarters_location_id
      )
      select *
      from scored
      order by score desc, display_name asc
      limit 5
    `,
    [employerId],
  );

  return rows.map((row) => ({
    employer: toEmployer(row),
    sharedSignals: row.shared_signals ?? [],
    score: toNumber(row.score),
  }));
}

function addDisclosureFilters(
  builder: SqlBuilder,
  filters: PublicDirectoryFilters,
) {
  if (filters.employer) {
    const rawParam = builder.add(`%${filters.employer}%`);
    const normalizedParam = builder.add(
      `%${normalizeEmployerName(filters.employer)}%`,
    );
    builder.conditions.push(`(
      e.canonical_name ilike ${rawParam}
      or e.display_name ilike ${rawParam}
      or s.raw_employer_name ilike ${rawParam}
      or e.normalized_name like ${normalizedParam}
    )`);
  }

  if (filters.fiscalYear) {
    builder.conditions.push(
      `s.fiscal_year = ${builder.add(filters.fiscalYear)}`,
    );
  }

  if (filters.state) {
    const aliases = getStateFilterAliases(filters.state);
    builder.conditions.push(
      `upper(s.worksite_state) = any(${builder.add(aliases)}::text[])`,
    );
  }

  if (filters.city) {
    builder.conditions.push(
      `lower(s.worksite_city) like ${builder.add(`%${filters.city.toLowerCase()}%`)}`,
    );
  }

  if (filters.jobOrSoc) {
    const rawParam = builder.add(`%${filters.jobOrSoc.toLowerCase()}%`);
    builder.conditions.push(`(
      lower(s.job_title) like ${rawParam}
      or lower(s.soc_title) like ${rawParam}
      or lower(s.soc_code) like ${rawParam}
    )`);
  }

  if (filters.caseStatus) {
    const aliases = getCaseStatusFilterAliases(filters.caseStatus);
    builder.conditions.push(
      `lower(s.case_status) = any(${builder.add(aliases)}::text[])`,
    );
  }
}

function addCompanyDirectoryFilters(
  builder: SqlBuilder,
  filters: PublicDirectoryFilters,
) {
  if (filters.employer) {
    const rawParam = builder.add(`%${filters.employer}%`);
    const normalizedParam = builder.add(
      `%${normalizeEmployerName(filters.employer)}%`,
    );
    builder.conditions.push(`(
      e.canonical_name ilike ${rawParam}
      or e.display_name ilike ${rawParam}
      or e.normalized_name like ${normalizedParam}
      or exists (
        select 1
        from public.employer_aliases a
        where a.employer_id = e.id
          and (a.raw_name ilike ${rawParam} or a.normalized_name like ${normalizedParam})
      )
    )`);
  }

  if (filters.fiscalYear) {
    builder.conditions.push(`exists (
      select 1
      from public.company_yearly_immigration_stats y
      where y.employer_id = e.id and y.fiscal_year = ${builder.add(filters.fiscalYear)}
    )`);
  }

  if (filters.caseStatus) {
    const status = filters.caseStatus.toLowerCase();
    const certifiedCondition = "y.h1b_certified + y.perm_certified > 0";
    const deniedCondition = "y.h1b_denied + y.perm_denied > 0";
    const withdrawnCondition = "y.h1b_withdrawn + y.perm_withdrawn > 0";
    const statusCondition =
      status === "certified"
        ? certifiedCondition
        : status === "denied"
          ? deniedCondition
          : withdrawnCondition;
    builder.conditions.push(`exists (
      select 1
      from public.company_yearly_immigration_stats y
      where y.employer_id = e.id and ${statusCondition}
    )`);
  }

  if (filters.jobOrSoc) {
    const rawParam = builder.add(`%${filters.jobOrSoc.toLowerCase()}%`);
    builder.conditions.push(`exists (
      select 1
      from public.company_breakdown_stats b
      where b.employer_id = e.id
        and b.kind = 'job_title'
        and (
          lower(b.label) like ${rawParam}
          or lower(coalesce(b.soc_title, '')) like ${rawParam}
          or lower(coalesce(b.soc_code, '')) like ${rawParam}
        )
    )`);
  }

  if (filters.state || filters.city) {
    const locationConditions = ["b.employer_id = e.id", "b.kind = 'location'"];

    if (filters.state) {
      const aliases = getStateFilterAliases(filters.state);
      locationConditions.push(
        `upper(coalesce(b.state, '')) = any(${builder.add(aliases)}::text[])`,
      );
    }

    if (filters.city) {
      locationConditions.push(
        `lower(coalesce(b.city, '')) like ${builder.add(`%${filters.city.toLowerCase()}%`)}`,
      );
    }

    builder.conditions.push(`exists (
      select 1
      from public.company_breakdown_stats b
      where ${locationConditions.join(" and ")}
    )`);
  }
}

function getCaseStatusFilterAliases(status: string) {
  const normalized = normalizeCaseStatusForDataset(status, "combined");

  if (normalized === "CERTIFIED") {
    return ["certified", "certified - expired", "certified-expired"];
  }

  if (normalized === "WITHDRAWN") {
    return [
      "withdrawn",
      "certified withdrawn",
      "certified-withdrawn",
      "certified_withdrawn",
      "certified_-_withdrawn",
    ];
  }

  if (normalized === "DENIED") {
    return ["denied"];
  }

  return [status.toLowerCase()];
}

async function getPostgresDisclosureFilterOptions(
  dataset: Dataset,
): Promise<PublicDirectoryFilterOptions> {
  const table =
    dataset === "h1b"
      ? "public.company_recent_h1b_samples"
      : "public.company_recent_perm_samples";
  const rows = await queryPostgresRows<FilterOptionRow>(
    `
      select
        array_agg(distinct fiscal_year order by fiscal_year desc) as fiscal_years,
        array_agg(distinct upper(worksite_state) order by upper(worksite_state)) filter (where worksite_state is not null and worksite_state <> '') as states,
        array_agg(distinct case_status order by case_status) as case_statuses
      from ${table}
    `,
  );

  return {
    fiscalYears: rows[0]?.fiscal_years ?? [],
    states: normalizeStateOptions(rows[0]?.states ?? []),
    caseStatuses: normalizeCaseStatusOptions(
      rows[0]?.case_statuses ?? [],
      dataset,
    ),
  };
}

async function getPostgresCompanyFilterOptions(): Promise<PublicDirectoryFilterOptions> {
  const now = Date.now();

  if (
    cachedCompanyFilterOptions &&
    cachedCompanyFilterOptions.expiresAt > now
  ) {
    return cachedCompanyFilterOptions.value;
  }

  const [years, states] = await Promise.all([
    queryPostgresRows<{ fiscal_year: number }>(
      `
        select distinct fiscal_year
        from public.company_yearly_immigration_stats
        order by fiscal_year desc
      `,
    ),
    queryPostgresRows<{ state: string }>(
      `
        select distinct upper(state) as state
        from public.company_breakdown_stats
        where kind = 'location' and state is not null and state <> ''
        order by upper(state)
      `,
    ),
  ]);
  const value = {
    fiscalYears: years.map((row) => row.fiscal_year),
    states: normalizeStateOptions(states.map((row) => row.state)),
    caseStatuses: [...COMBINED_STATUSES],
  };

  cachedCompanyFilterOptions = {
    expiresAt: now + getDirectoryAuxCacheTtlMs(),
    value,
  };

  return value;
}

async function getDisclosureSourceInfo(dataset: Dataset) {
  const table =
    dataset === "h1b"
      ? "public.company_recent_h1b_samples"
      : "public.company_recent_perm_samples";
  const rows = await queryPostgresRows<SourceInfoRow>(
    `
      select
        array_agg(distinct sf.source_name order by sf.source_name) as source_names,
        max(sf.latest_data_date) as latest_data_date
      from public.source_files sf
      where exists (
        select 1
        from ${table} s
        where s.source_file_id = sf.id
      )
    `,
  );

  return toSourceInfo(rows[0]);
}

async function getGlobalSourceInfo() {
  const now = Date.now();

  if (cachedGlobalSourceInfo && cachedGlobalSourceInfo.expiresAt > now) {
    return cachedGlobalSourceInfo.value;
  }

  const rows = await queryPostgresRows<SourceInfoRow>(
    `
      select
        array_agg(distinct source_name order by source_name) as source_names,
        max(latest_data_date) as latest_data_date
      from public.source_files
    `,
  );

  const value = toSourceInfo(rows[0]);
  cachedGlobalSourceInfo = {
    expiresAt: now + getDirectoryAuxCacheTtlMs(),
    value,
  };

  return value;
}

function toDisclosureRecordRow(
  row: DisclosureRow,
  dataset: Dataset,
  companyBasePath: string,
): PublicDisclosureRecordRow {
  const wageUnit = row.wage_unit === "Hour" ? "Hour" : "Year";
  const caseStatus =
    normalizeCaseStatusForDataset(row.case_status, dataset) ?? row.case_status;
  const state = normalizeStateCode(row.worksite_state) ?? row.worksite_state;

  return {
    id: row.id,
    employer: toEmployer(row),
    companyHref: `${companyBasePath}/${row.slug}`,
    caseNumber: row.case_number,
    caseStatus,
    fiscalYear: toNumber(row.fiscal_year),
    jobTitle: row.job_title,
    socCode: row.soc_code,
    socTitle: row.soc_title,
    city: row.worksite_city,
    state,
    wageAmount: toNumber(row.wage_amount),
    wageUnit,
    decisionDate: toDateKey(row.decision_date) ?? "",
    sourceFileId: row.source_file_id,
    dataSource: dataset === "h1b" ? "h1b_lca" : "perm",
  };
}

function toCompanyDirectoryResult(
  row: CompanyDirectoryRow,
): PublicCompanyDirectoryResult {
  const h1bRecordCount = toNumber(row.h1b_record_count);
  const permRecordCount = toNumber(row.perm_record_count);

  return {
    employer: toEmployer(row),
    h1bRecordCount,
    permRecordCount,
    matchedRecordCount: h1bRecordCount + permRecordCount,
    latestFiscalYear: toNumber(row.latest_fiscal_year),
    topJobTitles: parseTopCounts(row.top_job_titles),
    topLocations: parseTopCounts(row.top_locations),
    qualityScore: toNumber(row.quality_score),
    indexable: Boolean(row.indexable),
    noindexReason: row.noindex_reason ?? undefined,
  };
}

function toCompanyPageMetrics(
  row: CompanyProfileBaseRow,
): CompanyPageMetrics | undefined {
  if (!row.metrics_id) {
    return undefined;
  }

  return {
    id: row.metrics_id,
    employerId: row.employer_id,
    lcaCount5y: toNumber(row.lca_count_5y),
    permCount5y: toNumber(row.perm_count_5y),
    uscisRecordCount5y: toNumber(row.uscis_record_count_5y),
    jobTitleCount: toNumber(row.job_title_count),
    locationCount: toNumber(row.location_count),
    latestFiscalYear: toNumber(row.latest_fiscal_year),
    qualityScore: toNumber(row.quality_score),
    indexable: Boolean(row.indexable),
    noindexReason: row.noindex_reason ?? undefined,
  };
}

function toFiscalYearSummary(
  row: CompanyYearlyImmigrationStats,
): PublicCompanyFiscalYearSummary {
  return {
    fiscalYear: row.fiscalYear,
    h1bTotal: row.h1bTotal,
    h1bCertified: row.h1bCertified,
    h1bWithdrawn: row.h1bWithdrawn,
    h1bDenied: row.h1bDenied,
    permTotal: row.permTotal,
    permCertified: row.permCertified,
    permDenied: row.permDenied,
    permWithdrawn: row.permWithdrawn,
  };
}

function buildPostgresImmigrationSignal(input: {
  yearly: readonly CompanyYearlyImmigrationStats[];
  aliases: readonly AliasRow[];
  jobBreakdown: readonly PublicCompanyBreakdownRow[];
  locationBreakdown: readonly PublicCompanyBreakdownRow[];
  wageDistribution?: PublicCompanyWageDistribution;
  sourceNames: readonly string[];
  latestDataDate?: string;
}): CompanyImmigrationSignal {
  const recentRows = input.yearly.slice(0, 5);
  const h1bTotal = sum(recentRows.map((row) => row.h1bTotal));
  const h1bCertified = sum(recentRows.map((row) => row.h1bCertified));
  const permTotal = sum(recentRows.map((row) => row.permTotal));
  const permCertified = sum(recentRows.map((row) => row.permCertified));
  const uscisRows = sum(recentRows.map((row) => row.uscisRecordCount));
  const fiscalYears = recentRows
    .filter((row) => row.h1bTotal + row.permTotal + row.uscisRecordCount > 0)
    .map((row) => row.fiscalYear);
  const hasH1B = h1bTotal + uscisRows > 0;
  const hasPerm = permTotal > 0;
  const dimensions = [
    buildSignalDimension({
      key: "recent_lca_activity",
      score:
        Math.min(h1bTotal * 3, 12) +
        (h1bCertified > 0 ? 3 : 0) +
        Math.min(uscisRows * 1.5, 3),
      evidenceZh: [
        `近 5 年 LCA 记录：${h1bTotal} 条`,
        `已认证 LCA：${h1bCertified} 条`,
        `USCIS Employer Data Hub 行：${uscisRows} 条`,
      ],
      explanationZh:
        "LCA 与 USCIS Employer Data Hub 只能说明公开记录中有 H-1B 相关活动，不代表申请批准或未来担保承诺。",
    }),
    buildSignalDimension({
      key: "perm_activity",
      score: Math.min(permTotal * 5, 15) + (permCertified > 0 ? 3 : 0),
      evidenceZh: [
        `近 5 年 PERM 记录：${permTotal} 条`,
        `已认证 PERM：${permCertified} 条`,
      ],
      explanationZh:
        "PERM 劳工认证是公开记录，不等于 I-140、I-485 或绿卡最终获批。",
    }),
    buildSignalDimension({
      key: "repeat_filing_history",
      score: Math.min(fiscalYears.length * 4, 12) + (hasH1B && hasPerm ? 4 : 0),
      evidenceZh: [
        `覆盖财年：${fiscalYears.length > 0 ? fiscalYears.map((year) => `${year} 财年`).join("、") : "暂无"}`,
        `同时有 H-1B 与 PERM 公开活动：${hasH1B && hasPerm ? "是" : "否"}`,
      ],
      explanationZh:
        "跨年记录说明公开活动有一定连续性，但不能说明雇主一定会为某个候选人继续办理。",
    }),
    buildSignalDimension({
      key: "data_consistency",
      score:
        Math.min(input.sourceNames.length * 4, 8) +
        (input.latestDataDate ? 4 : 0) +
        Math.min(input.aliases.length, 4),
      evidenceZh: [
        `官方来源数：${input.sourceNames.length}`,
        `最新数据日期：${input.latestDataDate ?? "暂无"}`,
        `别名映射数：${input.aliases.length}`,
      ],
      explanationZh:
        "来源和别名越完整，页面越容易审计；仍可能存在雇主名称拆分或合并误差。",
    }),
    buildSignalDimension({
      key: "job_location_diversity",
      score:
        Math.min(input.jobBreakdown.length * 2, 8) +
        Math.min(input.locationBreakdown.length * 2, 8),
      evidenceZh: [
        `职位/SOC 聚合项：${input.jobBreakdown.length}`,
        `地点聚合项：${input.locationBreakdown.length}`,
      ],
      explanationZh:
        "职位和地点覆盖越多，可比较背景越丰富；这不是对岗位质量或担保意愿的判断。",
    }),
    buildSignalDimension({
      key: "wage_context",
      score: input.wageDistribution
        ? Math.min(input.wageDistribution.count * 2, 10) +
          (input.wageDistribution.median > 0 ? 4 : 0) +
          (input.wageDistribution.fiscalYears.length > 1 ? 2 : 0)
        : 0,
      evidenceZh: input.wageDistribution
        ? [
            `H-1B 工资样本：${input.wageDistribution.count} 条`,
            `工资年份：${input.wageDistribution.fiscalYears.map((year) => `${year} 财年`).join("、")}`,
            `中位数：USD ${Math.round(input.wageDistribution.median).toLocaleString("en-US")}`,
          ]
        : ["暂无 H-1B 工资样本"],
      explanationZh:
        "工资上下文帮助理解公开记录中的职位/地点背景，但不能直接判断 offer 合规性。",
    }),
  ];
  const rawScore = dimensions.reduce((total, dimension) => {
    return total + dimension.score;
  }, 0);
  const filingRecordCount = h1bTotal + permTotal;
  const totalPublicRecordCount = filingRecordCount + uscisRows;
  const lowSampleFlagged = totalPublicRecordCount < 3 || filingRecordCount < 3;
  const score = lowSampleFlagged ? Math.min(rawScore, 45) : rawScore;
  const band = signalBand(score, lowSampleFlagged);

  return {
    score,
    maxScore: 100,
    labelZh: "公开数据友好度信号",
    band,
    bandLabelZh: signalBandLabelZh(band),
    lowSample: {
      flagged: lowSampleFlagged,
      messageZh: lowSampleFlagged
        ? `近 5 个财年只有 ${filingRecordCount} 条 H-1B/PERM 公开记录、${totalPublicRecordCount} 条相关公开记录。样本太少，只能说明公开数据覆盖有限，不能推断雇主政策或个案结果。`
        : undefined,
    },
    dimensions,
    methodologyHref: COMPANY_IMMIGRATION_SIGNAL_METHODOLOGY_HREF,
    interpretationNoteZh:
      "公开数据友好度信号只衡量官方公开记录的覆盖、连续性和可解释程度，不是 H-1B、PERM、I-140、I-485 或绿卡结果的获批概率。",
  };
}

function buildSignalDimension(input: {
  key: CompanyImmigrationSignalDimensionKey;
  score: number;
  evidenceZh: readonly string[];
  explanationZh: string;
}): CompanyImmigrationSignal["dimensions"][number] {
  const definition = COMPANY_IMMIGRATION_SIGNAL_DIMENSIONS.find(
    (item) => item.key === input.key,
  );
  const maxScore = definition?.maxScore ?? 0;
  const score = Math.max(0, Math.min(input.score, maxScore));
  const ratio = maxScore > 0 ? score / maxScore : 0;

  return {
    key: input.key,
    labelZh: definition?.labelZh ?? input.key,
    maxScore,
    score,
    level: ratio >= 0.67 ? "strong" : ratio >= 0.28 ? "some" : "limited",
    explanationZh: input.explanationZh,
    evidenceZh: input.evidenceZh,
  };
}

function signalBand(score: number, lowSample: boolean) {
  if (lowSample) {
    return "low_sample";
  }

  if (score >= 82) {
    return "rich_public_record";
  }

  if (score >= 66) {
    return "multi_signal";
  }

  if (score >= 46) {
    return "visible_activity";
  }

  return "limited_public_record";
}

function signalBandLabelZh(band: CompanyImmigrationSignal["band"]): string {
  switch (band) {
    case "rich_public_record":
      return "公开记录丰富";
    case "multi_signal":
      return "多维公开信号";
    case "visible_activity":
      return "有可见活动";
    case "limited_public_record":
      return "公开记录有限";
    case "low_sample":
      return "低样本";
  }
}

function toEmployer(row: {
  employer_id: string;
  canonical_name: string;
  display_name: string;
  slug: string;
  normalized_name: string;
  headquarters_location_id: string | null;
}): Employer {
  return {
    id: row.employer_id,
    canonicalName: row.canonical_name,
    displayName: row.display_name,
    slug: row.slug,
    normalizedName: row.normalized_name,
    headquartersLocationId: row.headquarters_location_id ?? undefined,
  };
}

function toVisaBulletinMonth(
  row: VisaBulletinMonthRow | undefined,
): VisaBulletinMonth | undefined {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    monthKey: row.month_key,
    bulletinYear: toNumber(row.bulletin_year),
    bulletinMonth: toNumber(row.bulletin_month),
    sourceUrl: row.source_url,
    publishedAt: toDateKey(row.published_at) ?? "",
    uscisFilingChart:
      row.uscis_filing_chart === "final_action"
        ? "final_action"
        : "dates_for_filing",
  };
}

function toVisaBulletinDate(row: VisaBulletinDateRow): VisaBulletinDate {
  return {
    id: row.id,
    bulletinMonthId: row.bulletin_month_id,
    category:
      row.category === "EB-1" || row.category === "EB-2"
        ? row.category
        : "EB-3",
    chargeabilityArea: "china-mainland",
    chartType:
      row.chart_type === "final_action" ? "final_action" : "dates_for_filing",
    cutoffDate: toDateKey(row.cutoff_date),
    cutoffStatus:
      row.cutoff_status === "current" || row.cutoff_status === "unavailable"
        ? row.cutoff_status
        : "date",
    rawValue: row.raw_value,
  };
}

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
      "数据年份格式无效。",
      "fiscalYear",
      "请使用四位年份，例如 2025。",
    );
  }

  return success(value);
}

function normalizeOptionalState(
  value: string | undefined,
): PublicQueryResult<string | undefined> {
  const state = normalizeStateCode(value);

  if (!state) {
    return value?.trim()
      ? failure("invalid_input", "州代码格式无效。", "state")
      : success(undefined);
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

  const matchedStatus = normalizeCaseStatusForAllowed(trimmed, allowedStatuses);

  if (!matchedStatus) {
    return failure(
      "invalid_input",
      "记录状态不在当前数据集支持范围内。",
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

function paginateCount(
  totalResults: number,
  requestedPage: number,
  pageSize: number,
): PublicDirectoryPagination {
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const page = Math.min(requestedPage, totalPages);

  return {
    page,
    pageSize,
    totalResults,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

function noindexDirectorySeo(filters: PublicDirectoryFilters) {
  return {
    noindex: true as const,
    noindexReasonZh: filters.hasActiveFilters
      ? "筛选结果页不单独收录，避免产生大量参数组合页面。"
      : "目录页将在生产数据质量门槛通过后再开放公开收录。",
  };
}

function createSqlBuilder(): SqlBuilder {
  const values: unknown[] = [];

  return {
    conditions: [],
    values,
    add(value: unknown) {
      values.push(value);
      return `$${values.length}`;
    },
  };
}

function cloneSqlBuilder(builder: SqlBuilder): SqlBuilder {
  const values = [...builder.values];

  return {
    conditions: [...builder.conditions],
    values,
    add(value: unknown) {
      values.push(value);
      return `$${values.length}`;
    },
  };
}

function toWhereClause(conditions: readonly string[]) {
  return conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
}

function getDirectoryAuxCacheTtlMs() {
  const configured = Number(process.env.DATABASE_FIXTURE_CACHE_TTL_MS);

  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_DIRECTORY_AUX_CACHE_TTL_MS;
}

function toSourceInfo(row: SourceInfoRow | undefined) {
  return {
    sourceNames: row?.source_names ?? [],
    latestDataDate: toDateKey(row?.latest_data_date),
  };
}

function parseTopCounts(
  value: unknown,
): readonly { value: string; count: number }[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => ({
      value: String((item as { value?: unknown }).value ?? ""),
      count: toNumber((item as { count?: unknown }).count),
    }))
    .filter((item) => item.value);
}

function parseStringArray(value: unknown): string[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map(String).filter(Boolean);
}

function parseNumberArray(value: unknown): number[] {
  return parseStringArray(value)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function toNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value ?? 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function toDateKey(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

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
