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

As of the latest local run, all 15 manifest sources have been downloaded from
official `.gov` URLs into `data/raw/`. These raw files are intentionally
gitignored.

## Local Preparation Commands

Validate the official-source manifest:

```bash
pnpm etl:validate
```

Download official raw files when network is available:

```bash
python3 -m etl.cli download \
  --manifest data/source_manifest.json \
  --log data/etl_runs/official_download.jsonl \
  --timeout-seconds 120
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

For production data, call the underlying ETL commands without `--fixtures-only`:

```bash
python3 -m etl.cli parse-lca-manifest --manifest data/source_manifest.json --output data/normalized/h1b_lca_records.jsonl
python3 -m etl.cli parse-perm-manifest --manifest data/source_manifest.json --output data/normalized/perm_records.jsonl
python3 -m etl.cli parse-pwd-manifest --manifest data/source_manifest.json --output data/normalized/pwd_records.jsonl
python3 -m etl.cli parse-uscis-h1b-manifest --manifest data/source_manifest.json --output data/normalized/uscis_h1b_employer_records.jsonl
python3 -m etl.cli parse-visa-bulletin-manifest --manifest data/source_manifest.json --output data/normalized/visa_bulletin_dates.jsonl
python3 -m etl.cli parse-uscis-filing-chart-manifest --manifest data/source_manifest.json --output data/normalized/uscis_filing_charts.jsonl
python3 -m etl.cli build-company-candidates --lca data/normalized/h1b_lca_records.jsonl --perm data/normalized/perm_records.jsonl --uscis-h1b data/normalized/uscis_h1b_employer_records.jsonl --manual-aliases data/manual/employer_alias_seeds.json --employers-output data/normalized/employers.jsonl --aliases-output data/normalized/employer_aliases.jsonl --output data/normalized/company_page_candidates.jsonl --recent-years 5 --limit 2000
```

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
- `perm_records`
- `pwd_records`
- `uscis_h1b_employer_records`
- `visa_bulletin_months`
- `visa_bulletin_dates`
- `company_page_metrics`

Latest generated row counts:

| Table                        |    Rows |
| ---------------------------- | ------: |
| `locations`                  |  21,601 |
| `source_files`               |      15 |
| `employers`                  |  68,663 |
| `employer_aliases`           |  97,719 |
| `h1b_lca_records`            | 328,886 |
| `perm_records`               |  82,288 |
| `pwd_records`                | 770,620 |
| `uscis_h1b_employer_records` |  33,156 |
| `visa_bulletin_months`       |       3 |
| `visa_bulletin_dates`        |      18 |
| `company_page_metrics`       |   2,000 |

The package intentionally does not auto-run against production. Review the
report, then run `load_order.sql` only after a dedicated Supabase/Postgres
project exists and the schema migration has been applied.

`pwd_records` currently contains FLAG wage lookup rows from the official
2025-2026 wage ZIP. The DOL PWD case disclosure Excel is downloaded and
fingerprinted as an official source file, but it is not loaded into
`pwd_records` because that table is a wage lookup table, not a PWD case table.

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
the official USCIS FY2023 H-1B Employer Data Hub CSV URL. If USCIS changes the
archive structure later and a stable direct CSV URL is unavailable, use the
official USCIS export flow, store the result under `data/raw/`, fingerprint it,
and document the export date in the production import report.

## Remaining Launch Blocker

The import package is ready locally, but it has not been loaded into Supabase
because there is still no dedicated production Supabase project/connection
string for this app. Public deployment should remain in fixture/noindex mode
until the database exists, schema migration is applied, CSVs are imported, and a
runtime smoke test passes with `LOCAL_DATA_MODE=postgres` or
`LOCAL_DATA_MODE=supabase`.
