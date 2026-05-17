# Milestone M30 Report — Official Data Enrichment

## Status

Completed

## Built

- Added official-source manifest coverage for the seven requested data gaps:
  USCIS H-1B Employer Data Hub availability handling, DOL PWD case disclosure,
  DOL LCA Worksites/Appendix A, deeper PERM/PWD fields, 24 months of Visa
  Bulletin history, 24 months of USCIS filing chart history, and BLS OEWS
  occupation/area metadata.
- Added ETL parsers and fixture tests for LCA Worksites, LCA Appendix A, PWD case
  disclosure, and BLS OEWS metadata.
- Expanded PERM parsing with PWD case/wage/education/experience requirement
  fields.
- Expanded local and Postgres migrations plus production CSV import generation
  for:
  - `h1b_lca_worksite_records`
  - `h1b_lca_appendix_a_records`
  - `pwd_case_records`
  - `bls_oews_occupations`
  - `bls_oews_areas`
- Generated a local Postgres import package at
  `data/production/postgres_import/` with 106 official source rows and the
  enriched CSV tables.
- Updated docs for ETL, schema, PWD/PERM/Visa Bulletin mapping, and official
  data import preparation.

## Files changed

- `data/source_manifest.json`
- `data/migrations/0001_initial_schema.sql`
- `data/migrations/postgres/0001_initial_schema.sql`
- `etl/cli.py`
- `etl/manifest.py`
- `etl/production_import.py`
- `etl/parsers/bls_oews.py`
- `etl/parsers/oflc_lca_supplemental.py`
- `etl/parsers/oflc_perm.py`
- `etl/parsers/oflc_pwd_case.py`
- `lib/db/schema.ts`
- `scripts/launch-readiness.ts`
- `scripts/scheduled-data-update.ts`
- `scripts/validate-production-db.ts`
- `package.json`
- `tests/data-freshness.test.ts`
- `tests/etl/test_bls_oews_parser.py`
- `tests/etl/test_oflc_lca_supplemental_parser.py`
- `tests/etl/test_oflc_perm_parser.py`
- `tests/etl/test_oflc_pwd_case_parser.py`
- `tests/etl/test_production_import.py`
- `docs/ETL.md`
- `docs/ETL_PERM_MAPPING.md`
- `docs/ETL_PWD_MAPPING.md`
- `docs/ETL_VISA_BULLETIN_MAPPING.md`
- `docs/OFFICIAL_DATA_IMPORT_PREP.md`
- `docs/SCHEMA.md`

## Generated local data package

Generated files are intentionally gitignored and remain local:

- `data/raw/`: 4.2GB
- `data/normalized/`: 1.2GB
- `data/production/postgres_import/`: 4.0GB

Latest import package row counts:

| Table                        |      Rows |
| ---------------------------- | --------: |
| `locations`                  |   143,022 |
| `source_files`               |       106 |
| `employers`                  |   236,666 |
| `employer_aliases`           |   415,179 |
| `h1b_lca_records`            | 3,464,585 |
| `h1b_lca_worksite_records`   | 4,428,017 |
| `h1b_lca_appendix_a_records` |     2,824 |
| `perm_records`               |   650,761 |
| `pwd_records`                |   770,620 |
| `pwd_case_records`           | 1,187,535 |
| `uscis_h1b_employer_records` |   205,053 |
| `visa_bulletin_months`       |        24 |
| `visa_bulletin_dates`        |       144 |
| `bls_oews_occupations`       |     1,104 |
| `bls_oews_areas`             |       583 |
| `company_page_metrics`       |     2,000 |

Import package anomalies are bounded canonicalization misses:

- 387 H-1B LCA rows could not be matched to canonical employers.
- 68 PERM rows could not be matched to canonical employers.
- 12 USCIS H-1B rows could not be matched to canonical employers.

## Validation

- Command: `pnpm production:data:prepare`
  - Result: pass; generated the enriched Postgres import package.
- Command: `pnpm etl:validate`
  - Result: pass; 106 manifest sources validated.
- Command: `pnpm etl:test`
  - Result: pass; 58 Python ETL unittest tests passed.
- Command: `pnpm data:freshness`
  - Result: pass; 106 sources, 104/104 required fixtures present, no missing
    downloads.
- Command: `pnpm test`
  - Result: pass; 121 Vitest tests passed.
- Command: `pnpm format`
  - Result: pass.
- Command: `pnpm lint`
  - Result: pass.
- Command: `pnpm typecheck`
  - Result: pass.
- Command: `pnpm build`
  - Result: pass.
- Command: `pnpm db:production:validate`
  - Result: pass; new tables/indexes/RLS are covered.
- Command: `pnpm deploy:validate`
  - Result: pass.
- Command: `pnpm seo:audit`
  - Result: pass; 28 SEO/compliance route tests passed.
- Command: `pnpm launch:readiness`
  - Result: expected blocked; official source checks pass, but production DB
    import, legal approval, and deployment approval remain launch blockers.
- Command: `pnpm data:update:dry-run`
  - Result: pass.
- Command: `pytest`
  - Result: unavailable in this local environment (`command not found`); Python
    ETL tests were run through the project-supported `pnpm etl:test` unittest
    command.

## Screenshots / local URLs

- No UI changes in this milestone.
- Local generated import report:
  `data/production/postgres_import/production_import_report.md`

## Decisions made without owner input

- Kept `pwd_records` as the reusable FLAG wage lookup table and added
  `pwd_case_records` for DOL PWD determinations.
- Kept USCIS H-1B Employer Data Hub to official FY2020-FY2023 CSVs only. FY2024
  and FY2025 were not added because the official USCIS archive reviewed on
  2026-05-17 still lists downloadable Employer Data Hub CSVs through FY2023.
- Added `download.bls.gov` to official-source allowlists because BLS OEWS
  metadata is an official U.S. government source.
- Did not delete `data/raw/`; it remains the local audit trail for the generated
  import package.

## Known limitations

- The enriched package is local only and has not been imported into Supabase.
- USCIS FY2024/FY2025 H-1B Employer Data Hub annual CSVs are not included until
  USCIS publishes official downloadable files.
- Canonical employer matching still has a very small unmatched tail in LCA, PERM,
  and USCIS records.
- Disk space is now tighter: about 9.5GB remained after this run.

## Owner action needed

- None for local data preparation.
- For actual database connection/import: provide or authorize a dedicated
  Supabase/Postgres project and production-safe credentials (`DATABASE_URL` and
  server-only service role handling).
- Legal/compliance and deployment approval are still required before public
  indexing or production launch.

## Recommended next milestone

M31 — Load the generated official CSV package into a dedicated Supabase/Postgres
database, run runtime smoke tests with `LOCAL_DATA_MODE=postgres`, and then
prepare the Vercel environment switch without enabling public indexing yet.
