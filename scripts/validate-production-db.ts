import { readFileSync } from "node:fs";
import { join } from "node:path";

const migrationPath = "data/migrations/postgres/0001_initial_schema.sql";
const envExamplePath = ".env.example";

const requiredTables = [
  "employers",
  "employer_aliases",
  "locations",
  "h1b_lca_records",
  "h1b_lca_worksite_records",
  "h1b_lca_appendix_a_records",
  "perm_records",
  "pwd_records",
  "pwd_case_records",
  "uscis_h1b_employer_records",
  "visa_bulletin_months",
  "visa_bulletin_dates",
  "bls_oews_occupations",
  "bls_oews_areas",
  "naics_industries",
  "onet_occupations",
  "onet_job_zones",
  "company_page_metrics",
  "guide_pages",
  "correction_requests",
  "etl_runs",
  "source_files",
] as const;

const requiredIndexes = [
  "idx_employers_slug",
  "idx_employers_normalized_name",
  "idx_employers_headquarters_location_id",
  "idx_employer_aliases_raw_name",
  "idx_employer_aliases_normalized_name",
  "idx_employer_aliases_employer_id",
  "idx_locations_city_state",
  "idx_locations_state",
  "idx_source_files_source_year",
  "idx_etl_runs_source_file_id",
  "idx_h1b_lca_source_record_id",
  "idx_h1b_lca_source_file_id",
  "idx_h1b_lca_raw_employer_name",
  "idx_h1b_lca_employer_year",
  "idx_h1b_lca_location_id",
  "idx_h1b_lca_fiscal_year",
  "idx_h1b_lca_soc_code",
  "idx_h1b_lca_city_state",
  "idx_h1b_lca_job_title",
  "idx_h1b_lca_case_status",
  "idx_h1b_lca_worksite_case_number",
  "idx_h1b_lca_worksite_source_file_id",
  "idx_h1b_lca_worksite_location_id",
  "idx_h1b_lca_worksite_year",
  "idx_h1b_lca_worksite_city_state",
  "idx_h1b_lca_appendix_case_number",
  "idx_h1b_lca_appendix_source_file_id",
  "idx_h1b_lca_appendix_year",
  "idx_perm_source_record_id",
  "idx_perm_source_file_id",
  "idx_perm_raw_employer_name",
  "idx_perm_employer_year",
  "idx_perm_location_id",
  "idx_perm_fiscal_year",
  "idx_perm_soc_code",
  "idx_perm_city_state",
  "idx_perm_job_title",
  "idx_perm_case_status",
  "idx_pwd_source_record_id",
  "idx_pwd_source_file_id",
  "idx_pwd_location_id",
  "idx_pwd_soc_location_year",
  "idx_pwd_effective_year",
  "idx_pwd_city_state",
  "idx_pwd_case_source_record_id",
  "idx_pwd_case_source_file_id",
  "idx_pwd_case_employer_year",
  "idx_pwd_case_location_id",
  "idx_pwd_case_fiscal_year",
  "idx_pwd_case_soc_code",
  "idx_pwd_case_city_state",
  "idx_pwd_case_status",
  "idx_uscis_h1b_source_record_id",
  "idx_uscis_h1b_source_file_id",
  "idx_uscis_h1b_raw_employer_name",
  "idx_uscis_h1b_employer_year",
  "idx_uscis_h1b_fiscal_year",
  "idx_uscis_h1b_city_state",
  "idx_visa_bulletin_month_key",
  "idx_visa_bulletin_dates_lookup",
  "idx_bls_oews_occupation_code",
  "idx_bls_oews_occupations_source_file_id",
  "idx_bls_oews_area_code",
  "idx_bls_oews_area_name",
  "idx_bls_oews_areas_source_file_id",
  "idx_naics_industries_code",
  "idx_naics_industries_sector",
  "idx_naics_industries_source_file_id",
  "idx_onet_occupations_soc_code",
  "idx_onet_occupations_onet_soc_code",
  "idx_onet_occupations_source_file_id",
  "idx_onet_job_zones_soc_code",
  "idx_onet_job_zones_job_zone",
  "idx_onet_job_zones_source_file_id",
  "idx_company_page_metrics_indexable",
  "idx_company_page_metrics_latest_year",
  "idx_guide_pages_section_priority",
  "idx_guide_pages_status",
  "idx_correction_requests_status",
  "idx_correction_requests_employer_id",
] as const;

type ValidationCheck = {
  name: string;
  passed: boolean;
  detail?: string;
};

export type ProductionDatabaseValidationReport = {
  status: "pass" | "fail";
  migrationPath: string;
  checks: ValidationCheck[];
};

export function buildProductionDatabaseValidationReport({
  cwd = process.cwd(),
}: {
  cwd?: string;
} = {}): ProductionDatabaseValidationReport {
  const migrationSql = readFileSync(join(cwd, migrationPath), "utf8");
  const envExample = readFileSync(join(cwd, envExamplePath), "utf8");
  const checks: ValidationCheck[] = [
    {
      name: "migration file is present",
      passed: migrationSql.trim().length > 0,
    },
    ...requiredTables.map((table) => ({
      name: `creates table ${table}`,
      passed: tableCreateRegex(table).test(migrationSql),
    })),
    ...requiredIndexes.map((index) => ({
      name: `creates index ${index}`,
      passed: indexCreateRegex(index).test(migrationSql),
    })),
    ...requiredTables.map((table) => ({
      name: `enables RLS on ${table}`,
      passed: rlsRegex(table).test(migrationSql),
    })),
    {
      name: "does not grant public Data API table access",
      passed: !hasPublicTableGrant(migrationSql),
      detail:
        "M26 keeps anon/authenticated table access closed until a route-specific policy is designed.",
    },
    {
      name: "does not create public RLS policies",
      passed: !/\bcreate\s+policy\b[\s\S]*?\bto\s+(anon|authenticated)\b/i.test(
        migrationSql,
      ),
    },
    {
      name: "does not model worker names or personal addresses",
      passed: !/\b(foreign_worker_name|worker_name|personal_address)\b/i.test(
        migrationSql,
      ),
    },
    {
      name: ".env.example includes production database placeholders",
      passed: [
        "DATABASE_URL=",
        "SUPABASE_URL=",
        "SUPABASE_ANON_KEY=",
        "SUPABASE_SERVICE_ROLE_KEY=",
      ].every((needle) => envExample.includes(needle)),
    },
    {
      name: "service role key is not browser-exposed",
      passed: !envExample.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"),
    },
    {
      name: ".env.example uses local placeholders, not real Supabase secrets",
      passed:
        envExample.includes(
          "SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key-server-only",
        ) &&
        envExample.includes("SUPABASE_ANON_KEY=replace-with-supabase-anon-key"),
    },
  ];

  return {
    status: checks.every((check) => check.passed) ? "pass" : "fail",
    migrationPath,
    checks,
  };
}

export function renderProductionDatabaseValidationReport(
  report: ProductionDatabaseValidationReport,
) {
  return [
    "Production database validation",
    `Status: ${report.status}`,
    `Migration: ${report.migrationPath}`,
    ...report.checks.map((check) => {
      const status = check.passed ? "PASS" : "FAIL";
      const detail = check.detail ? ` (${check.detail})` : "";

      return `${status} ${check.name}${detail}`;
    }),
  ].join("\n");
}

function tableCreateRegex(table: string) {
  return new RegExp(
    `create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${escapeRegExp(
      table,
    )}\\s*\\(`,
    "i",
  );
}

function indexCreateRegex(index: string) {
  return new RegExp(
    `create\\s+index\\s+if\\s+not\\s+exists\\s+${escapeRegExp(
      index,
    )}\\s+on\\s+public\\.`,
    "i",
  );
}

function rlsRegex(table: string) {
  return new RegExp(
    `alter\\s+table\\s+public\\.${escapeRegExp(
      table,
    )}\\s+enable\\s+row\\s+level\\s+security`,
    "i",
  );
}

function hasPublicTableGrant(sql: string) {
  return /\bgrant\s+[^;]*\bon\s+(all\s+tables\s+in\s+schema\s+public|table\s+public\.[a-z_]+|public\.[a-z_]+)\s+to\s+(anon|authenticated)\b/i.test(
    sql,
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildProductionDatabaseValidationReport();

  console.log(renderProductionDatabaseValidationReport(report));
  process.exitCode = report.status === "pass" ? 0 : 1;
}
