# Milestone M11 Report — Public Query API + Repository Layer

## Status

Completed

## Built

- Added a typed public query facade in `lib/db/public-query-repository.ts`.
- Added safe query functions for employer search, employer lookup by slug, H-1B summaries, PERM summaries, H-1B wage distributions, related employer/job/location entities, and Visa Bulletin rows.
- Added discriminated `PublicQueryResult<T>` success/error shape with Chinese user-facing error messages.
- Added input validation for slugs, search limits, SOC codes, state codes, and Visa Bulletin month keys.
- Added per-repository in-memory caching with TTL, hit/miss stats, and cache reset support.
- Added tests for fixture happy paths, malformed slugs, empty data, not-found behavior, wage distribution, related entities, Visa Bulletin queries, and cache expiry.
- Documented the public query API and updated schema docs to reference the M11 layer.

## Files changed

- `docs/PUBLIC_QUERY_API.md`
- `docs/SCHEMA.md`
- `docs/milestone_reports/M11_public_query_api_repository_layer.md`
- `lib/db/public-query-repository.ts`
- `tests/public-query-repository.test.ts`

## Validation

- Command: `pnpm etl:test`
- Result: pass, 46 Python ETL tests.

- Command: `pnpm test`
- Result: pass, 5 Vitest files / 32 tests.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass on isolated rerun. A concurrent run with `pnpm build` briefly failed because `.next/types` was being regenerated during the build.

- Command: `pnpm format`
- Result: pass after `pnpm format:write`.

- Command: `pnpm build`
- Result: pass, Next.js production build completed.

- Command: `pnpm etl:validate`
- Result: pass, source manifest validated with 15 sources.

- Command: `git diff --check`
- Result: pass.

- Command: secret scan with `rg --pcre2`
- Result: pass, no local secrets detected.

## Screenshots / local URLs

- Not applicable; M11 was a query/repository milestone with no new public UI route.

## Decisions made without owner input

- Used an instance-level in-memory cache with a 5-minute default TTL for fixture reads.
- Used typed result unions instead of throwing for public input and not-found cases.
- Kept the query facade SQL-free for local mode, so there is no unsafe SQL interpolation surface in M11.
- Treated wage distribution as annualized H-1B LCA wage data and added a Chinese warning for fewer than 3 matching records.

## Known limitations

- The query facade still reads local fixture arrays; production Supabase/Postgres backing remains a later milestone.
- Cache is process-local and not shared across server instances.
- Related employer scoring is a simple internal-linking signal based on shared job title, SOC code, and location; it is not a recommendation.
- Company pages still need later UI and SEO milestones before indexable launch use.

## Owner action needed

None.

## Recommended next milestone

M12 — Design system and Chinese UI components.
