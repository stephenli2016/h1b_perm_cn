# Milestone M31 Report — Production Aggregate Data Layer

## Status

Completed

## Built

- Added a production aggregate ETL pipeline that converts the large official CSV
  package into compact Supabase-ready aggregate tables and bounded recent sample
  tables.
- Added production schema tables, indexes, RLS enablement, TypeScript data
  types, schema validation, and ETL tests for the aggregate layer.
- Updated the Postgres runtime repository so company pages, company directory,
  H-1B summaries, PERM summaries, wage context, source notes, and related
  employers can read from aggregate tables instead of requiring full raw
  H-1B/PERM tables in Supabase.
- Applied live Supabase migrations and imported the aggregate package into
  project `h1b-perm-cn` (`hzipmrcqfwcnpithjtin`, `us-east-1`).
- Added four FK covering indexes after Supabase performance advisor flagged the
  new sample-table foreign keys.
- Kept browser-side Supabase table access closed: RLS is enabled and no public
  Data API policies were added.

## Files changed

- `data/migrations/0001_initial_schema.sql`
- `data/migrations/postgres/0001_initial_schema.sql`
- `docs/PRODUCTION_AGGREGATES_M31.md`
- `docs/milestone_reports/M31_production_aggregate_data_layer.md`
- `etl/production_aggregates.py`
- `lib/db/postgres-fixture-data.ts`
- `lib/db/public-query-repository.ts`
- `lib/db/schema.ts`
- `lib/db/types.ts`
- `package.json`
- `scripts/validate-production-db.ts`
- `tests/etl/test_production_aggregates.py`

## Validation

- Command: `pnpm production:data:aggregate`
- Result: pass; generated aggregate package under ignored
  `data/production/postgres_aggregates/`.

- Command: live Supabase migration `add_company_aggregate_tables`
- Result: pass.

- Command: live Supabase aggregate import via Session Pooler
- Result: pass; imported 13,620 yearly rows, 111,857 breakdown rows, 2,000 wage
  rows, 2,000 source rows, 16,000 H-1B samples, and 16,000 PERM samples.

- Command: live Supabase migration `add_company_sample_fk_indexes`
- Result: pass.

- Command: `pnpm db:runtime:smoke --require-postgres`
- Result: pass; Postgres runtime loaded 236,526 employers, 415,100 aliases,
  143,022 locations, 2,000 company metrics, 16,000 H-1B samples, 16,000 PERM
  samples, and visa bulletin data from Supabase.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm test`
- Result: pass; 20 test files and 122 tests.

- Command: `python3 -m unittest discover -s tests/etl -p 'test_*.py'`
- Result: pass; 64 ETL tests.

- Command: `pnpm db:production:validate`
- Result: pass.

- Command: `pnpm build`
- Result: pass; Next.js production build generated 84 static pages.

- Command: Supabase security advisor
- Result: expected INFO `rls_enabled_no_policy` notices because public Data API
  access is intentionally closed. Reference:
  https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

- Command: Supabase performance advisor
- Result: fixed the unindexed FK notices on the new sample tables. Remaining
  notices are `unused_index` INFO messages after the fresh import. Reference:
  https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

## Screenshots / local URLs

- Not applicable. This milestone is data/runtime infrastructure; no new visual
  screen was introduced.

## Decisions made without owner input

- Used compact aggregate tables instead of loading all raw H-1B/PERM/PWD case
  rows into Supabase Free, keeping the live database at about 348 MB.
- Truncated the live `uscis_h1b_employer_records` staging table after preserving
  USCIS signals in aggregate stats, so the project stays under the 500 MB free
  limit.
- Capped recent visible sample rows at 8 H-1B and 8 PERM rows per launch company.
- Kept `DATABASE_URL` server-side only; `NEXT_PUBLIC_SUPABASE_*` is not used for
  this production query path.

## Known limitations

- Full raw H-1B/PERM/PWD records are not loaded into Supabase Free.
- Recent sample tables are representative samples, not complete downloadable
  raw record tables.
- PERM samples with missing official SOC/title/location fields use neutral local
  placeholders so the sample table remains query-safe; aggregate counts are not
  changed by those placeholders.
- Production Vercel environment variables and deployment are not changed in this
  milestone.

## Owner action needed

- Add these Vercel environment variables when ready to preview/deploy:
  `LOCAL_DATA_MODE=postgres`, `DATABASE_POOL_MAX=1`, and server-side
  `DATABASE_URL` using Supabase Session Pooler.
- Approve any production deployment, domain/DNS change, and public indexing.
- Review legal/privacy/terms/correction copy before public launch.

## Recommended next milestone

M32 — Configure Vercel production environment variables and deploy a protected
preview against the Supabase aggregate database.
