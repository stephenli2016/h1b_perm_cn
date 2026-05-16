# Milestone M03 Report — Database Schema and Local Data Model

## Status

Completed

## Built

- Chose the M03 data strategy:
  - production target: Supabase Postgres
  - local mode: SQLite-compatible fixture validation
  - query approach: direct SQL migrations plus typed TypeScript fixture query helpers
- Added initial migration at `data/migrations/0001_initial_schema.sql`.
- Added normalized schema for:
  - `employers`
  - `employer_aliases`
  - `locations`
  - `h1b_lca_records`
  - `perm_records`
  - `pwd_records`
  - `uscis_h1b_employer_records`
  - `visa_bulletin_months`
  - `visa_bulletin_dates`
  - `company_page_metrics`
  - `guide_pages`
  - `correction_requests`
  - `etl_runs`
  - `source_files`
- Added required indexes for employer slug, raw employer names, fiscal year, SOC code, city/state, job title, source record IDs, wage lookup, visa bulletin lookup, and indexable company metrics.
- Added local synthetic fixture data in `data/fixtures/local-fixtures.ts` covering H-1B/LCA, PERM, PWD, USCIS Employer Data Hub, Visa Bulletin, guide inventory, correction requests, source files, and ETL runs.
- Added typed data models in `lib/db/types.ts`.
- Added local fixture query helpers in `lib/db/local-repository.ts`:
  - employer-name normalization
  - employer search by canonical name and alias
  - employer H-1B/PERM/USCIS summary
  - prevailing wage lookup by SOC/location/year
  - Visa Bulletin cutoff lookup
  - priority guide listing
  - indexable company candidate listing
- Added schema constants in `lib/db/schema.ts` for migration files and required table/index validation.
- Added `docs/SCHEMA.md` documenting strategy, tables, indexes, fixture mode, interpretation boundaries, and privacy notes.
- Added `LOCAL_DATA_MODE=fixture` to `.env.example`.
- Added `pnpm db:validate` for DB-specific validation tests.

## Files changed

- `.env.example`
- `data/fixtures/local-fixtures.ts`
- `data/migrations/0001_initial_schema.sql`
- `docs/SCHEMA.md`
- `docs/milestone_reports/M03_database_schema_local_model.md`
- `lib/db/local-repository.ts`
- `lib/db/schema.ts`
- `lib/db/types.ts`
- `package.json`
- `tests/local-repository.test.ts`
- `tests/schema.test.ts`

## Validation

- Command: `pnpm format`
- Result: pass. All matched files use Prettier code style.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm db:validate`
- Result: pass. 2 DB-specific test files, 11 tests passed. This validates migration table/index creation and local fixture query behavior.

- Command: `pnpm test`
- Result: pass. 4 test files, 17 tests passed.

- Command: `pnpm build`
- Result: pass.

- Command: `rg --pcre2 "sk-proj-|sk-[A-Za-z0-9]{20,}|SUPABASE_SERVICE_ROLE_KEY=(?!replace)|SUPABASE_ANON_KEY=(?!replace)|DATABASE_URL=postgresql://[^\\n]*supabase" . --hidden -g '!node_modules' -g '!.next' -g '!.git'`
- Result: pass. No committed API keys or live Supabase/Postgres secrets found.

## Screenshots / local URLs

- Not applicable for M03; this milestone is data schema and local fixture model work.

## Decisions made without owner input

- Used SQLite-compatible SQL for local validation so M03 works without Supabase, Docker, or database credentials.
- Kept production target as Supabase Postgres per project defaults; production-specific migration instructions remain for later M26.
- Used synthetic fixture employers only. No competitor data, forum data, scraped data, or personal worker data was introduced.
- Kept all fixture company page metrics `indexable: false` because fixture data is not real launch data and does not meet official-data quality thresholds.
- Stored raw-record JSON columns as text in local mode for portability; production can map them to Postgres `jsonb` later.

## Known limitations

- Node's built-in `node:sqlite` API is experimental in the local Node runtime, so tests print an experimental warning even though they pass.
- The migration is SQLite-compatible for local validation; Supabase/Postgres-specific types, RLS, and deployment migrations are scheduled for later production database milestones.
- Fixture data is synthetic and exists only for local validation; it must not be presented as real official data.
- Query helpers are intentionally small and fixture-backed. The full public repository/query layer is scheduled for M11.

## Owner action needed

None.

## Recommended next milestone

M04 — ETL framework and source manifest.
