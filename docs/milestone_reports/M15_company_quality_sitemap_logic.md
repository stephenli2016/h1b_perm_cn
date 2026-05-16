# Milestone M15 Report — Company Quality and Sitemap Logic

## Status

Completed

## Built

- Added `companyPageQualityScore`, route-specific `evaluateCompanyIndexability`, and `getCompanyPageSeo` helpers.
- Replaced the M14 blanket company-page noindex behavior with H-1B/PERM route-specific robots metadata.
- Added canonical-aware XML sitemap routes:
  - `/sitemap.xml`
  - `/sitemaps/core.xml`
  - `/sitemaps/company-pages.xml`
  - `/sitemaps/tools.xml`
  - `/sitemaps/guides.xml`
  - `/sitemaps/visa-bulletin.xml`
- Excluded noindex company pages from the company sitemap.
- Updated the Brightline fixture to provide one high-data PERM validation case.
- Added SEO tests for quality thresholds, metadata/canonical behavior, sitemap inclusion, and empty noindex-until-data sitemap groups.
- Documented the M15 quality gate and sitemap behavior in `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`.

## Files changed

- `app/h1b/company/[slug]/page.tsx`
- `app/perm/company/[slug]/page.tsx`
- `app/sitemap.xml/route.ts`
- `app/sitemaps/company-pages.xml/route.ts`
- `app/sitemaps/core.xml/route.ts`
- `app/sitemaps/guides.xml/route.ts`
- `app/sitemaps/tools.xml/route.ts`
- `app/sitemaps/visa-bulletin.xml/route.ts`
- `components/company/company-profile.tsx`
- `data/fixtures/local-fixtures.ts`
- `docs/COMPANY_PAGE_TEMPLATE.md`
- `docs/PUBLIC_QUERY_API.md`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `lib/db/local-repository.ts`
- `lib/db/public-query-repository.ts`
- `lib/seo/company-quality.ts`
- `lib/seo/sitemaps.ts`
- `tests/local-repository.test.ts`
- `tests/public-query-repository.test.ts`
- `tests/seo.test.ts`

## Validation

- Command: `pnpm test`
- Result: pass, 6 files / 43 tests.

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
- Result: pass, 30 static pages generated, company pages SSG, sitemap routes static.

- Command: `git diff --check`
- Result: pass.

- Command: secret scan with `rg --pcre2` for OpenAI/Supabase/database secret patterns
- Result: pass, no matches. `rg` returned exit code 1 because there were no findings.

## Screenshots / local URLs

- `http://localhost:3000/perm/company/brightline-health` — HTTP 200; verified `index, follow` and canonical `/perm/company/brightline-health`.
- `http://localhost:3000/h1b/company/brightline-health` — HTTP 200; verified `noindex, follow` and canonical `/h1b/company/brightline-health`.
- `http://localhost:3000/perm/company/northstar-cloud` — HTTP 200; verified low-data `noindex, follow`.
- `http://localhost:3000/sitemap.xml` — sitemap index lists all split sitemap files.
- `http://localhost:3000/sitemaps/core.xml` — includes core static pages and indexable compliance pages.
- `http://localhost:3000/sitemaps/company-pages.xml` — includes only `http://localhost:3000/perm/company/brightline-health`.
- `http://localhost:3000/sitemaps/tools.xml`, `/sitemaps/guides.xml`, and `/sitemaps/visa-bulletin.xml` — valid empty URL sets while those route groups remain `noindex-until-data`.

The local dev server required sandbox escalation to bind port 3000 and was stopped after verification.

## Decisions made without owner input

- Used conservative route-specific thresholds: H-1B pages require at least 10 recent LCA records or 3 USCIS Employer Data Hub rows; PERM pages require at least 3 recent PERM records.
- Kept tools, guides, and visa bulletin sitemap splits empty until later milestones add indexable data/content.
- Made `brightline-health` the local high-data PERM fixture so acceptance criteria can be tested without implying production-scale coverage.
- Kept directory/filter pages noindex; M15 only changes company route indexability and sitemap inclusion.

## Known limitations

- The quality gate is validated against local fixtures only.
- No production Supabase data is connected yet.
- Only one fixture route is currently indexable: `/perm/company/brightline-health`.
- Sitemaps use `NEXT_PUBLIC_SITE_URL` when provided and otherwise default to `http://localhost:3000`.

## Owner action needed

None.

## Recommended next milestone

M16 — Generate first 500 high-quality company pages
