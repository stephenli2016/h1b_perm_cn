# ETL Framework — M04

Milestone: M04 — ETL framework and source manifest

## Scope

M04 creates the ETL foundation only. It does not parse full official disclosure files yet. The framework can:

- Load and validate `data/source_manifest.json`.
- Fingerprint raw source or fixture files with SHA-256.
- Download official public URLs when network access is available.
- Fall back to local fixtures when downloads fail or `--fixtures-only` is used.
- Append JSONL run status records under `data/etl_runs/`.

## Source Manifest

Primary manifest:

- `data/source_manifest.json`

Each source entry includes:

- `id`
- `source_name`
- `official_url`
- `fiscal_year`
- `quarter`
- `expected_file_type`
- `checksum_sha256`
- `downloaded_path`
- `fixture_path`
- `parser_name`
- `required`

Official checksums are currently `null` because the selected source pages did not publish file hashes in a consistent location. The ETL logs SHA-256 fingerprints for local fixtures and downloaded files so later parser runs can be audited.

## Local Fixture Mode

The default milestone validation uses synthetic fixtures in `data/fixtures/raw/`. These files are intentionally small and contain no real worker-level data.

Run:

```bash
pnpm etl:fixtures
```

This skips network access, fingerprints each fixture, and appends ETL status lines to `data/etl_runs/local.jsonl`.

## Commands

```bash
pnpm etl:validate
pnpm etl:fingerprint
pnpm etl:fixtures
pnpm etl:lca:fixtures
pnpm etl:perm:fixtures
pnpm etl:pwd:fixtures
pnpm etl:uscis:h1b:fixtures
pnpm etl:visa:bulletin:fixtures
pnpm etl:uscis:filing-chart:fixtures
pnpm etl:companies:fixtures
pnpm etl:test
pnpm production:data:download
pnpm production:data:parse:lca
pnpm production:data:parse:perm
pnpm production:data:parse:pwd
pnpm production:data:parse:uscis
pnpm production:data:companies
pnpm production:data:prepare
```

Use `python3 -m etl.cli download --manifest data/source_manifest.json --log data/etl_runs/download.jsonl` to attempt official downloads with fixture fallback.

M05 adds `parse-lca` and `parse-lca-manifest` for OFLC LCA/H-1B disclosure files. The fixture command writes normalized JSONL to `data/normalized/h1b_lca_records.jsonl`, which is ignored as generated local output.

M06 adds `parse-perm` and `parse-perm-manifest` for OFLC PERM disclosure files. The fixture command writes normalized JSONL to `data/normalized/perm_records.jsonl`, which is ignored as generated local output.

M07 adds `parse-pwd` and `parse-pwd-manifest` for OFLC Prevailing Wage fixtures and FLAG OFLC wage downloads. Production `pwd_records` are wage lookup rows from the FLAG wage ZIP; DOL PWD case disclosure files remain source-file audit inputs until a separate case-disclosure table is added. The fixture command writes normalized JSONL to `data/normalized/pwd_records.jsonl`, which is ignored as generated local output.

M08 adds `parse-uscis-h1b` and `parse-uscis-h1b-manifest` for USCIS H-1B Employer Data Hub CSV files and local HTML table fixtures. The fixture command writes normalized JSONL to `data/normalized/uscis_h1b_employer_records.jsonl`, which is ignored as generated local output.

M09 adds `parse-visa-bulletin`, `parse-visa-bulletin-manifest`, `parse-uscis-filing-chart`, and `parse-uscis-filing-chart-manifest` for Department of State Visa Bulletin pages and USCIS adjustment-of-status filing chart selections. Fixture commands write normalized JSONL to `data/normalized/visa_bulletin_dates.jsonl` and `data/normalized/uscis_filing_charts.jsonl`, both ignored as generated local output.

M10 adds `build-company-candidates` for deterministic employer canonicalization, auditable alias output, company quality scoring, and initial noindex/indexable data-readiness decisions. The fixture command writes `data/normalized/employers.jsonl`, `data/normalized/employer_aliases.jsonl`, and `data/normalized/company_page_candidates.jsonl`, all ignored as generated local output. Methodology lives in `docs/EMPLOYER_CANONICALIZATION.md`.

## M25 Data Freshness CLI

Run:

```bash
pnpm data:freshness
```

The command reads `data/source_manifest.json` and reports local official-source inventory health:

- manifest update date and age
- total and required source count
- required fixture coverage
- latest fiscal year represented in the manifest
- latest Visa Bulletin fixture month
- missing required fixture files

Local fixture mode does not require downloaded production files to exist. Missing downloaded files are reported as warnings, not failures, so development remains unblocked without network or production storage.

## M26 Production Database Preparation

Production schema preparation lives in:

- `data/migrations/postgres/0001_initial_schema.sql`
- `docs/PRODUCTION_DATABASE_M26.md`

Run:

```bash
pnpm db:production:validate
```

The first production import should still be built as a later milestone. The
recommended order is:

1. Refresh `data/source_manifest.json` with current official source files.
2. Run the existing parsers against official downloads or fixture mode.
3. Load dimensions first: `locations`, `employers`, `employer_aliases`, and
   `source_files`.
4. Load normalized source records: LCA, PERM, PWD, USCIS Employer Data Hub, and
   Visa Bulletin rows.
5. Load derived rows: `company_page_metrics` and `guide_pages`.
6. Record every production import in `etl_runs` with source IDs, counts, and
   errors.

No Supabase key is required for local fixture mode.

## Official Data Import Preparation

Production official-data preparation lives in
`docs/OFFICIAL_DATA_IMPORT_PREP.md`.

Run:

```bash
pnpm production:data:download
pnpm production:data:parse:lca
pnpm production:data:parse:perm
pnpm production:data:parse:pwd
pnpm production:data:parse:uscis
pnpm production:data:companies
pnpm production:data:prepare
```

The large production parsers write compressed normalized `.jsonl.gz` files and
omit full raw row JSON to keep local disk usage bounded. `production:data:prepare`
converts normalized ETL outputs into a local Postgres import package under
`data/production/postgres_import/`, including table CSV files, `load_order.sql`,
and a review report. The generated package is gitignored and must be reviewed
before any Supabase/Postgres import.

## M29 Scheduled Data Update Dry Run

Run:

```bash
pnpm data:update:dry-run
```

The M29 dry-run checks official-source freshness without importing production
data, committing generated files, or changing public indexing. It flags:

- DOL OFLC disclosure release coverage.
- Visa Bulletin monthly fixture coverage.
- USCIS filing chart monthly fixture coverage.
- missing production download files.
- disallowed source hosts.
- optional official URL probe warnings when `--network` is enabled.

The GitHub Actions workflow `.github/workflows/data-update-dry-run.yml` runs the
dry-run weekly and uploads a Markdown freshness report artifact. Details live in
`docs/SCHEDULED_DATA_UPDATE_M29.md`.
