# Production Database Setup — M26

Milestone: M26 — Production database setup preparation

This project remains runnable in local fixture mode without Supabase. M26 adds
the production Postgres/Supabase schema and operating instructions, but does not
connect to a real Supabase project or require secrets.

## Files

- `data/migrations/postgres/0001_initial_schema.sql`
- `data/migrations/postgres/README.md`
- `scripts/validate-production-db.ts`
- `.env.example`

## Environment Variables

Required placeholders are already in `.env.example`:

```bash
LOCAL_DATA_MODE=fixture
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/visaradar_cn
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=replace-with-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key-server-only
```

Rules:

- Keep `LOCAL_DATA_MODE=fixture` for local work until a production repository
  layer is introduced.
- Store real production values only in the deployment platform or local
  uncommitted `.env.local`.
- Never add `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.
- Treat `SUPABASE_ANON_KEY` as publishable only when RLS policies and grants
  have been designed for a browser-facing use case.

## Supabase Migration Instructions

Official Supabase docs checked during M26:

- RLS and service role behavior:
  <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Data API grants plus RLS:
  <https://supabase.com/docs/guides/api/securing-your-api>
- Service role key frontend warning:
  <https://supabase.com/docs/guides/database/secure-data>
- CLI `db push` behavior:
  <https://supabase.com/docs/reference/cli/global-flags>
- Backups and PITR:
  <https://supabase.com/docs/guides/platform/backups>
- Supabase changelog for current breaking-change/deprecation awareness:
  <https://supabase.com/changelog>

When the owner provides a Supabase project:

1. Confirm the project is a current supported Supabase Postgres version. Do not
   start a new production project on deprecated Postgres 14.
2. Install or update the Supabase CLI, then discover current syntax locally:

   ```bash
   supabase --help
   supabase db --help
   supabase db push --help
   ```

3. Link the local project to the Supabase project:

   ```bash
   supabase link --project-ref <project-ref>
   ```

4. Create a real Supabase migration file with the CLI:

   ```bash
   supabase migration new initial_visaradar_schema
   ```

5. Copy the SQL from
   `data/migrations/postgres/0001_initial_schema.sql` into the generated
   `supabase/migrations/<timestamp>_initial_visaradar_schema.sql` file.
6. Dry run, then apply:

   ```bash
   supabase db push --dry-run
   supabase db push
   ```

Alternative for a first manual project setup: paste
`data/migrations/postgres/0001_initial_schema.sql` into the Supabase SQL Editor,
run it once, then record the exact SQL in the repo before any later production
changes.

## RLS And Data API Guidance

M26 intentionally keeps the direct browser Data API closed:

- Every table in `public` has RLS enabled.
- The migration revokes table access from `anon` and `authenticated` when those
  roles exist.
- No `anon` or `authenticated` policies are created yet.
- `service_role` receives server-side table privileges only when that role
  exists.

Production pages should query the database from server-side code using
`DATABASE_URL` or a server-only Supabase service role key. If a later milestone
introduces browser-side Supabase reads, add narrow grants and table-specific RLS
policies in the same migration.

If views are added later, use `security_invoker = true` on Postgres 15+ or keep
views in an unexposed schema/revoke public access. Avoid `security definer`
functions in exposed schemas.

## Seed And Import Plan

Local fixture seed remains the default:

```bash
pnpm etl:fixtures
pnpm etl:lca:fixtures
pnpm etl:perm:fixtures
pnpm etl:pwd:fixtures
pnpm etl:uscis:h1b:fixtures
pnpm etl:visa:bulletin:fixtures
pnpm etl:uscis:filing-chart:fixtures
pnpm etl:companies:fixtures
```

Production import should use official downloaded source files only:

1. Refresh `data/source_manifest.json` with official source URLs and latest data
   dates.
2. Download official source files into private production storage.
3. Run the existing parsers to produce normalized JSONL outputs.
4. Load dimension tables first:
   `locations`, `employers`, `employer_aliases`, `source_files`.
5. Load fact/source tables:
   `h1b_lca_records`, `perm_records`, `pwd_records`,
   `uscis_h1b_employer_records`, `visa_bulletin_months`,
   `visa_bulletin_dates`.
6. Load derived/public content tables:
   `company_page_metrics`, `guide_pages`.
7. Record each run in `etl_runs` with counts, source file IDs, and error
   summaries.

The first production import milestone should add a dedicated loader or staging
SQL. Do not bulk-load raw files directly into public pages without the privacy,
quality, and indexability checks already documented in this repo.

## Backup And Export Strategy

Before production import:

- Confirm Supabase Dashboard backups are enabled for the selected plan.
- For launch data, keep an off-platform logical export using `supabase db dump`
  or `pg_dump`.
- Store source manifests, ETL run logs, and checksums alongside database dumps
  so the data can be rebuilt from official files.
- Use PITR for production once the site has meaningful traffic or paid plan
  support; document restore windows and expected downtime.
- Run a restore drill into a disposable project before the first public launch.

## Validation

Run:

```bash
pnpm db:validate
pnpm db:production:validate
pnpm test
```

`pnpm db:validate` verifies local SQLite fixture migrations. `pnpm
db:production:validate` checks the production SQL file for required tables,
indexes, RLS coverage, placeholder env vars, and obvious public-access mistakes.

## Owner Action Needed Later

No owner action is needed for M26. For a later production import/deployment
milestone, the owner must provide:

- Supabase project URL.
- Supabase anon/publishable key.
- Supabase service role key or direct Postgres connection string, stored only as
  server-side secrets.
