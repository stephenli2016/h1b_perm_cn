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

CREATE TABLE IF NOT EXISTS h1b_lca_worksite_records (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  location_id TEXT REFERENCES locations(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  case_number TEXT,
  fiscal_year INTEGER NOT NULL,
  worksite_sequence INTEGER,
  workers INTEGER,
  secondary_entity INTEGER,
  secondary_entity_name TEXT,
  worksite_city TEXT,
  worksite_county TEXT,
  worksite_state TEXT,
  worksite_postal_code TEXT,
  raw_record_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS h1b_lca_appendix_a_records (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  case_number TEXT,
  fiscal_year INTEGER NOT NULL,
  exempt_worker_count INTEGER,
  h1b_dependent INTEGER,
  willful_violator INTEGER,
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
  pwd_case_number TEXT,
  pwd_soc_code TEXT,
  pwd_soc_title TEXT,
  pwd_wage REAL,
  pwd_unit TEXT,
  annualized_pwd_wage REAL,
  pwd_wage_level TEXT,
  minimum_education TEXT,
  major_field_of_study TEXT,
  training_months INTEGER,
  experience_months INTEGER,
  alternate_education TEXT,
  alternate_experience_months INTEGER,
  foreign_language_required INTEGER,
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

CREATE TABLE IF NOT EXISTS pwd_case_records (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  employer_id TEXT REFERENCES employers(id),
  location_id TEXT REFERENCES locations(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  case_number TEXT,
  case_status TEXT,
  visa_class TEXT,
  raw_employer_name TEXT,
  fiscal_year INTEGER NOT NULL,
  naics_code TEXT,
  job_title TEXT,
  soc_code TEXT,
  soc_title TEXT,
  worksite_city TEXT,
  worksite_county TEXT,
  worksite_state TEXT,
  worksite_postal_code TEXT,
  other_worksite_location INTEGER,
  wage_source_requested TEXT,
  pwd_wage_rate REAL,
  pwd_unit TEXT,
  annualized_pwd_wage REAL,
  pwd_wage_level TEXT,
  pwd_wage_source TEXT,
  bls_area TEXT,
  o_net_code TEXT,
  o_net_title TEXT,
  required_education_level TEXT,
  required_education_major TEXT,
  required_training_months INTEGER,
  required_experience_months INTEGER,
  required_occupation TEXT,
  alternative_requirements INTEGER,
  alt_education_level TEXT,
  alt_experience_months INTEGER,
  special_skills INTEGER,
  foreign_language_required INTEGER,
  travel_required INTEGER,
  received_date TEXT,
  determination_date TEXT,
  expiration_date TEXT,
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

CREATE TABLE IF NOT EXISTS bls_oews_occupations (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  release_year INTEGER NOT NULL,
  occupation_code TEXT NOT NULL,
  occupation_name TEXT NOT NULL,
  display_level INTEGER,
  selectable INTEGER,
  sort_sequence INTEGER,
  raw_record_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bls_oews_areas (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  release_year INTEGER NOT NULL,
  area_code TEXT NOT NULL,
  area_name TEXT NOT NULL,
  area_type_code TEXT,
  display_level INTEGER,
  selectable INTEGER,
  sort_sequence INTEGER,
  raw_record_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS naics_industries (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  release_year INTEGER NOT NULL,
  naics_code TEXT NOT NULL,
  industry_title TEXT NOT NULL,
  classification_level TEXT NOT NULL,
  sector_code TEXT,
  sector_title TEXT,
  change_indicator TEXT,
  trilateral INTEGER,
  raw_record_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onet_occupations (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  release_version TEXT NOT NULL,
  onet_soc_code TEXT NOT NULL,
  soc_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  description TEXT,
  job_family_code TEXT,
  job_family_title TEXT,
  raw_record_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onet_job_zones (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  source_record_id TEXT NOT NULL,
  source_record_fingerprint TEXT NOT NULL UNIQUE,
  release_version TEXT NOT NULL,
  onet_soc_code TEXT NOT NULL,
  soc_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  job_zone INTEGER NOT NULL,
  job_zone_name TEXT,
  experience TEXT,
  education TEXT,
  job_training TEXT,
  examples TEXT,
  svp_range TEXT,
  date_updated TEXT,
  domain_source TEXT,
  raw_record_json TEXT,
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
CREATE INDEX IF NOT EXISTS idx_employers_headquarters_location_id ON employers(headquarters_location_id);

CREATE INDEX IF NOT EXISTS idx_employer_aliases_raw_name ON employer_aliases(raw_name);
CREATE INDEX IF NOT EXISTS idx_employer_aliases_normalized_name ON employer_aliases(normalized_name);
CREATE INDEX IF NOT EXISTS idx_employer_aliases_employer_id ON employer_aliases(employer_id);

CREATE INDEX IF NOT EXISTS idx_locations_city_state ON locations(city, state);
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state);

CREATE INDEX IF NOT EXISTS idx_source_files_source_year ON source_files(source_name, fiscal_year);

CREATE INDEX IF NOT EXISTS idx_etl_runs_source_file_id ON etl_runs(source_file_id);

CREATE INDEX IF NOT EXISTS idx_h1b_lca_source_record_id ON h1b_lca_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_source_file_id ON h1b_lca_records(source_file_id);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_raw_employer_name ON h1b_lca_records(raw_employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_employer_year ON h1b_lca_records(employer_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_location_id ON h1b_lca_records(location_id);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_fiscal_year ON h1b_lca_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_soc_code ON h1b_lca_records(soc_code);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_city_state ON h1b_lca_records(worksite_city, worksite_state);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_job_title ON h1b_lca_records(job_title);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_case_status ON h1b_lca_records(case_status);

CREATE INDEX IF NOT EXISTS idx_h1b_lca_worksite_case_number ON h1b_lca_worksite_records(case_number);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_worksite_source_file_id ON h1b_lca_worksite_records(source_file_id);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_worksite_location_id ON h1b_lca_worksite_records(location_id);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_worksite_year ON h1b_lca_worksite_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_worksite_city_state ON h1b_lca_worksite_records(worksite_city, worksite_state);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_appendix_case_number ON h1b_lca_appendix_a_records(case_number);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_appendix_source_file_id ON h1b_lca_appendix_a_records(source_file_id);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_appendix_year ON h1b_lca_appendix_a_records(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_perm_source_record_id ON perm_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_perm_source_file_id ON perm_records(source_file_id);
CREATE INDEX IF NOT EXISTS idx_perm_raw_employer_name ON perm_records(raw_employer_name);
CREATE INDEX IF NOT EXISTS idx_perm_employer_year ON perm_records(employer_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_perm_location_id ON perm_records(location_id);
CREATE INDEX IF NOT EXISTS idx_perm_fiscal_year ON perm_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_perm_soc_code ON perm_records(soc_code);
CREATE INDEX IF NOT EXISTS idx_perm_city_state ON perm_records(worksite_city, worksite_state);
CREATE INDEX IF NOT EXISTS idx_perm_job_title ON perm_records(job_title);
CREATE INDEX IF NOT EXISTS idx_perm_case_status ON perm_records(case_status);

CREATE INDEX IF NOT EXISTS idx_pwd_source_record_id ON pwd_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_pwd_source_file_id ON pwd_records(source_file_id);
CREATE INDEX IF NOT EXISTS idx_pwd_location_id ON pwd_records(location_id);
CREATE INDEX IF NOT EXISTS idx_pwd_soc_location_year ON pwd_records(soc_code, state, city, effective_year);
CREATE INDEX IF NOT EXISTS idx_pwd_effective_year ON pwd_records(effective_year);
CREATE INDEX IF NOT EXISTS idx_pwd_city_state ON pwd_records(city, state);

CREATE INDEX IF NOT EXISTS idx_pwd_case_source_record_id ON pwd_case_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_pwd_case_source_file_id ON pwd_case_records(source_file_id);
CREATE INDEX IF NOT EXISTS idx_pwd_case_employer_year ON pwd_case_records(employer_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_pwd_case_location_id ON pwd_case_records(location_id);
CREATE INDEX IF NOT EXISTS idx_pwd_case_fiscal_year ON pwd_case_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_pwd_case_soc_code ON pwd_case_records(soc_code);
CREATE INDEX IF NOT EXISTS idx_pwd_case_city_state ON pwd_case_records(worksite_city, worksite_state);
CREATE INDEX IF NOT EXISTS idx_pwd_case_status ON pwd_case_records(case_status);

CREATE INDEX IF NOT EXISTS idx_uscis_h1b_source_record_id ON uscis_h1b_employer_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_uscis_h1b_source_file_id ON uscis_h1b_employer_records(source_file_id);
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

CREATE INDEX IF NOT EXISTS idx_bls_oews_occupation_code ON bls_oews_occupations(occupation_code);
CREATE INDEX IF NOT EXISTS idx_bls_oews_occupations_source_file_id ON bls_oews_occupations(source_file_id);
CREATE INDEX IF NOT EXISTS idx_bls_oews_area_code ON bls_oews_areas(area_code);
CREATE INDEX IF NOT EXISTS idx_bls_oews_area_name ON bls_oews_areas(area_name);
CREATE INDEX IF NOT EXISTS idx_bls_oews_areas_source_file_id ON bls_oews_areas(source_file_id);

CREATE INDEX IF NOT EXISTS idx_naics_industries_code ON naics_industries(naics_code);
CREATE INDEX IF NOT EXISTS idx_naics_industries_sector ON naics_industries(sector_code);
CREATE INDEX IF NOT EXISTS idx_naics_industries_source_file_id ON naics_industries(source_file_id);
CREATE INDEX IF NOT EXISTS idx_onet_occupations_soc_code ON onet_occupations(soc_code);
CREATE INDEX IF NOT EXISTS idx_onet_occupations_onet_soc_code ON onet_occupations(onet_soc_code);
CREATE INDEX IF NOT EXISTS idx_onet_occupations_source_file_id ON onet_occupations(source_file_id);
CREATE INDEX IF NOT EXISTS idx_onet_job_zones_soc_code ON onet_job_zones(soc_code);
CREATE INDEX IF NOT EXISTS idx_onet_job_zones_job_zone ON onet_job_zones(job_zone);
CREATE INDEX IF NOT EXISTS idx_onet_job_zones_source_file_id ON onet_job_zones(source_file_id);

CREATE INDEX IF NOT EXISTS idx_company_page_metrics_indexable ON company_page_metrics(indexable, quality_score);
CREATE INDEX IF NOT EXISTS idx_company_page_metrics_latest_year ON company_page_metrics(latest_fiscal_year);

CREATE INDEX IF NOT EXISTS idx_guide_pages_section_priority ON guide_pages(section, priority);
CREATE INDEX IF NOT EXISTS idx_guide_pages_status ON guide_pages(status);

CREATE INDEX IF NOT EXISTS idx_correction_requests_status ON correction_requests(status);
CREATE INDEX IF NOT EXISTS idx_correction_requests_employer_id ON correction_requests(employer_id);
