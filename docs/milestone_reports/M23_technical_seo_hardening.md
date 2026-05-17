# Milestone M23 Report — Technical SEO Hardening

## Status

Completed

## Built

- Added shared metadata helpers for title, description, canonical, robots, OpenGraph, and Twitter metadata.
- Added shared JSON-LD helpers and script rendering for visible `BreadcrumbList`, `WebSite`, `WebPage`, `CollectionPage`, `AboutPage`, `Article`, `WebApplication`, `Dataset`, and visible `FAQPage` content.
- Wired canonical paths and structured data into public route templates, company pages, tool pages, guide pages, and Visa Bulletin pages.
- Added query-result noindex behavior for interactive tools while keeping their base pages indexable.
- Added `robots.txt` with sitemap index pointer, without blocking noindex pages that need to be crawlable.
- Added 404 and 500 recovery experiences.
- Added internal-link graph checks for registered related links, sitemap query URLs, and noindex route exclusions.
- Updated Vitest config so `.tsx` component/content tests run in the default `pnpm test` command.
- Tightened a few M22 content strings after the newly included `.tsx` tests exposed short metadata and forbidden-phrase issues.

## Files changed

- `app/robots.ts`
- `app/not-found.tsx`
- `app/error.tsx`
- `app/layout.tsx`
- `app/page.tsx`
- `app/about/page.tsx`
- `app/companies/page.tsx`
- `app/corrections/page.tsx`
- `app/disclaimer/page.tsx`
- `app/privacy/page.tsx`
- `app/h1b/page.tsx`
- `app/h1b/company/[slug]/page.tsx`
- `app/perm/page.tsx`
- `app/perm/company/[slug]/page.tsx`
- `app/tools/page.tsx`
- `app/tools/[slug]/page.tsx`
- `app/tools/h1b-wage-level-checker/page.tsx`
- `app/tools/eb2-eb3-china-priority-date-calculator/page.tsx`
- `app/tools/company-immigration-score/page.tsx`
- `app/tools/h1b-transfer-risk-checklist/page.tsx`
- `app/tools/perm-restart-timeline-estimator/page.tsx`
- `app/guides/page.tsx`
- `app/guides/[slug]/page.tsx`
- `app/visa-bulletin/page.tsx`
- `app/visa-bulletin/[year]/[month]/page.tsx`
- `components/page-shell.tsx`
- `components/seo/json-ld-script.tsx`
- `components/company/company-profile.tsx`
- `components/content/content-article.tsx`
- `lib/seo/metadata.ts`
- `lib/seo/json-ld.ts`
- `lib/seo/internal-link-graph.ts`
- `lib/company-immigration-signals.ts`
- `lib/content/guide-pages.ts`
- `tests/technical-seo.test.tsx`
- `tests/company-immigration-signals.test.ts`
- `tests/ui-components.test.tsx`
- `vitest.config.ts`
- `docs/TECHNICAL_SEO_M23.md`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `docs/ROUTE_MAP.md`
- `docs/DESIGN_SYSTEM.md`

## Validation

- Command: `pnpm lint`
- Result: pass

- Command: `pnpm typecheck`
- Result: pass

- Command: `pnpm test`
- Result: pass — 12 test files, 88 tests

- Command: `pnpm etl:test`
- Result: pass — 46 ETL tests

- Command: `pnpm etl:validate`
- Result: pass — 15 manifest sources

- Command: `pnpm build`
- Result: pass — 75 app routes generated, including `/robots.txt`

- Command: `pnpm format`
- Result: pass

- Command: `git diff --check`
- Result: pass

- Command: secret scan with `rg --pcre2`
- Result: pass — no matches

## Screenshots / local URLs

- Local browser QA used `http://127.0.0.1:3000`.
- Verified `/guides/what-is-lca-chinese`: `index, follow`, canonical, OpenGraph/Twitter, `BreadcrumbList`, `Article`, no horizontal overflow.
- Verified `/tools/h1b-wage-level-checker?soc=15-1252&city=Seattle&state=WA&offeredWage=120000`: `noindex, follow`, canonical to `/tools/h1b-wage-level-checker`, `BreadcrumbList`, `WebApplication`, no horizontal overflow.
- Verified `/tools`: `index, follow`, canonical, `BreadcrumbList`, `CollectionPage`.
- Verified unknown route renders the 404 recovery page with `noindex`.
- Verified `/robots.txt`, `/sitemap.xml`, and `/sitemaps/tools.xml`; tool sitemap contains no query URLs.
- Captured a desktop screenshot of `/guides/what-is-lca-chinese` during QA.

## Decisions made without owner input

- Used shared TypeScript helpers instead of per-page SEO constants to reduce route drift.
- Kept `robots.txt` permissive and relied on page-level `noindex` for filter/query pages, matching Google guidance that noindex must be crawlable.
- Used only structured data that directly reflects visible page content.
- Treated interactive tool query results as noindex URL variants, while leaving base tool pages indexable.
- Added `.tsx` tests to default Vitest coverage because existing rendered page tests were not being executed by `pnpm test`.

## Known limitations

- Structured data is intentionally conservative and does not try to maximize rich-result features.
- Social images are not custom yet; OpenGraph/Twitter metadata is text-only for now.
- Error page metadata is limited by Next.js client error route constraints, but the 404 page has explicit noindex metadata.
- Production Search Console submission, domain-level verification, and URL inspection still require owner/platform actions in later milestones.

## Owner action needed

None.

## Recommended next milestone

M24 — Legal/compliance pages and correction workflow
