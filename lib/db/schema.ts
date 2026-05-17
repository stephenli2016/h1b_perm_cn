export const migrationFiles = [
  "data/migrations/0001_initial_schema.sql",
] as const;

export const productionMigrationFiles = [
  "data/migrations/postgres/0001_initial_schema.sql",
] as const;

export const requiredTableNames = [
  "employers",
  "employer_aliases",
  "locations",
  "h1b_lca_records",
  "perm_records",
  "pwd_records",
  "uscis_h1b_employer_records",
  "visa_bulletin_months",
  "visa_bulletin_dates",
  "company_page_metrics",
  "guide_pages",
  "correction_requests",
  "etl_runs",
  "source_files",
] as const;

export const requiredIndexNames = [
  "idx_employers_slug",
  "idx_employer_aliases_raw_name",
  "idx_h1b_lca_fiscal_year",
  "idx_h1b_lca_soc_code",
  "idx_h1b_lca_city_state",
  "idx_h1b_lca_job_title",
  "idx_h1b_lca_source_record_id",
  "idx_perm_fiscal_year",
  "idx_perm_soc_code",
  "idx_perm_city_state",
  "idx_perm_job_title",
  "idx_perm_source_record_id",
  "idx_pwd_soc_location_year",
  "idx_pwd_source_record_id",
  "idx_uscis_h1b_fiscal_year",
  "idx_uscis_h1b_city_state",
  "idx_uscis_h1b_source_record_id",
  "idx_visa_bulletin_dates_lookup",
  "idx_guide_pages_section_priority",
  "idx_guide_pages_status",
  "idx_correction_requests_status",
  "idx_correction_requests_employer_id",
] as const;

export const requiredProductionTableNames = requiredTableNames;

export const requiredProductionIndexNames = requiredIndexNames;

export const databaseStrategy = {
  productionTarget: "Supabase Postgres",
  localMode: "SQLite-compatible fixture mode",
  queryLayer:
    "Direct SQL for migrations plus typed TypeScript query helpers over fixture data until production database access is introduced.",
} as const;
