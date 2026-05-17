import { Pool, type QueryResultRow } from "pg";

import type {
  CompanyPageMetrics,
  Employer,
  EmployerAlias,
  EtlRun,
  FixtureData,
  GuidePage,
  H1BLcaRecord,
  Location,
  PermRecord,
  PwdRecord,
  SourceFile,
  UscisH1BEmployerRecord,
  VisaBulletinDate,
  VisaBulletinMonth,
} from "@/lib/db/types";

type RuntimeDataMode = "fixture" | "postgres";

type DatabaseRuntimeStatus = {
  mode: RuntimeDataMode;
  configured: boolean;
  host?: string;
  missing?: readonly string[];
};

type RuntimeEnv = Record<string, string | undefined>;

const POSTGRES_MODE_VALUES = new Set(["postgres", "supabase", "database"]);
const DEFAULT_DATABASE_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedData:
  | {
      expiresAt: number;
      data: FixtureData;
    }
  | undefined;
let inFlightData: Promise<FixtureData> | undefined;

declare global {
  var __visaradarPostgresPool: Pool | undefined;
}

export function getRuntimeDataMode(
  env: RuntimeEnv = process.env,
): RuntimeDataMode {
  const rawMode = env.LOCAL_DATA_MODE?.trim().toLowerCase() ?? "fixture";

  return POSTGRES_MODE_VALUES.has(rawMode) ? "postgres" : "fixture";
}

export function getDatabaseRuntimeStatus(
  env: RuntimeEnv = process.env,
): DatabaseRuntimeStatus {
  const mode = getRuntimeDataMode(env);
  const databaseUrl = env.DATABASE_URL?.trim();

  if (mode === "fixture") {
    return {
      mode,
      configured: true,
    };
  }

  return {
    mode,
    configured: Boolean(databaseUrl),
    host: databaseUrl ? getSafeDatabaseHost(databaseUrl) : undefined,
    missing: databaseUrl ? [] : ["DATABASE_URL"],
  };
}

export async function loadPostgresFixtureData({
  forceRefresh = false,
  now = Date.now(),
}: {
  forceRefresh?: boolean;
  now?: number;
} = {}): Promise<FixtureData> {
  const status = getDatabaseRuntimeStatus();

  if (status.mode !== "postgres") {
    throw new Error(
      "Postgres data loading requires LOCAL_DATA_MODE=postgres, supabase, or database.",
    );
  }

  if (!status.configured) {
    throw new Error(
      "DATABASE_URL is required when LOCAL_DATA_MODE uses the production database.",
    );
  }

  if (!forceRefresh && cachedData && cachedData.expiresAt > now) {
    return cachedData.data;
  }

  if (!forceRefresh && inFlightData) {
    return inFlightData;
  }

  inFlightData = loadFreshPostgresFixtureData().finally(() => {
    inFlightData = undefined;
  });

  const data = await inFlightData;
  cachedData = {
    data,
    expiresAt: now + getDatabaseCacheTtlMs(),
  };

  return data;
}

export function clearPostgresFixtureDataCache() {
  cachedData = undefined;
  inFlightData = undefined;
}

async function loadFreshPostgresFixtureData(): Promise<FixtureData> {
  const pool = getPool();
  const [
    locations,
    employers,
    employerAliases,
    sourceFiles,
    h1bLcaRecords,
    permRecords,
    pwdRecords,
    uscisH1BEmployerRecords,
    visaBulletinMonths,
    visaBulletinDates,
    companyPageMetrics,
    guidePages,
    etlRuns,
  ] = await Promise.all([
    queryRows<LocationRow>(
      "select id, city, state, postal_code, country, normalized_key from public.locations order by id",
    ),
    queryRows<EmployerRow>(
      "select id, canonical_name, display_name, slug, normalized_name, headquarters_location_id from public.employers order by slug",
    ),
    queryRows<EmployerAliasRow>(
      "select id, employer_id, raw_name, normalized_name, source_system, confidence_score, review_status from public.employer_aliases order by raw_name",
    ),
    queryRows<SourceFileRow>(
      "select id, source_name, official_url, fiscal_year, quarter, file_type, latest_data_date from public.source_files order by id",
    ),
    queryRows<H1BLcaRecordRow>(
      "select id, source_file_id, employer_id, location_id, source_record_id, source_record_fingerprint, case_number, case_status, raw_employer_name, fiscal_year, soc_code, soc_title, job_title, worksite_city, worksite_state, wage_rate_of_pay_from, wage_rate_of_pay_to, wage_unit, annualized_wage_from, annualized_wage_to, prevailing_wage, prevailing_wage_unit, wage_level, full_time, received_date, decision_date from public.h1b_lca_records order by decision_date desc nulls last, id",
    ),
    queryRows<PermRecordRow>(
      "select id, source_file_id, employer_id, location_id, source_record_id, source_record_fingerprint, case_number, case_status, raw_employer_name, fiscal_year, job_title, soc_code, soc_title, worksite_city, worksite_state, wage_offer_from, wage_offer_to, wage_unit, priority_date, received_date, decision_date from public.perm_records order by decision_date desc nulls last, id",
    ),
    queryRows<PwdRecordRow>(
      "select id, source_file_id, location_id, source_record_id, source_record_fingerprint, data_series, effective_year, soc_code, soc_title, area_name, city, state, wage_level_1, wage_level_2, wage_level_3, wage_level_4, wage_unit from public.pwd_records order by effective_year desc, soc_code, state, city",
    ),
    queryRows<UscisH1BEmployerRecordRow>(
      "select id, source_file_id, employer_id, source_record_id, source_record_fingerprint, fiscal_year, raw_employer_name, city, state, postal_code, naics_code, initial_approvals, initial_denials, continuing_approvals, continuing_denials from public.uscis_h1b_employer_records order by fiscal_year desc, id",
    ),
    queryRows<VisaBulletinMonthRow>(
      "select id, month_key, bulletin_year, bulletin_month, source_url, published_at, uscis_filing_chart from public.visa_bulletin_months order by month_key desc",
    ),
    queryRows<VisaBulletinDateRow>(
      "select id, bulletin_month_id, category, chargeability_area, chart_type, cutoff_date, cutoff_status, raw_value from public.visa_bulletin_dates order by bulletin_month_id, category, chart_type",
    ),
    queryRows<CompanyPageMetricsRow>(
      "select id, employer_id, lca_count_5y, perm_count_5y, uscis_record_count_5y, job_title_count, location_count, latest_fiscal_year, quality_score, indexable, noindex_reason from public.company_page_metrics order by quality_score desc, employer_id",
    ),
    queryRows<GuidePageRow>(
      "select slug, title_zh, meta_description_zh, section, priority, status, last_reviewed_on, official_sources_json from public.guide_pages order by section, priority, slug",
    ),
    queryRows<EtlRunRow>(
      "select id, parser_name, source_file_id, status, started_at, completed_at, records_seen, records_inserted, records_failed, message from public.etl_runs order by started_at desc limit 100",
    ),
  ]);

  return {
    locations: locations.map(toLocation),
    employers: employers.map(toEmployer),
    employerAliases: employerAliases.map(toEmployerAlias),
    sourceFiles: sourceFiles.map(toSourceFile),
    h1bLcaRecords: h1bLcaRecords.map(toH1BLcaRecord),
    permRecords: permRecords.map(toPermRecord),
    pwdRecords: pwdRecords.map(toPwdRecord),
    uscisH1BEmployerRecords: uscisH1BEmployerRecords.map(
      toUscisH1BEmployerRecord,
    ),
    visaBulletinMonths: visaBulletinMonths.map(toVisaBulletinMonth),
    visaBulletinDates: visaBulletinDates.map(toVisaBulletinDate),
    companyPageMetrics: companyPageMetrics.map(toCompanyPageMetrics),
    guidePages: guidePages.map(toGuidePage),
    correctionRequests: [],
    etlRuns: etlRuns.map(toEtlRun),
  };
}

async function queryRows<T extends QueryResultRow>(
  query: string,
): Promise<T[]> {
  const result = await getPool().query<T>(query);

  return result.rows;
}

function getPool() {
  if (!globalThis.__visaradarPostgresPool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured.");
    }

    globalThis.__visaradarPostgresPool = new Pool({
      connectionString: normalizeDatabaseUrlForPg(databaseUrl),
      max: toInteger(process.env.DATABASE_POOL_MAX) ?? 3,
      ssl: shouldUseSsl(databaseUrl)
        ? {
            rejectUnauthorized: false,
          }
        : false,
    });
  }

  return globalThis.__visaradarPostgresPool;
}

function getDatabaseCacheTtlMs() {
  return (
    toInteger(process.env.DATABASE_FIXTURE_CACHE_TTL_MS) ??
    DEFAULT_DATABASE_CACHE_TTL_MS
  );
}

function shouldUseSsl(databaseUrl: string) {
  if (process.env.DATABASE_SSL?.toLowerCase() === "disable") {
    return false;
  }

  try {
    if (new URL(databaseUrl).searchParams.get("sslmode") === "disable") {
      return false;
    }
  } catch {
    return true;
  }

  const host = getSafeDatabaseHost(databaseUrl);

  return !["localhost", "127.0.0.1", "::1"].includes(host);
}

export function normalizeDatabaseUrlForPg(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

function getSafeDatabaseHost(databaseUrl: string) {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return "invalid-url";
  }
}

function toLocation(row: LocationRow): Location {
  return {
    id: row.id,
    city: row.city,
    state: row.state,
    postalCode: optionalString(row.postal_code),
    country: "US",
    normalizedKey: row.normalized_key,
  };
}

function toEmployer(row: EmployerRow): Employer {
  return {
    id: row.id,
    canonicalName: row.canonical_name,
    displayName: row.display_name,
    slug: row.slug,
    normalizedName: row.normalized_name,
    headquartersLocationId: optionalString(row.headquarters_location_id),
  };
}

function toEmployerAlias(row: EmployerAliasRow): EmployerAlias {
  return {
    id: row.id,
    employerId: row.employer_id,
    rawName: row.raw_name,
    normalizedName: row.normalized_name,
    sourceSystem: row.source_system as EmployerAlias["sourceSystem"],
    confidenceScore: toNumber(row.confidence_score) ?? 0,
    reviewStatus: row.review_status as EmployerAlias["reviewStatus"],
  };
}

function toSourceFile(row: SourceFileRow): SourceFile {
  return {
    id: row.id,
    sourceName: row.source_name,
    officialUrl: row.official_url,
    fiscalYear: toNumber(row.fiscal_year),
    quarter: optionalString(row.quarter),
    fileType: row.file_type,
    latestDataDate: toDateKey(row.latest_data_date),
  };
}

function toH1BLcaRecord(row: H1BLcaRecordRow): H1BLcaRecord {
  return {
    id: row.id,
    sourceFileId: row.source_file_id,
    employerId: row.employer_id,
    locationId: optionalString(row.location_id) ?? "",
    sourceRecordId: row.source_record_id,
    sourceRecordFingerprint: row.source_record_fingerprint,
    caseNumber: optionalString(row.case_number) ?? row.source_record_id,
    caseStatus: row.case_status as H1BLcaRecord["caseStatus"],
    rawEmployerName: row.raw_employer_name,
    fiscalYear: toNumber(row.fiscal_year) ?? 0,
    socCode: optionalString(row.soc_code) ?? "",
    socTitle: optionalString(row.soc_title) ?? "",
    jobTitle: optionalString(row.job_title) ?? "",
    worksiteCity: optionalString(row.worksite_city) ?? "",
    worksiteState: optionalString(row.worksite_state) ?? "",
    wageRateOfPayFrom: toNumber(row.wage_rate_of_pay_from) ?? 0,
    wageRateOfPayTo: toNumber(row.wage_rate_of_pay_to),
    wageUnit: (optionalString(row.wage_unit) ??
      "Year") as H1BLcaRecord["wageUnit"],
    annualizedWageFrom: toNumber(row.annualized_wage_from) ?? 0,
    annualizedWageTo: toNumber(row.annualized_wage_to),
    prevailingWage: toNumber(row.prevailing_wage) ?? 0,
    prevailingWageUnit: (optionalString(row.prevailing_wage_unit) ??
      "Year") as H1BLcaRecord["prevailingWageUnit"],
    wageLevel: optionalString(row.wage_level) as H1BLcaRecord["wageLevel"],
    fullTime: Boolean(row.full_time),
    receivedDate: toDateKey(row.received_date) ?? "",
    decisionDate: toDateKey(row.decision_date) ?? "",
  };
}

function toPermRecord(row: PermRecordRow): PermRecord {
  return {
    id: row.id,
    sourceFileId: row.source_file_id,
    employerId: row.employer_id,
    locationId: optionalString(row.location_id) ?? "",
    sourceRecordId: row.source_record_id,
    sourceRecordFingerprint: row.source_record_fingerprint,
    caseNumber: optionalString(row.case_number) ?? row.source_record_id,
    caseStatus: row.case_status as PermRecord["caseStatus"],
    rawEmployerName: row.raw_employer_name,
    fiscalYear: toNumber(row.fiscal_year) ?? 0,
    jobTitle: optionalString(row.job_title) ?? "",
    socCode: optionalString(row.soc_code) ?? "",
    socTitle: optionalString(row.soc_title) ?? "",
    worksiteCity: optionalString(row.worksite_city) ?? "",
    worksiteState: optionalString(row.worksite_state) ?? "",
    wageOfferFrom: toNumber(row.wage_offer_from) ?? 0,
    wageOfferTo: toNumber(row.wage_offer_to),
    wageUnit: (optionalString(row.wage_unit) ??
      "Year") as PermRecord["wageUnit"],
    priorityDate: toDateKey(row.priority_date),
    receivedDate: toDateKey(row.received_date) ?? "",
    decisionDate: toDateKey(row.decision_date) ?? "",
  };
}

function toPwdRecord(row: PwdRecordRow): PwdRecord {
  return {
    id: row.id,
    sourceFileId: row.source_file_id,
    locationId: optionalString(row.location_id) ?? "",
    sourceRecordId: row.source_record_id,
    sourceRecordFingerprint: row.source_record_fingerprint,
    dataSeries: row.data_series,
    effectiveYear: toNumber(row.effective_year) ?? 0,
    socCode: row.soc_code,
    socTitle: optionalString(row.soc_title) ?? "",
    areaName: optionalString(row.area_name) ?? "",
    city: optionalString(row.city) ?? "",
    state: optionalString(row.state) ?? "",
    wageLevel1: toNumber(row.wage_level_1) ?? 0,
    wageLevel2: toNumber(row.wage_level_2) ?? 0,
    wageLevel3: toNumber(row.wage_level_3) ?? 0,
    wageLevel4: toNumber(row.wage_level_4) ?? 0,
    wageUnit: row.wage_unit as PwdRecord["wageUnit"],
  };
}

function toUscisH1BEmployerRecord(
  row: UscisH1BEmployerRecordRow,
): UscisH1BEmployerRecord {
  return {
    id: row.id,
    sourceFileId: row.source_file_id,
    employerId: row.employer_id,
    sourceRecordId: row.source_record_id,
    sourceRecordFingerprint: row.source_record_fingerprint,
    fiscalYear: toNumber(row.fiscal_year) ?? 0,
    rawEmployerName: row.raw_employer_name,
    city: optionalString(row.city) ?? "",
    state: optionalString(row.state) ?? "",
    postalCode: optionalString(row.postal_code) ?? "",
    naicsCode: optionalString(row.naics_code) ?? "",
    initialApprovals: toNumber(row.initial_approvals) ?? 0,
    initialDenials: toNumber(row.initial_denials) ?? 0,
    continuingApprovals: toNumber(row.continuing_approvals) ?? 0,
    continuingDenials: toNumber(row.continuing_denials) ?? 0,
  };
}

function toVisaBulletinMonth(row: VisaBulletinMonthRow): VisaBulletinMonth {
  return {
    id: row.id,
    monthKey: row.month_key,
    bulletinYear: toNumber(row.bulletin_year) ?? 0,
    bulletinMonth: toNumber(row.bulletin_month) ?? 0,
    sourceUrl: row.source_url,
    publishedAt: toDateKey(row.published_at) ?? "",
    uscisFilingChart:
      row.uscis_filing_chart as VisaBulletinMonth["uscisFilingChart"],
  };
}

function toVisaBulletinDate(row: VisaBulletinDateRow): VisaBulletinDate {
  return {
    id: row.id,
    bulletinMonthId: row.bulletin_month_id,
    category: row.category as VisaBulletinDate["category"],
    chargeabilityArea:
      row.chargeability_area as VisaBulletinDate["chargeabilityArea"],
    chartType: row.chart_type as VisaBulletinDate["chartType"],
    cutoffDate: toDateKey(row.cutoff_date),
    cutoffStatus: row.cutoff_status as VisaBulletinDate["cutoffStatus"],
    rawValue: row.raw_value,
  };
}

function toCompanyPageMetrics(row: CompanyPageMetricsRow): CompanyPageMetrics {
  return {
    id: row.id,
    employerId: row.employer_id,
    lcaCount5y: toNumber(row.lca_count_5y) ?? 0,
    permCount5y: toNumber(row.perm_count_5y) ?? 0,
    uscisRecordCount5y: toNumber(row.uscis_record_count_5y) ?? 0,
    jobTitleCount: toNumber(row.job_title_count) ?? 0,
    locationCount: toNumber(row.location_count) ?? 0,
    latestFiscalYear: toNumber(row.latest_fiscal_year) ?? 0,
    qualityScore: toNumber(row.quality_score) ?? 0,
    indexable: Boolean(row.indexable),
    noindexReason: optionalString(row.noindex_reason),
  };
}

function toGuidePage(row: GuidePageRow): GuidePage {
  return {
    slug: row.slug,
    titleZh: row.title_zh,
    metaDescriptionZh: row.meta_description_zh,
    section: row.section,
    priority: (toNumber(row.priority) ?? 3) as GuidePage["priority"],
    status: row.status as GuidePage["status"],
    lastReviewedOn: toDateKey(row.last_reviewed_on),
    officialSources: Array.isArray(row.official_sources_json)
      ? row.official_sources_json.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
  };
}

function toEtlRun(row: EtlRunRow): EtlRun {
  return {
    id: row.id,
    parserName: row.parser_name,
    sourceFileId: optionalString(row.source_file_id),
    status: row.status as EtlRun["status"],
    startedAt: toTimestamp(row.started_at) ?? "",
    completedAt: toTimestamp(row.completed_at),
    recordsSeen: toNumber(row.records_seen) ?? 0,
    recordsInserted: toNumber(row.records_inserted) ?? 0,
    recordsFailed: toNumber(row.records_failed) ?? 0,
    message: optionalString(row.message),
  };
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function toInteger(value: unknown): number | undefined {
  const numberValue = toNumber(value);

  return numberValue === undefined ? undefined : Math.trunc(numberValue);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toDateKey(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function toTimestamp(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

type LocationRow = QueryResultRow & {
  id: string;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  normalized_key: string;
};

type EmployerRow = QueryResultRow & {
  id: string;
  canonical_name: string;
  display_name: string;
  slug: string;
  normalized_name: string;
  headquarters_location_id: string | null;
};

type EmployerAliasRow = QueryResultRow & {
  id: string;
  employer_id: string;
  raw_name: string;
  normalized_name: string;
  source_system: string;
  confidence_score: string | number;
  review_status: string;
};

type SourceFileRow = QueryResultRow & {
  id: string;
  source_name: string;
  official_url: string;
  fiscal_year: number | null;
  quarter: string | null;
  file_type: string;
  latest_data_date: string | Date | null;
};

type H1BLcaRecordRow = QueryResultRow & {
  id: string;
  source_file_id: string;
  employer_id: string;
  location_id: string | null;
  source_record_id: string;
  source_record_fingerprint: string;
  case_number: string | null;
  case_status: string;
  raw_employer_name: string;
  fiscal_year: number;
  soc_code: string | null;
  soc_title: string | null;
  job_title: string | null;
  worksite_city: string | null;
  worksite_state: string | null;
  wage_rate_of_pay_from: string | number | null;
  wage_rate_of_pay_to: string | number | null;
  wage_unit: string | null;
  annualized_wage_from: string | number | null;
  annualized_wage_to: string | number | null;
  prevailing_wage: string | number | null;
  prevailing_wage_unit: string | null;
  wage_level: string | null;
  full_time: boolean | null;
  received_date: string | Date | null;
  decision_date: string | Date | null;
};

type PermRecordRow = QueryResultRow & {
  id: string;
  source_file_id: string;
  employer_id: string;
  location_id: string | null;
  source_record_id: string;
  source_record_fingerprint: string;
  case_number: string | null;
  case_status: string;
  raw_employer_name: string;
  fiscal_year: number;
  job_title: string | null;
  soc_code: string | null;
  soc_title: string | null;
  worksite_city: string | null;
  worksite_state: string | null;
  wage_offer_from: string | number | null;
  wage_offer_to: string | number | null;
  wage_unit: string | null;
  priority_date: string | Date | null;
  received_date: string | Date | null;
  decision_date: string | Date | null;
};

type PwdRecordRow = QueryResultRow & {
  id: string;
  source_file_id: string;
  location_id: string | null;
  source_record_id: string;
  source_record_fingerprint: string;
  data_series: string;
  effective_year: number;
  soc_code: string;
  soc_title: string | null;
  area_name: string | null;
  city: string | null;
  state: string | null;
  wage_level_1: string | number | null;
  wage_level_2: string | number | null;
  wage_level_3: string | number | null;
  wage_level_4: string | number | null;
  wage_unit: string;
};

type UscisH1BEmployerRecordRow = QueryResultRow & {
  id: string;
  source_file_id: string;
  employer_id: string;
  source_record_id: string;
  source_record_fingerprint: string;
  fiscal_year: number;
  raw_employer_name: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  naics_code: string | null;
  initial_approvals: number | null;
  initial_denials: number | null;
  continuing_approvals: number | null;
  continuing_denials: number | null;
};

type VisaBulletinMonthRow = QueryResultRow & {
  id: string;
  month_key: string;
  bulletin_year: number;
  bulletin_month: number;
  source_url: string;
  published_at: string | Date | null;
  uscis_filing_chart: string;
};

type VisaBulletinDateRow = QueryResultRow & {
  id: string;
  bulletin_month_id: string;
  category: string;
  chargeability_area: string;
  chart_type: string;
  cutoff_date: string | Date | null;
  cutoff_status: string;
  raw_value: string;
};

type CompanyPageMetricsRow = QueryResultRow & {
  id: string;
  employer_id: string;
  lca_count_5y: number;
  perm_count_5y: number;
  uscis_record_count_5y: number;
  job_title_count: number;
  location_count: number;
  latest_fiscal_year: number | null;
  quality_score: string | number;
  indexable: boolean;
  noindex_reason: string | null;
};

type GuidePageRow = QueryResultRow & {
  slug: string;
  title_zh: string;
  meta_description_zh: string;
  section: string;
  priority: number;
  status: string;
  last_reviewed_on: string | Date | null;
  official_sources_json: unknown;
};

type EtlRunRow = QueryResultRow & {
  id: string;
  parser_name: string;
  source_file_id: string | null;
  status: string;
  started_at: string | Date;
  completed_at: string | Date | null;
  records_seen: number;
  records_inserted: number;
  records_failed: number;
  message: string | null;
};
