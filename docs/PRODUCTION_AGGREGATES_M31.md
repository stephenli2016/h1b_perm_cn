# Production Aggregate Data Layer M31

## Purpose

Supabase Free has a 500 MB database limit, while the full official OFLC LCA,
PERM, PWD, and USCIS package is several GB. M31 makes the production site usable
inside the free-tier database by loading compact, page-ready aggregate tables and
bounded recent samples for the 2,000 launch company pages.

The raw official CSV package remains local and reproducible under ignored
production data directories. Public pages read aggregate counts and sample rows;
they do not require the full raw case tables to be loaded in Supabase.

## Aggregate Tables

- `company_yearly_immigration_stats`: per-employer, per-fiscal-year H-1B, PERM,
  and USCIS Employer Data Hub counts.
- `company_breakdown_stats`: capped job-title/SOC and location breakdown rows.
- `company_wage_stats`: annualized H-1B wage distribution for page context.
- `company_source_stats`: official source names and latest data dates used by
  each company page.
- `company_recent_h1b_samples`: up to 8 recent H-1B LCA sample rows per launch
  company.
- `company_recent_perm_samples`: up to 8 recent PERM sample rows per launch
  company.

## Generation

Run:

```bash
pnpm production:data:aggregate
```

The command reads:

- `data/production/postgres_import/csv/company_page_metrics.csv`
- official CSVs under `data/production/postgres_import/csv/`

It writes an ignored import package to:

- `data/production/postgres_aggregates/csv/`
- `data/production/postgres_aggregates/load_aggregates.sql`
- `data/production/postgres_aggregates/aggregate_manifest.json`

## Current Supabase Load

Project:

- Supabase project: `h1b-perm-cn`
- Project ref: `hzipmrcqfwcnpithjtin`
- Region: `us-east-1`

Imported aggregate row counts:

- `company_yearly_immigration_stats`: 13,620
- `company_breakdown_stats`: 111,857
- `company_wage_stats`: 2,000
- `company_source_stats`: 2,000
- `company_recent_h1b_samples`: 16,000
- `company_recent_perm_samples`: 16,000

Remote database size after import: about 348 MB.

To stay under the free-tier limit, `uscis_h1b_employer_records` is currently
empty in Supabase. USCIS signals are preserved in
`company_yearly_immigration_stats`; the raw USCIS CSV package remains local and
can be reloaded later after an upgrade or a dedicated analytics database is
available.

## Runtime Behavior

With `LOCAL_DATA_MODE=postgres`, the app now reads:

- full employer, alias, location, source, visa bulletin, and page-metric tables;
- compact company aggregate tables for H-1B/PERM/USCIS totals;
- bounded recent sample tables for visible recent-record examples.

The server-side database path should use Supabase Session Pooler:

```text
DATABASE_URL=<Supabase Session Pooler Postgres connection string>
DATABASE_POOL_MAX=1
LOCAL_DATA_MODE=postgres
```

For this project the pooler username format is `postgres.<project-ref>` and the
host is `aws-1-us-east-1.pooler.supabase.com`. Keep the database password only
in local/Vercel secret storage.

Do not expose `DATABASE_URL` to browser code. `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are not required for the current
server-side query mode.

## Supabase Advisor Notes

Security advisor currently reports `rls_enabled_no_policy` at INFO level. This
is intentional because M31 keeps browser-side Supabase Data API access closed and
serves data through server-side Postgres only.

Reference:
[RLS enabled no policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)

Performance advisor initially reported four unindexed foreign keys on the new
sample tables. M31 added covering indexes for those FKs. Remaining performance
advisor notes are `unused_index` INFO messages shortly after import; those
indexes are retained for planned query paths and future incremental loads.

Reference:
[Unused index](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)

## Known Limits

- Full raw H-1B/PERM/PWD case tables are not loaded into Supabase Free.
- Recent sample tables are intentionally capped and are not a complete record
  export.
- PERM sample rows with missing official SOC/title/location fields use local
  neutral placeholders to satisfy NOT NULL schema constraints; aggregate counts
  remain based on the official rows.
- Public launch still requires owner approval for Vercel environment variables,
  production deployment, DNS/domain changes, and legal copy review.
