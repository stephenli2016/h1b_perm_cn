# Milestone M16 Report — Company Page Scale Selection

## Status

Completed

## Built

- Added first-500 route selection in `lib/seo/company-page-selection.ts`.
- Added route-specific static slug selection for `/h1b/company/[slug]` and `/perm/company/[slug]`.
- Changed company routes to pre-generate selected slugs only, with `dynamicParams = true` for low-data on-demand pages.
- Updated company sitemap generation to use the same selected route candidates and cap the launch set at 500 pages.
- Added generated 500-company local scale fixtures for tests only.
- Added M16 scale tests for 500 selected pages, unique paths, duplicate-content fingerprints, static slug caps, sitemap caps, and performance budget.
- Documented the M16 fallback and launch-scale selection strategy in `docs/COMPANY_PAGE_SCALE_SELECTION.md`.

## Files changed

- `app/h1b/company/[slug]/page.tsx`
- `app/perm/company/[slug]/page.tsx`
- `docs/COMPANY_PAGE_SCALE_SELECTION.md`
- `docs/COMPANY_PAGE_TEMPLATE.md`
- `docs/PUBLIC_QUERY_API.md`
- `docs/ROUTE_MAP.md`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `lib/db/public-query-repository.ts`
- `lib/seo/company-page-selection.ts`
- `lib/seo/sitemaps.ts`
- `tests/company-page-scale.test.ts`
- `tests/fixtures/m16-scale-fixtures.ts`

## Validation

- Command: `pnpm test`
- Result: pass, 7 files / 46 tests.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm etl:test`
- Result: pass, 46 Python ETL tests.

- Command: `pnpm etl:validate`
- Result: pass, source manifest version 1 with 15 sources.

- Command: `pnpm build`
- Result: pass, 21 static pages generated; company routes use selected static params with dynamic fallback.

- Command: `git diff --check`
- Result: pass.

- Command: secret scan with `rg --pcre2` for OpenAI/Supabase/database secret patterns
- Result: pass, no matches. `rg` returned exit code 1 because there were no findings.

## Screenshots / local URLs

- `http://localhost:3000/sitemap.xml` — HTTP 200; sitemap index lists all split sitemap files.
- `http://localhost:3000/sitemaps/company-pages.xml` — HTTP 200; default fixture sitemap still includes only `http://localhost:3000/perm/company/brightline-health`.
- `http://localhost:3000/perm/company/brightline-health` — HTTP 200; verified `index, follow` and canonical `/perm/company/brightline-health`.
- `http://localhost:3000/h1b/company/brightline-health` — HTTP 200; verified dynamic fallback still renders and remains `noindex, follow`.

The local dev server required sandbox escalation to bind port 3000 and was stopped after verification.

## Decisions made without owner input

- Did not generate 500 fake public pages in the default repository data, because AGENTS.md and the SEO policy require official-source data for public indexed pages.
- Treated the existing normalized outputs as insufficient for 500 production pages: current `data/normalized/company_page_candidates.jsonl` has 3 local candidates.
- Used generated fixtures only inside tests to validate 500-page selection, route pre-generation, sitemap limiting, and performance.
- Kept the M16 launch cap at 500 route pages, not 500 employers, because H-1B and PERM route pages have different indexability decisions.

## Known limitations

- Production-scale official data is not yet connected; the default app still has one indexable fixture route.
- The 500-page acceptance is validated with generated local fixtures only, not production official data.
- No Supabase-backed production query path exists yet.
- M16 does not add sitemap pagination; M17 owns expansion toward 2,000 pages and further performance hardening.

## Owner action needed

None.

## Recommended next milestone

M17 — Expand toward 2,000 company pages and performance hardening
