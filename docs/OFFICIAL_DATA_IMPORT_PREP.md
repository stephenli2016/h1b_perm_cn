# Official Data Import Preparation

This document describes the production-data path before a dedicated Supabase
project is available. The goal is to prepare real official-source data and a
reviewable Postgres import package without committing large raw files or
secrets.

Latest local preparation run: 2026-05-17.

## Official Sources To Use First

- DOL OFLC Performance Data:
  `https://www.dol.gov/agencies/eta/foreign-labor/performance`
  - LCA disclosure data.
  - PERM disclosure data.
  - Prevailing Wage disclosure data.
- DOL FLAG wage downloads:
  `https://flag.dol.gov/wage-data/wage-data-downloads`
- USCIS H-1B Employer Data Hub:
  `https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub`
- Department of State Visa Bulletin:
  `https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html`
- USCIS Adjustment of Status filing charts:
  `https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin`

Do not use competitor databases, attorney-blog scraped datasets, Reddit/forum
tables, or paid third-party copies as data inputs.

## Current Reality

The app can now read from Postgres when `LOCAL_DATA_MODE=postgres`, but the owner
does not currently have a free Supabase project slot for a dedicated production
database. Until that changes, prepare data locally and keep Vercel in
`LOCAL_DATA_MODE=fixture` with `PRELAUNCH_NOINDEX=true`.

As of the latest local run, all 106 manifest sources have been downloaded from
official URLs into `data/raw/`. These raw files are intentionally gitignored.
The manifest now covers the seven highest-priority enrichment gaps requested
before Supabase import:

- USCIS H-1B Employer Data Hub official CSVs available from FY2020-FY2023, with
  FY2024/FY2025 documented as not yet available from the official archive.
- DOL PWD case disclosure files in a separate `pwd_case_records` table.
- DOL LCA Worksites and Appendix A supplemental files.
- Deeper PERM/PWD requirement fields from newer and older ETA-9089 layouts.
- Department of State Visa Bulletin history from 2024-07 through 2026-06.
- USCIS adjustment-of-status filing chart history from 2024-07 through 2026-06.
- BLS OEWS occupation and area metadata for official SOC/area labels.

## Local Preparation Commands

Validate the official-source manifest:

```bash
pnpm etl:validate
```

Download official raw files when network is available:

```bash
pnpm production:data:download
```

Raw official downloads go under `data/raw/`, which is gitignored.

Parse downloaded files in fixture mode for development:

```bash
pnpm etl:lca:fixtures
pnpm etl:perm:fixtures
pnpm etl:pwd:fixtures
pnpm etl:uscis:h1b:fixtures
pnpm etl:visa:bulletin:fixtures
pnpm etl:uscis:filing-chart:fixtures
pnpm etl:companies:fixtures
```

For production data, use the compressed production parse scripts:

```bash
pnpm production:data:parse:lca
pnpm production:data:parse:lca-worksites
pnpm production:data:parse:lca-appendix-a
pnpm production:data:parse:perm
pnpm production:data:parse:pwd
pnpm production:data:parse:pwd-cases
pnpm production:data:parse:bls-oews
pnpm production:data:parse:uscis
python3 -m etl.cli parse-visa-bulletin-manifest --manifest data/source_manifest.json --output data/normalized/visa_bulletin_dates.jsonl
python3 -m etl.cli parse-uscis-filing-chart-manifest --manifest data/source_manifest.json --output data/normalized/uscis_filing_charts.jsonl
pnpm production:data:companies
```

The production parse scripts write `.jsonl.gz` files for large source tables and
omit `raw_record_json` to keep local disk and database imports manageable. The
raw official files and SHA-256 ETL logs remain the audit trail.

Prepare a Postgres import package from normalized JSONL:

```bash
pnpm production:data:prepare
```

The command writes local generated files under:

```text
data/production/postgres_import/
```

Generated files include:

- `csv/*.csv` for the core Postgres tables.
- `load_order.sql` with `\copy` commands in dependency order.
- `production_import_report.md` with row counts and anomalies.

`data/production/*` is gitignored except `.gitkeep`.

## Import Package Tables

The generated CSV package covers:

- `locations`
- `source_files`
- `employers`
- `employer_aliases`
- `h1b_lca_records`
- `h1b_lca_worksite_records`
- `h1b_lca_appendix_a_records`
- `perm_records`
- `pwd_records`
- `pwd_case_records`
- `uscis_h1b_employer_records`
- `visa_bulletin_months`
- `visa_bulletin_dates`
- `bls_oews_occupations`
- `bls_oews_areas`
- `company_page_metrics`

Latest generated row counts:

| Table                        |      Rows |
| ---------------------------- | --------: |
| `locations`                  |   143,022 |
| `source_files`               |       106 |
| `employers`                  |   236,586 |
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

The package intentionally does not auto-run against production. Review the
report, then run `load_order.sql` only after a dedicated Supabase/Postgres
project exists and the schema migration has been applied.

`pwd_records` contains FLAG wage lookup rows from the official 2025-2026 wage
ZIP. DOL PWD case disclosure files are loaded separately into
`pwd_case_records` because wage lookup rows and PWD case determinations answer
different product questions.

## Data Quality Gates Before Public Launch

- Required official raw files are downloaded or explicitly documented as manual
  official exports.
- SHA-256 fingerprints are recorded in ETL run logs.
- Parser row counts are non-zero for LCA, PERM, PWD, Visa Bulletin, and company
  candidates.
- Canonical employer matching produces a bounded unmatched-row count.
- Low-sample company pages remain `noindex`.
- No worker names, personal addresses, emails, phone numbers, FEINs, or other
  unnecessary personal identifiers are exposed.
- `PRELAUNCH_NOINDEX` stays `true` until the M28 launch gate is rerun and
  approved.

## Known Manual Step

No manual export is required for the current local package. The manifest uses
official USCIS H-1B Employer Data Hub CSV URLs for FY2020-FY2023. The official
USCIS archive page reviewed on 2026-05-17 lists downloadable Employer Data Hub
CSV files through FY2023; FY2024/FY2025 are not added because no official annual
CSV file was available from that archive. When USCIS publishes new official
annual CSV files, add them to `data/source_manifest.json`, download them into
`data/raw/`, fingerprint them through the ETL log, and rerun the production
parse/import flow.

## Remaining Launch Blocker

The import package is ready locally, but it has not been loaded into Supabase
because there is still no dedicated production Supabase project/connection
string for this app. Public deployment should remain in fixture/noindex mode
until the database exists, schema migration is applied, CSVs are imported, and a
runtime smoke test passes with `LOCAL_DATA_MODE=postgres` or
`LOCAL_DATA_MODE=supabase`.
