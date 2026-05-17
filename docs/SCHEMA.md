# Database Schema — M03

Milestone: M03 — Database schema and local data model

## Strategy

M03 uses direct SQL migrations plus typed TypeScript fixture query helpers.

- Production target: Supabase Postgres.
- Local mode now: SQLite-compatible fixture mode with `data/migrations/0001_initial_schema.sql`.
- Query layer now: small TypeScript helpers in `lib/db/local-repository.ts` over local fixtures.
- Later milestones can adapt the same normalized tables to Supabase/Postgres migrations and replace fixture reads with server-side SQL.

No Supabase keys are required for M03.

## Migration

Primary migration:

- `data/migrations/0001_initial_schema.sql`

The migration is written to run locally in SQLite for validation. It uses conservative column types (`TEXT`, `INTEGER`, `REAL`) so the model is easy to port to Postgres later. Date values are stored as ISO text in local mode and can become `date` / `timestamptz` in production migrations.

M26 production migration:

- `data/migrations/postgres/0001_initial_schema.sql`

The production migration mirrors the normalized local model in Postgres/Supabase
with native `date`, `timestamptz`, `numeric`, `boolean`, and `jsonb` types. It
keeps deterministic text IDs so local fixture-derived records and production
ETL outputs can share the same identifiers.

Security defaults:

- RLS is enabled on every table in the `public` schema.
- No `anon` or `authenticated` Data API policies are created in the baseline
  migration.
- The Supabase `service_role` role receives table privileges only when that role
  exists, and it must remain server-side only.
- Future browser-side Data API access must add narrow grants and table-specific
  RLS policies in the same migration.

Production setup details live in `docs/PRODUCTION_DATABASE_M26.md`.

## Tables

### `employers`

Canonical employer entity.

Important columns:

- `canonical_name`
- `display_name`
- `slug`
- `normalized_name`
- `headquarters_location_id`

Indexes:

- `idx_employers_slug`
- `idx_employers_normalized_name`

### `employer_aliases`

Maps raw employer names from source systems to canonical employers.

Important columns:

- `employer_id`
- `raw_name`
- `normalized_name`
- `source_system`
- `confidence_score`
- `review_status`

Indexes:

- `idx_employer_aliases_raw_name`
- `idx_employer_aliases_normalized_name`
- `idx_employer_aliases_employer_id`

Canonicalization rules:

- Preserve raw employer names.
- Normalize casing, punctuation, whitespace, and common legal suffixes.
- Do not merge ambiguous names automatically.
- Use confidence scores and review status for auditability.

### `locations`

Normalized worksite/location entity.

Important columns:

- `city`
- `state`
- `postal_code`
- `country`
- `normalized_key`

Indexes:

- `idx_locations_city_state`
- `idx_locations_state`

### `source_files`

Tracks official source files or source pages used by ETL.

Important columns:

- `source_name`
- `official_url`
- `fiscal_year`
- `quarter`
- `file_type`
- `checksum_sha256`
- `storage_path`
- `latest_data_date`
- `downloaded_at`

Index:

- `idx_source_files_source_year`

### `etl_runs`

Tracks parser runs and fixture loads.

Important columns:

- `parser_name`
- `source_file_id`
- `status`
- `started_at`
- `completed_at`
- `records_seen`
- `records_inserted`
- `records_failed`
- `message`

### `h1b_lca_records`

Normalized DOL OFLC LCA / H-1B disclosure records.

Important columns:

- `source_file_id`
- `employer_id`
- `location_id`
- `source_record_id`
- `source_record_fingerprint`
- `case_number`
- `case_status`
- `raw_employer_name`
- `fiscal_year`
- `soc_code`
- `soc_title`
- `job_title`
- `worksite_city`
- `worksite_state`
- `wage_rate_of_pay_from`
- `wage_rate_of_pay_to`
- `wage_unit`
- `annualized_wage_from`
- `annualized_wage_to`
- `prevailing_wage`
- `prevailing_wage_unit`
- `wage_level`
- `full_time`
- `received_date`
- `decision_date`
- `raw_record_json`

Indexes:

- `idx_h1b_lca_source_record_id`
- `idx_h1b_lca_raw_employer_name`
- `idx_h1b_lca_employer_year`
- `idx_h1b_lca_fiscal_year`
- `idx_h1b_lca_soc_code`
- `idx_h1b_lca_city_state`
- `idx_h1b_lca_job_title`
- `idx_h1b_lca_case_status`

Interpretation boundary:

LCA records are labor condition application records. They are signals, not H-1B petition approvals, hiring proof, or future sponsorship promises.

### `h1b_lca_worksite_records`

Supplemental DOL LCA worksite rows from the Worksites disclosure files.

Important columns:

- `source_file_id`
- `location_id`
- `source_record_id`
- `source_record_fingerprint`
- `case_number`
- `fiscal_year`
- `worksite_sequence`
- `workers`
- `secondary_entity`
- `secondary_entity_name`
- `worksite_city`
- `worksite_county`
- `worksite_state`
- `worksite_postal_code`
- `raw_record_json`

Indexes:

- `idx_h1b_lca_worksite_case_number`
- `idx_h1b_lca_worksite_year`
- `idx_h1b_lca_worksite_city_state`

### `h1b_lca_appendix_a_records`

Supplemental DOL LCA Appendix A rows for H-1B dependent/willful violator and
exempt-worker context.

Important columns:

- `source_file_id`
- `source_record_id`
- `source_record_fingerprint`
- `case_number`
- `fiscal_year`
- `exempt_worker_count`
- `h1b_dependent`
- `willful_violator`
- `raw_record_json`

Indexes:

- `idx_h1b_lca_appendix_case_number`
- `idx_h1b_lca_appendix_year`

### `perm_records`

Normalized DOL OFLC PERM disclosure records.

Important columns:

- `source_file_id`
- `employer_id`
- `location_id`
- `source_record_id`
- `source_record_fingerprint`
- `case_number`
- `case_status`
- `raw_employer_name`
- `fiscal_year`
- `job_title`
- `soc_code`
- `soc_title`
- `worksite_city`
- `worksite_state`
- `wage_offer_from`
- `wage_offer_to`
- `wage_unit`
- `priority_date`
- `received_date`
- `decision_date`
- `pwd_case_number`
- `pwd_soc_code`
- `pwd_soc_title`
- `pwd_wage`
- `pwd_unit`
- `annualized_pwd_wage`
- `pwd_wage_level`
- `minimum_education`
- `major_field_of_study`
- `training_months`
- `experience_months`
- `alternate_education`
- `alternate_experience_months`
- `foreign_language_required`
- `raw_record_json`

Indexes:

- `idx_perm_source_record_id`
- `idx_perm_raw_employer_name`
- `idx_perm_employer_year`
- `idx_perm_fiscal_year`
- `idx_perm_soc_code`
- `idx_perm_city_state`
- `idx_perm_job_title`
- `idx_perm_case_status`

Interpretation boundary:

PERM certification is one labor certification step. It is not I-140, I-485, consular processing, or green-card approval.

### `pwd_records`

Prevailing wage / wage-level data model.

Important columns:

- `source_file_id`
- `location_id`
- `source_record_id`
- `source_record_fingerprint`
- `data_series`
- `effective_year`
- `soc_code`
- `soc_title`
- `area_name`
- `city`
- `state`
- `wage_level_1`
- `wage_level_2`
- `wage_level_3`
- `wage_level_4`
- `wage_unit`
- `raw_record_json`

Indexes:

- `idx_pwd_source_record_id`
- `idx_pwd_soc_location_year`
- `idx_pwd_effective_year`
- `idx_pwd_city_state`

### `pwd_case_records`

Official DOL PWD case disclosure records. This is separate from
`pwd_records`, which is the reusable FLAG wage lookup table.

Important columns:

- `source_file_id`
- `employer_id`
- `location_id`
- `source_record_id`
- `source_record_fingerprint`
- `case_number`
- `case_status`
- `visa_class`
- `raw_employer_name`
- `fiscal_year`
- `naics_code`
- `job_title`
- `soc_code`
- `soc_title`
- `worksite_city`
- `worksite_county`
- `worksite_state`
- `worksite_postal_code`
- `other_worksite_location`
- `wage_source_requested`
- `pwd_wage_rate`
- `pwd_unit`
- `annualized_pwd_wage`
- `pwd_wage_level`
- `pwd_wage_source`
- `bls_area`
- `o_net_code`
- `o_net_title`
- `required_education_level`
- `required_education_major`
- `required_training_months`
- `required_experience_months`
- `required_occupation`
- `alternative_requirements`
- `alt_education_level`
- `alt_experience_months`
- `special_skills`
- `foreign_language_required`
- `travel_required`
- `received_date`
- `determination_date`
- `expiration_date`
- `raw_record_json`

Indexes:

- `idx_pwd_case_source_record_id`
- `idx_pwd_case_employer_year`
- `idx_pwd_case_fiscal_year`
- `idx_pwd_case_soc_code`
- `idx_pwd_case_city_state`
- `idx_pwd_case_status`

### `uscis_h1b_employer_records`

USCIS H-1B Employer Data Hub data, separate from DOL LCA records.

Important columns:

- `source_file_id`
- `employer_id`
- `source_record_id`
- `source_record_fingerprint`
- `fiscal_year`
- `raw_employer_name`
- `city`
- `state`
- `postal_code`
- `naics_code`
- `initial_approvals`
- `initial_denials`
- `continuing_approvals`
- `continuing_denials`
- `raw_record_json`

Indexes:

- `idx_uscis_h1b_source_record_id`
- `idx_uscis_h1b_raw_employer_name`
- `idx_uscis_h1b_employer_year`
- `idx_uscis_h1b_fiscal_year`
- `idx_uscis_h1b_city_state`

Interpretation boundary:

USCIS employer hub records may support clearly defined petition decision summaries, but public copy must not frame them as an individual's approval odds.

### `visa_bulletin_months`

Stores one Visa Bulletin month.

Important columns:

- `month_key`
- `bulletin_year`
- `bulletin_month`
- `source_url`
- `published_at`
- `uscis_filing_chart`

Index:

- `idx_visa_bulletin_month_key`

### `visa_bulletin_dates`

Stores category/country/chart date rows.

Important columns:

- `bulletin_month_id`
- `category`
- `chargeability_area`
- `chart_type`
- `cutoff_date`
- `cutoff_status`
- `raw_value`

Index:

- `idx_visa_bulletin_dates_lookup`

### `bls_oews_occupations`

Official BLS OEWS occupation metadata used to label and validate SOC/OEWS
occupation codes.

Important columns:

- `source_file_id`
- `source_record_id`
- `source_record_fingerprint`
- `release_year`
- `occupation_code`
- `occupation_name`
- `display_level`
- `selectable`
- `sort_sequence`
- `raw_record_json`

Index:

- `idx_bls_oews_occupation_code`

### `bls_oews_areas`

Official BLS OEWS area metadata used to label and validate wage areas.

Important columns:

- `source_file_id`
- `source_record_id`
- `source_record_fingerprint`
- `release_year`
- `area_code`
- `area_name`
- `area_type_code`
- `display_level`
- `selectable`
- `sort_sequence`
- `raw_record_json`

Indexes:

- `idx_bls_oews_area_code`
- `idx_bls_oews_area_name`

### `company_page_metrics`

Stores quality and indexability metrics for programmatic company pages.

Important columns:

- `employer_id`
- `lca_count_5y`
- `perm_count_5y`
- `uscis_record_count_5y`
- `job_title_count`
- `location_count`
- `latest_fiscal_year`
- `quality_score`
- `indexable`
- `noindex_reason`

M10 note:

`company_page_metrics` can be produced by the local TypeScript fixture helper or by the ETL command `build-company-candidates`. M10 indexability is a data-readiness signal only; later SEO milestones still decide sitemap inclusion and final page-level indexation after visible content quality checks.

Indexes:

- `idx_company_page_metrics_indexable`
- `idx_company_page_metrics_latest_year`

### `guide_pages`

Content inventory for tool and guide pages.

Important columns:

- `slug`
- `title_zh`
- `meta_description_zh`
- `section`
- `priority`
- `status`
- `last_reviewed_on`
- `official_sources_json`

Indexes:

- `idx_guide_pages_section_priority`
- `idx_guide_pages_status`

### `correction_requests`

Correction, canonicalization, display error, and privacy request workflow.

Important columns:

- `public_id`
- `page_url`
- `employer_id`
- `request_type`
- `submitter_email`
- `description`
- `status`
- `reviewed_at`

Indexes:

- `idx_correction_requests_status`
- `idx_correction_requests_employer_id`

M24 local workflow:

- `/corrections` renders a correction request form with minimal fields: request type, optional page URL, optional employer/page title, optional official source URL, optional email, and description.
- `/corrections/request` is a local stub. It validates type/description/acknowledgement, redirects to `/corrections/received`, and does not write to the database or send email.
- `/corrections/received` is noindex and only shows a public stub ID; it does not echo submitted description, source URL, page URL, or email.
- Production persistence should use `correction_requests` after owner/legal review of retention, access control, email notification, and privacy handling.

## Local Fixture Mode

Fixture data lives in:

- `data/fixtures/local-fixtures.ts`

Typed helpers live in:

- `lib/db/types.ts`
- `lib/db/local-repository.ts`
- `lib/db/public-query-repository.ts`

Covered fixture query examples:

- employer search by canonical name and alias
- employer H-1B/PERM/USCIS summary
- prevailing wage lookup by SOC and location
- Visa Bulletin date lookup
- guide priority inventory
- indexable company candidate filtering

M11 public query API:

- validates public inputs before lookup
- returns typed success/error unions with Chinese messages
- provides wage distributions and related employer/job/location helpers
- uses per-instance in-memory caching for fixture reads

Details live in `docs/PUBLIC_QUERY_API.md`.

All fixture data is synthetic and exists only to validate schema shape and query behavior. It must not be published as real official data.

## Privacy Notes

- No foreign worker names are modeled for public display.
- Personal addresses are not modeled.
- Raw records can be stored as JSON for auditability, but public pages must avoid exposing unnecessary personal identifiers.
- Small employer + city + job combinations should be aggregated or cautiously displayed in later query/page milestones.
