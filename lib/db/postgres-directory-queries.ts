import { normalizeEmployerName } from "@/lib/db/local-repository";
import { queryPostgresRows } from "@/lib/db/postgres-fixture-data";
import type {
  PublicCompanyDirectoryPayload,
  PublicCompanyDirectoryResult,
  PublicDirectoryFilterOptions,
  PublicDirectoryFilters,
  PublicDirectoryPagination,
  PublicDirectorySearchInput,
  PublicDisclosureRecordRow,
  PublicDisclosureSearchPayload,
  PublicQueryErrorCode,
  PublicQueryResult,
} from "@/lib/db/public-query-repository";
import type { Employer } from "@/lib/db/types";

const DEFAULT_DIRECTORY_PAGE_SIZE = 2;
const MAX_DIRECTORY_PAGE_SIZE = 50;
const MAX_DIRECTORY_TEXT_LENGTH = 120;

const H1B_STATUSES = ["CERTIFIED", "WITHDRAWN", "DENIED"] as const;
const PERM_STATUSES = ["Certified", "Denied", "Withdrawn"] as const;
const COMBINED_STATUSES = [...H1B_STATUSES, ...PERM_STATUSES] as const;

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
  const offsetParam = rowBuilder.add((pagination.page - 1) * pagination.pageSize);
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
          coalesce(yearly.h1b_record_count, 0)::text as h1b_record_count,
          coalesce(yearly.perm_record_count, 0)::text as perm_record_count,
          greatest(coalesce(yearly.latest_fiscal_year, 0), coalesce(m.latest_fiscal_year, 0))::text as latest_fiscal_year,
          m.quality_score::text as quality_score,
          m.indexable,
          m.noindex_reason,
          coalesce(job_titles.top_items, '[]'::jsonb) as top_job_titles,
          coalesce(locations.top_items, '[]'::jsonb) as top_locations
        from public.company_page_metrics m
        join public.employers e on e.id = m.employer_id
        left join lateral (
          select
            sum(y.h1b_total) as h1b_record_count,
            sum(y.perm_total) as perm_record_count,
            max(y.fiscal_year) as latest_fiscal_year
          from public.company_yearly_immigration_stats y
          where y.employer_id = m.employer_id
        ) yearly on true
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
      "公司目录把 H-1B LCA 与 PERM 公开记录的聚合结果作为雇主信号合并展示，不代表个案批准、实际招聘或未来 sponsor 承诺。",
    seo: noindexDirectorySeo(normalized.data.filters),
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
  const offsetParam = rowBuilder.add((pagination.page - 1) * pagination.pageSize);
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
    records: rows.map((row) => toDisclosureRecordRow(row, dataset, companyBasePath)),
    availableFilters,
    sourceNames: sourceInfo.sourceNames,
    latestDataDate: sourceInfo.latestDataDate,
    interpretationNoteZh:
      dataset === "h1b"
        ? "LCA 是 H-1B 流程中的劳工条件申请记录，不等于 H-1B petition 批准，也不代表雇主实际录用或未来承诺。"
        : "PERM certification 是劳工认证公开记录，不等于 I-140、I-485 或绿卡最终获批。",
    seo: noindexDirectorySeo(normalized.data.filters),
  });
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
    builder.conditions.push(`s.fiscal_year = ${builder.add(filters.fiscalYear)}`);
  }

  if (filters.state) {
    builder.conditions.push(
      `upper(s.worksite_state) = ${builder.add(filters.state)}`,
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
    builder.conditions.push(
      `lower(s.case_status) = ${builder.add(filters.caseStatus.toLowerCase())}`,
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
      locationConditions.push(`upper(coalesce(b.state, '')) = ${builder.add(filters.state)}`);
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
    states: rows[0]?.states ?? [],
    caseStatuses: rows[0]?.case_statuses ?? [],
  };
}

async function getPostgresCompanyFilterOptions(): Promise<PublicDirectoryFilterOptions> {
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

  return {
    fiscalYears: years.map((row) => row.fiscal_year),
    states: states.map((row) => row.state),
    caseStatuses: [...COMBINED_STATUSES],
  };
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
  const rows = await queryPostgresRows<SourceInfoRow>(
    `
      select
        array_agg(distinct source_name order by source_name) as source_names,
        max(latest_data_date) as latest_data_date
      from public.source_files
    `,
  );

  return toSourceInfo(rows[0]);
}

function toDisclosureRecordRow(
  row: DisclosureRow,
  dataset: Dataset,
  companyBasePath: string,
): PublicDisclosureRecordRow {
  const wageUnit = row.wage_unit === "Hour" ? "Hour" : "Year";

  return {
    id: row.id,
    employer: toEmployer(row),
    companyHref: `${companyBasePath}/${row.slug}`,
    caseNumber: row.case_number,
    caseStatus: row.case_status,
    fiscalYear: toNumber(row.fiscal_year),
    jobTitle: row.job_title,
    socCode: row.soc_code,
    socTitle: row.soc_title,
    city: row.worksite_city,
    state: row.worksite_state,
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
      ? "筛选结果页默认 noindex，避免产生大量参数组合页面。"
      : "目录页将在生产数据质量门槛通过后再开放索引。",
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

function toSourceInfo(row: SourceInfoRow | undefined) {
  return {
    sourceNames: row?.source_names ?? [],
    latestDataDate: toDateKey(row?.latest_data_date),
  };
}

function parseTopCounts(value: unknown): readonly { value: string; count: number }[] {
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

function toNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value ?? 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
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
