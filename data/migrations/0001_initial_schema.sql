PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employers (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL,
  headquarters_location_id TEXT REFERENCES locations(id),
  website_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employer_aliases (
  id TEXT PRIMARY KEY,
  employer_id TEXT NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  raw_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  source_system TEXT NOT NULL,
  confidence_score REAL NOT NULL DEFAULT 1.0,
  review_status TEXT NOT NULL DEFAULT 'auto',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  county TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  msa TEXT,
  normalized_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_files (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  official_url TEXT NOT NULL,
  fiscal_year INTEGER,
  quarter TEXT,
  file_type TEXT NOT NULL,
  checksum_sha256 TEXT,
  storage_path TEXT,
  latest_data_date TEXT,
  downloaded_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS etl_runs (
  id TEXT PRIMARY KEY,
  parser_name TEXT NOT NULL,
  source_file_id TEXT REFERENCES source_files(id),
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  records_seen INTEGER NOT NULL DEFAULT 0,
  records_inserted INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  message TEXT
);

CREATE TABLE IF NOT EXISTS h1b_lca_records (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  employer_id TEXT NOT NULL REFERENCES employers(id),
  location_id TEXT REFERENCES locations(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  case_number TEXT,
  case_status TEXT NOT NULL,
  raw_employer_name TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  soc_code TEXT,
  soc_title TEXT,
  job_title TEXT,
  worksite_city TEXT,
  worksite_state TEXT,
  worksite_postal_code TEXT,
  wage_rate_of_pay_from REAL,
  wage_rate_of_pay_to REAL,
  wage_unit TEXT,
  annualized_wage_from REAL,
  annualized_wage_to REAL,
  prevailing_wage REAL,
  prevailing_wage_unit TEXT,
  wage_level TEXT,
  full_time INTEGER,
  received_date TEXT,
  decision_date TEXT,
  raw_record_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS perm_records (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  employer_id TEXT NOT NULL REFERENCES employers(id),
  location_id TEXT REFERENCES locations(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  case_number TEXT,
  case_status TEXT NOT NULL,
  raw_employer_name TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  job_title TEXT,
  soc_code TEXT,
  soc_title TEXT,
  worksite_city TEXT,
  worksite_state TEXT,
  wage_offer_from REAL,
  wage_offer_to REAL,
  wage_unit TEXT,
  priority_date TEXT,
  received_date TEXT,
  decision_date TEXT,
  raw_record_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pwd_records (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  location_id TEXT REFERENCES locations(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  data_series TEXT NOT NULL,
  effective_year INTEGER NOT NULL,
  soc_code TEXT NOT NULL,
  soc_title TEXT,
  area_name TEXT,
  city TEXT,
  state TEXT,
  wage_level_1 REAL,
  wage_level_2 REAL,
  wage_level_3 REAL,
  wage_level_4 REAL,
  wage_unit TEXT NOT NULL,
  raw_record_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS uscis_h1b_employer_records (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  employer_id TEXT NOT NULL REFERENCES employers(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  fiscal_year INTEGER NOT NULL,
  raw_employer_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  naics_code TEXT,
  initial_approvals INTEGER,
  initial_denials INTEGER,
  continuing_approvals INTEGER,
  continuing_denials INTEGER,
  raw_record_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visa_bulletin_months (
  id TEXT PRIMARY KEY,
  month_key TEXT NOT NULL UNIQUE,
  bulletin_year INTEGER NOT NULL,
  bulletin_month INTEGER NOT NULL,
  source_url TEXT NOT NULL,
  published_at TEXT,
  uscis_filing_chart TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visa_bulletin_dates (
  id TEXT PRIMARY KEY,
  bulletin_month_id TEXT NOT NULL REFERENCES visa_bulletin_months(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  chargeability_area TEXT NOT NULL,
  chart_type TEXT NOT NULL,
  cutoff_date TEXT,
  cutoff_status TEXT NOT NULL,
  raw_value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_page_metrics (
  id TEXT PRIMARY KEY,
  employer_id TEXT NOT NULL UNIQUE REFERENCES employers(id) ON DELETE CASCADE,
  lca_count_5y INTEGER NOT NULL DEFAULT 0,
  perm_count_5y INTEGER NOT NULL DEFAULT 0,
  uscis_record_count_5y INTEGER NOT NULL DEFAULT 0,
  job_title_count INTEGER NOT NULL DEFAULT 0,
  location_count INTEGER NOT NULL DEFAULT 0,
  latest_fiscal_year INTEGER,
  quality_score REAL NOT NULL DEFAULT 0,
  indexable INTEGER NOT NULL DEFAULT 0,
  noindex_reason TEXT,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guide_pages (
  slug TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  meta_description_zh TEXT NOT NULL,
  section TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'planned',
  last_reviewed_on TEXT,
  official_sources_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS correction_requests (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  page_url TEXT,
  employer_id TEXT REFERENCES employers(id),
  request_type TEXT NOT NULL,
  submitter_email TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_employers_slug ON employers(slug);
CREATE INDEX IF NOT EXISTS idx_employers_normalized_name ON employers(normalized_name);

CREATE INDEX IF NOT EXISTS idx_employer_aliases_raw_name ON employer_aliases(raw_name);
CREATE INDEX IF NOT EXISTS idx_employer_aliases_normalized_name ON employer_aliases(normalized_name);
CREATE INDEX IF NOT EXISTS idx_employer_aliases_employer_id ON employer_aliases(employer_id);

CREATE INDEX IF NOT EXISTS idx_locations_city_state ON locations(city, state);
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state);

CREATE INDEX IF NOT EXISTS idx_source_files_source_year ON source_files(source_name, fiscal_year);

CREATE INDEX IF NOT EXISTS idx_h1b_lca_source_record_id ON h1b_lca_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_raw_employer_name ON h1b_lca_records(raw_employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_employer_year ON h1b_lca_records(employer_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_fiscal_year ON h1b_lca_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_soc_code ON h1b_lca_records(soc_code);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_city_state ON h1b_lca_records(worksite_city, worksite_state);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_job_title ON h1b_lca_records(job_title);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_case_status ON h1b_lca_records(case_status);

CREATE INDEX IF NOT EXISTS idx_perm_source_record_id ON perm_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_perm_raw_employer_name ON perm_records(raw_employer_name);
CREATE INDEX IF NOT EXISTS idx_perm_employer_year ON perm_records(employer_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_perm_fiscal_year ON perm_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_perm_soc_code ON perm_records(soc_code);
CREATE INDEX IF NOT EXISTS idx_perm_city_state ON perm_records(worksite_city, worksite_state);
CREATE INDEX IF NOT EXISTS idx_perm_job_title ON perm_records(job_title);
CREATE INDEX IF NOT EXISTS idx_perm_case_status ON perm_records(case_status);

CREATE INDEX IF NOT EXISTS idx_pwd_source_record_id ON pwd_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_pwd_soc_location_year ON pwd_records(soc_code, state, city, effective_year);
CREATE INDEX IF NOT EXISTS idx_pwd_effective_year ON pwd_records(effective_year);
CREATE INDEX IF NOT EXISTS idx_pwd_city_state ON pwd_records(city, state);

CREATE INDEX IF NOT EXISTS idx_uscis_h1b_source_record_id ON uscis_h1b_employer_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_uscis_h1b_raw_employer_name ON uscis_h1b_employer_records(raw_employer_name);
CREATE INDEX IF NOT EXISTS idx_uscis_h1b_employer_year ON uscis_h1b_employer_records(employer_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_uscis_h1b_fiscal_year ON uscis_h1b_employer_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_uscis_h1b_city_state ON uscis_h1b_employer_records(city, state);

CREATE INDEX IF NOT EXISTS idx_visa_bulletin_month_key ON visa_bulletin_months(month_key);
CREATE INDEX IF NOT EXISTS idx_visa_bulletin_dates_lookup ON visa_bulletin_dates(
  bulletin_month_id,
  category,
  chargeability_area,
  chart_type
);

CREATE INDEX IF NOT EXISTS idx_company_page_metrics_indexable ON company_page_metrics(indexable, quality_score);
CREATE INDEX IF NOT EXISTS idx_company_page_metrics_latest_year ON company_page_metrics(latest_fiscal_year);

CREATE INDEX IF NOT EXISTS idx_guide_pages_section_priority ON guide_pages(section, priority);
CREATE INDEX IF NOT EXISTS idx_guide_pages_status ON guide_pages(status);

CREATE INDEX IF NOT EXISTS idx_correction_requests_status ON correction_requests(status);
CREATE INDEX IF NOT EXISTS idx_correction_requests_employer_id ON correction_requests(employer_id);
