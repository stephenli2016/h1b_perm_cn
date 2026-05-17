-- VisaRadar CN production Postgres/Supabase schema.
-- Mirrors the local SQLite fixture schema while using Postgres-native
-- date, boolean, numeric, timestamptz, and jsonb column types.
--
-- Security posture for M26:
-- - RLS is enabled on every public table.
-- - No anon/authenticated Data API policies are created in this baseline.
-- - Server-side production code should use DATABASE_URL or a server-only
--   Supabase service role key, never a browser-exposed key.

BEGIN;

CREATE TABLE IF NOT EXISTS public.locations (
  id text PRIMARY KEY,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text,
  county text,
  country text NOT NULL DEFAULT 'US',
  msa text,
  normalized_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employers (
  id text PRIMARY KEY,
  canonical_name text NOT NULL,
  display_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  normalized_name text NOT NULL,
  headquarters_location_id text REFERENCES public.locations(id),
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employer_aliases (
  id text PRIMARY KEY,
  employer_id text NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  raw_name text NOT NULL,
  normalized_name text NOT NULL,
  source_system text NOT NULL,
  confidence_score numeric(5,4) NOT NULL DEFAULT 1.0,
  review_status text NOT NULL DEFAULT 'auto',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.source_files (
  id text PRIMARY KEY,
  source_name text NOT NULL,
  official_url text NOT NULL,
  fiscal_year integer,
  quarter text,
  file_type text NOT NULL,
  checksum_sha256 text,
  storage_path text,
  latest_data_date date,
  downloaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.etl_runs (
  id text PRIMARY KEY,
  parser_name text NOT NULL,
  source_file_id text REFERENCES public.source_files(id),
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  records_seen integer NOT NULL DEFAULT 0,
  records_inserted integer NOT NULL DEFAULT 0,
  records_failed integer NOT NULL DEFAULT 0,
  message text
);

CREATE TABLE IF NOT EXISTS public.h1b_lca_records (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  employer_id text NOT NULL REFERENCES public.employers(id),
  location_id text REFERENCES public.locations(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  case_number text,
  case_status text NOT NULL,
  raw_employer_name text NOT NULL,
  fiscal_year integer NOT NULL,
  soc_code text,
  soc_title text,
  job_title text,
  worksite_city text,
  worksite_state text,
  worksite_postal_code text,
  wage_rate_of_pay_from numeric(14,2),
  wage_rate_of_pay_to numeric(14,2),
  wage_unit text,
  annualized_wage_from numeric(14,2),
  annualized_wage_to numeric(14,2),
  prevailing_wage numeric(14,2),
  prevailing_wage_unit text,
  wage_level text,
  full_time boolean,
  received_date date,
  decision_date date,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.h1b_lca_worksite_records (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  location_id text REFERENCES public.locations(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  case_number text,
  fiscal_year integer NOT NULL,
  worksite_sequence integer,
  workers integer,
  secondary_entity boolean,
  secondary_entity_name text,
  worksite_city text,
  worksite_county text,
  worksite_state text,
  worksite_postal_code text,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.h1b_lca_appendix_a_records (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  case_number text,
  fiscal_year integer NOT NULL,
  exempt_worker_count integer,
  h1b_dependent boolean,
  willful_violator boolean,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perm_records (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  employer_id text NOT NULL REFERENCES public.employers(id),
  location_id text REFERENCES public.locations(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  case_number text,
  case_status text NOT NULL,
  raw_employer_name text NOT NULL,
  fiscal_year integer NOT NULL,
  job_title text,
  soc_code text,
  soc_title text,
  worksite_city text,
  worksite_state text,
  wage_offer_from numeric(14,2),
  wage_offer_to numeric(14,2),
  wage_unit text,
  priority_date date,
  received_date date,
  decision_date date,
  pwd_case_number text,
  pwd_soc_code text,
  pwd_soc_title text,
  pwd_wage numeric(14,2),
  pwd_unit text,
  annualized_pwd_wage numeric(14,2),
  pwd_wage_level text,
  minimum_education text,
  major_field_of_study text,
  training_months integer,
  experience_months integer,
  alternate_education text,
  alternate_experience_months integer,
  foreign_language_required boolean,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pwd_records (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  location_id text REFERENCES public.locations(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  data_series text NOT NULL,
  effective_year integer NOT NULL,
  soc_code text NOT NULL,
  soc_title text,
  area_name text,
  city text,
  state text,
  wage_level_1 numeric(14,2),
  wage_level_2 numeric(14,2),
  wage_level_3 numeric(14,2),
  wage_level_4 numeric(14,2),
  wage_unit text NOT NULL,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pwd_case_records (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  employer_id text REFERENCES public.employers(id),
  location_id text REFERENCES public.locations(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  case_number text,
  case_status text,
  visa_class text,
  raw_employer_name text,
  fiscal_year integer NOT NULL,
  naics_code text,
  job_title text,
  soc_code text,
  soc_title text,
  worksite_city text,
  worksite_county text,
  worksite_state text,
  worksite_postal_code text,
  other_worksite_location boolean,
  wage_source_requested text,
  pwd_wage_rate numeric(14,2),
  pwd_unit text,
  annualized_pwd_wage numeric(14,2),
  pwd_wage_level text,
  pwd_wage_source text,
  bls_area text,
  o_net_code text,
  o_net_title text,
  required_education_level text,
  required_education_major text,
  required_training_months integer,
  required_experience_months integer,
  required_occupation text,
  alternative_requirements boolean,
  alt_education_level text,
  alt_experience_months integer,
  special_skills boolean,
  foreign_language_required boolean,
  travel_required boolean,
  received_date date,
  determination_date date,
  expiration_date date,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.uscis_h1b_employer_records (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  employer_id text NOT NULL REFERENCES public.employers(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  fiscal_year integer NOT NULL,
  raw_employer_name text NOT NULL,
  city text,
  state text,
  postal_code text,
  naics_code text,
  initial_approvals integer,
  initial_denials integer,
  continuing_approvals integer,
  continuing_denials integer,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visa_bulletin_months (
  id text PRIMARY KEY,
  month_key text NOT NULL UNIQUE,
  bulletin_year integer NOT NULL,
  bulletin_month integer NOT NULL,
  source_url text NOT NULL,
  published_at date,
  uscis_filing_chart text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visa_bulletin_dates (
  id text PRIMARY KEY,
  bulletin_month_id text NOT NULL REFERENCES public.visa_bulletin_months(id) ON DELETE CASCADE,
  category text NOT NULL,
  chargeability_area text NOT NULL,
  chart_type text NOT NULL,
  cutoff_date date,
  cutoff_status text NOT NULL,
  raw_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bls_oews_occupations (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  release_year integer NOT NULL,
  occupation_code text NOT NULL,
  occupation_name text NOT NULL,
  display_level integer,
  selectable boolean,
  sort_sequence integer,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bls_oews_areas (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  release_year integer NOT NULL,
  area_code text NOT NULL,
  area_name text NOT NULL,
  area_type_code text,
  display_level integer,
  selectable boolean,
  sort_sequence integer,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.naics_industries (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  release_year integer NOT NULL,
  naics_code text NOT NULL,
  industry_title text NOT NULL,
  classification_level text NOT NULL,
  sector_code text,
  sector_title text,
  change_indicator text,
  trilateral boolean,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onet_occupations (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  release_version text NOT NULL,
  onet_soc_code text NOT NULL,
  soc_code text NOT NULL,
  occupation_title text NOT NULL,
  description text,
  job_family_code text,
  job_family_title text,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onet_job_zones (
  id text PRIMARY KEY,
  source_file_id text NOT NULL REFERENCES public.source_files(id),
  source_record_id text NOT NULL,
  source_record_fingerprint text NOT NULL UNIQUE,
  release_version text NOT NULL,
  onet_soc_code text NOT NULL,
  soc_code text NOT NULL,
  occupation_title text NOT NULL,
  job_zone integer NOT NULL,
  job_zone_name text,
  experience text,
  education text,
  job_training text,
  examples text,
  svp_range text,
  date_updated text,
  domain_source text,
  raw_record_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_page_metrics (
  id text PRIMARY KEY,
  employer_id text NOT NULL UNIQUE REFERENCES public.employers(id) ON DELETE CASCADE,
  lca_count_5y integer NOT NULL DEFAULT 0,
  perm_count_5y integer NOT NULL DEFAULT 0,
  uscis_record_count_5y integer NOT NULL DEFAULT 0,
  job_title_count integer NOT NULL DEFAULT 0,
  location_count integer NOT NULL DEFAULT 0,
  latest_fiscal_year integer,
  quality_score numeric(7,3) NOT NULL DEFAULT 0,
  indexable boolean NOT NULL DEFAULT false,
  noindex_reason text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guide_pages (
  slug text PRIMARY KEY,
  title_zh text NOT NULL,
  meta_description_zh text NOT NULL,
  section text NOT NULL,
  priority integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'planned',
  last_reviewed_on date,
  official_sources_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.correction_requests (
  id text PRIMARY KEY,
  public_id text NOT NULL UNIQUE,
  page_url text,
  employer_id text REFERENCES public.employers(id),
  request_type text NOT NULL,
  submitter_email text,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_employers_slug ON public.employers(slug);
CREATE INDEX IF NOT EXISTS idx_employers_normalized_name ON public.employers(normalized_name);

CREATE INDEX IF NOT EXISTS idx_employer_aliases_raw_name ON public.employer_aliases(raw_name);
CREATE INDEX IF NOT EXISTS idx_employer_aliases_normalized_name ON public.employer_aliases(normalized_name);
CREATE INDEX IF NOT EXISTS idx_employer_aliases_employer_id ON public.employer_aliases(employer_id);

CREATE INDEX IF NOT EXISTS idx_locations_city_state ON public.locations(city, state);
CREATE INDEX IF NOT EXISTS idx_locations_state ON public.locations(state);

CREATE INDEX IF NOT EXISTS idx_source_files_source_year ON public.source_files(source_name, fiscal_year);

CREATE INDEX IF NOT EXISTS idx_h1b_lca_source_record_id ON public.h1b_lca_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_raw_employer_name ON public.h1b_lca_records(raw_employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_employer_year ON public.h1b_lca_records(employer_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_fiscal_year ON public.h1b_lca_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_soc_code ON public.h1b_lca_records(soc_code);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_city_state ON public.h1b_lca_records(worksite_city, worksite_state);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_job_title ON public.h1b_lca_records(job_title);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_case_status ON public.h1b_lca_records(case_status);

CREATE INDEX IF NOT EXISTS idx_h1b_lca_worksite_case_number ON public.h1b_lca_worksite_records(case_number);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_worksite_year ON public.h1b_lca_worksite_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_worksite_city_state ON public.h1b_lca_worksite_records(worksite_city, worksite_state);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_appendix_case_number ON public.h1b_lca_appendix_a_records(case_number);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_appendix_year ON public.h1b_lca_appendix_a_records(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_perm_source_record_id ON public.perm_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_perm_raw_employer_name ON public.perm_records(raw_employer_name);
CREATE INDEX IF NOT EXISTS idx_perm_employer_year ON public.perm_records(employer_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_perm_fiscal_year ON public.perm_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_perm_soc_code ON public.perm_records(soc_code);
CREATE INDEX IF NOT EXISTS idx_perm_city_state ON public.perm_records(worksite_city, worksite_state);
CREATE INDEX IF NOT EXISTS idx_perm_job_title ON public.perm_records(job_title);
CREATE INDEX IF NOT EXISTS idx_perm_case_status ON public.perm_records(case_status);

CREATE INDEX IF NOT EXISTS idx_pwd_source_record_id ON public.pwd_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_pwd_soc_location_year ON public.pwd_records(soc_code, state, city, effective_year);
CREATE INDEX IF NOT EXISTS idx_pwd_effective_year ON public.pwd_records(effective_year);
CREATE INDEX IF NOT EXISTS idx_pwd_city_state ON public.pwd_records(city, state);

CREATE INDEX IF NOT EXISTS idx_pwd_case_source_record_id ON public.pwd_case_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_pwd_case_employer_year ON public.pwd_case_records(employer_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_pwd_case_fiscal_year ON public.pwd_case_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_pwd_case_soc_code ON public.pwd_case_records(soc_code);
CREATE INDEX IF NOT EXISTS idx_pwd_case_city_state ON public.pwd_case_records(worksite_city, worksite_state);
CREATE INDEX IF NOT EXISTS idx_pwd_case_status ON public.pwd_case_records(case_status);

CREATE INDEX IF NOT EXISTS idx_uscis_h1b_source_record_id ON public.uscis_h1b_employer_records(source_record_id);
CREATE INDEX IF NOT EXISTS idx_uscis_h1b_raw_employer_name ON public.uscis_h1b_employer_records(raw_employer_name);
CREATE INDEX IF NOT EXISTS idx_uscis_h1b_employer_year ON public.uscis_h1b_employer_records(employer_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_uscis_h1b_fiscal_year ON public.uscis_h1b_employer_records(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_uscis_h1b_city_state ON public.uscis_h1b_employer_records(city, state);

CREATE INDEX IF NOT EXISTS idx_visa_bulletin_month_key ON public.visa_bulletin_months(month_key);
CREATE INDEX IF NOT EXISTS idx_visa_bulletin_dates_lookup ON public.visa_bulletin_dates(
  bulletin_month_id,
  category,
  chargeability_area,
  chart_type
);

CREATE INDEX IF NOT EXISTS idx_bls_oews_occupation_code ON public.bls_oews_occupations(occupation_code);
CREATE INDEX IF NOT EXISTS idx_bls_oews_area_code ON public.bls_oews_areas(area_code);
CREATE INDEX IF NOT EXISTS idx_bls_oews_area_name ON public.bls_oews_areas(area_name);

CREATE INDEX IF NOT EXISTS idx_naics_industries_code ON public.naics_industries(naics_code);
CREATE INDEX IF NOT EXISTS idx_naics_industries_sector ON public.naics_industries(sector_code);
CREATE INDEX IF NOT EXISTS idx_onet_occupations_soc_code ON public.onet_occupations(soc_code);
CREATE INDEX IF NOT EXISTS idx_onet_occupations_onet_soc_code ON public.onet_occupations(onet_soc_code);
CREATE INDEX IF NOT EXISTS idx_onet_job_zones_soc_code ON public.onet_job_zones(soc_code);
CREATE INDEX IF NOT EXISTS idx_onet_job_zones_job_zone ON public.onet_job_zones(job_zone);

CREATE INDEX IF NOT EXISTS idx_company_page_metrics_indexable ON public.company_page_metrics(indexable, quality_score);
CREATE INDEX IF NOT EXISTS idx_company_page_metrics_latest_year ON public.company_page_metrics(latest_fiscal_year);

CREATE INDEX IF NOT EXISTS idx_guide_pages_section_priority ON public.guide_pages(section, priority);
CREATE INDEX IF NOT EXISTS idx_guide_pages_status ON public.guide_pages(status);

CREATE INDEX IF NOT EXISTS idx_correction_requests_status ON public.correction_requests(status);
CREATE INDEX IF NOT EXISTS idx_correction_requests_employer_id ON public.correction_requests(employer_id);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etl_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.h1b_lca_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.h1b_lca_worksite_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.h1b_lca_appendix_a_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perm_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwd_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwd_case_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uscis_h1b_employer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_bulletin_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_bulletin_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bls_oews_occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bls_oews_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.naics_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_job_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_page_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO service_role';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role';
  END IF;
END
$$;

COMMIT;
