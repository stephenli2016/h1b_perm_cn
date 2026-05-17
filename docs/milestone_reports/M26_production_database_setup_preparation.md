# Milestone M26 Report — Production Database Setup Preparation

## Status

Completed

## Built

- Added a production Postgres/Supabase schema migration mirroring the local
  normalized model with Postgres-native `date`, `timestamptz`, `numeric`,
  `boolean`, and `jsonb` types.
- Enabled RLS on every public table and kept direct `anon`/`authenticated` Data
  API access closed by default.
- Added a production DB validation CLI and Vitest coverage for required tables,
  indexes, RLS coverage, env placeholders, and service-role exposure mistakes.
- Added Supabase setup, migration, RLS, seed/import, and backup/export
  instructions while preserving local fixture mode.
- Updated `.env.example` comments to clarify fixture mode and server-only
  `SUPABASE_SERVICE_ROLE_KEY` handling.

Supabase official docs checked:

- <https://supabase.com/docs/guides/database/postgres/row-level-security>
- <https://supabase.com/docs/guides/api/securing-your-api>
- <https://supabase.com/docs/guides/database/secure-data>
- <https://supabase.com/docs/reference/cli/global-flags>
- <https://supabase.com/docs/guides/platform/backups>
- <https://supabase.com/changelog>

## Files changed

- `.env.example`
- `data/migrations/postgres/0001_initial_schema.sql`
- `data/migrations/postgres/README.md`
- `docs/ETL.md`
- `docs/PRODUCTION_DATABASE_M26.md`
- `docs/SCHEMA.md`
- `docs/milestone_reports/M26_production_database_setup_preparation.md`
- `lib/db/schema.ts`
- `package.json`
- `scripts/validate-production-db.ts`
- `tests/production-db-setup.test.ts`

## Validation

- Command: `pnpm db:production:validate`
- Result: pass; all production table, index, RLS, env placeholder, and public
  access checks passed.

- Command: `pnpm test tests/production-db-setup.test.ts`
- Result: pass; 1 file / 6 tests.

- Command: `pnpm db:validate`
- Result: pass; 2 files / 18 tests.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm test`
- Result: pass; 16 files / 106 tests.

- Command: `pnpm etl:test`
- Result: pass; 46 Python ETL tests.

- Command: `pnpm etl:validate`
- Result: pass; 15 source manifest entries validated.

- Command: `pnpm build`
- Result: pass; Next.js production build generated 84 static pages.

- Command: `pnpm format`
- Result: pass after `pnpm format:write` formatted the two new TypeScript files.

- Command: `pnpm seo:audit`
- Result: pass; 4 SEO/compliance test files / 28 tests.

- Command: `pnpm data:freshness`
- Result: pass; 13/13 required fixtures present. Warning: 15 downloaded
  production files are absent in local fixture mode, which is expected before
  production import.

- Command: `git diff --check`
- Result: pass.

- Command: targeted local secret scan for OpenAI/Supabase/Postgres secret
  patterns.
- Result: pass; no committed secrets found.

## Screenshots / local URLs

- Not applicable. M26 is database setup and documentation only.

## Decisions made without owner input

- Kept deterministic text primary keys in production Postgres to align with
  current ETL and local fixture identifiers.
- Kept browser-side Supabase Data API closed in M26: no `anon` or
  `authenticated` table grants or policies yet.
- Granted `service_role` table access only conditionally when that Supabase role
  exists, keeping the migration usable in plain Postgres.
- Deferred live Supabase CLI migration creation until a real project is
  available.

## Known limitations

- The production SQL was statically validated but not applied to a live
  Supabase/Postgres instance because no project or credentials are available.
- Supabase advisors were not run for the same reason.
- Production import/loading code is not implemented yet; M26 documents the
  seed/import order and leaves the loader for a later milestone.

## Owner action needed

None for M26. A later production import/deployment milestone will need the
Supabase project URL plus server-side database/service-role credentials.

## Recommended next milestone

M27 — Vercel deployment preparation
