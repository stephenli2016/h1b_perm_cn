# Milestone M17 Report — 2,000 Company Pages and Performance Hardening

## Status

Completed

## Built

- Expanded default company route selection from the M16 500-page launch set to a 2,000-route M17 target.
- Optimized `calculateCompanyPageMetrics` by grouping recent H-1B, PERM, and USCIS rows by employer instead of repeatedly scanning all records for every employer.
- Added company sitemap pagination support with 500-URL chunks under `/sitemaps/company-pages/[page].xml`.
- Kept `/sitemaps/company-pages.xml` valid for the default one-page fixture state.
- Added page-size guardrails by capping visible H-1B recent rows, PERM timeline rows, and job/location breakdown rows.
- Extended scale tests to cover 2,000 selected pages, sitemap pagination, low-data exclusion, duplicate-content fingerprints, and visible-row budget checks.
- Updated scale, sitemap, route, and public query docs for M17 behavior.

## Files changed

- `app/sitemaps/company-pages/[page]/route.ts`
- `docs/COMPANY_PAGE_SCALE_SELECTION.md`
- `docs/PUBLIC_QUERY_API.md`
- `docs/ROUTE_MAP.md`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `lib/db/local-repository.ts`
- `lib/db/public-query-repository.ts`
- `lib/seo/company-page-selection.ts`
- `lib/seo/sitemaps.ts`
- `tests/company-page-scale.test.ts`

## Validation

- Command: `pnpm test`
- Result: pass, 7 files / 49 tests.

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
- Result: pass, 21 static pages generated; company sitemap pagination route is dynamic and company pages keep selected static params with dynamic fallback.

- Command: `git diff --check`
- Result: pass.

- Command: secret scan with `rg --pcre2` for OpenAI/Supabase/database secret patterns
- Result: pass, no matches. `rg` returned exit code 1 because there were no findings.

## Screenshots / local URLs

- `http://localhost:3000/sitemap.xml` — HTTP 200; default fixture sitemap index still points to the single company sitemap because only one route is currently selected.
- `http://localhost:3000/sitemaps/company-pages.xml` — HTTP 200; includes only `http://localhost:3000/perm/company/brightline-health` in default fixture state.
- `http://localhost:3000/sitemaps/company-pages/1.xml` — HTTP 200; dynamic paginated sitemap route returns the same default first chunk.
- `http://localhost:3000/h1b/company/brightline-health` — HTTP 200; dynamic fallback still renders and remains `noindex, follow`.

The local dev server required sandbox escalation to bind port 3000 and was stopped after verification.

## Decisions made without owner input

- Kept generated 2,000-page data in tests only; no fake 2,000-page public dataset was added to the app defaults.
- Treated sitemap pagination as useful at 500-URL chunks for operational visibility, even though 2,000 URLs is below the XML sitemap protocol maximum.
- Kept `dynamicParams = true` so low-data company pages can render for QA/internal navigation while staying out of the sitemap and search index.
- Added visible-row caps instead of rendering unlimited company record tables on page templates.

## Known limitations

- Production-scale official data is still not connected; the default app still has one indexable fixture route.
- The 2,000-page acceptance is validated with generated local fixtures only, not production official data.
- No Supabase-backed production query path exists yet.
- Sitemap pagination is implemented for company pages only; tool/guide/visa bulletin expansion belongs to later milestones.

## Owner action needed

None.

## Recommended next milestone

M18 — H-1B wage-level checker tool
