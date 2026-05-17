# SEO Indexability and Sitemaps — M15-M23

Milestones: M15 — Company page quality scoring, noindex, and sitemap logic; M16 — Generate first 500 high-quality company pages; M17 — Expand toward 2,000 company pages and performance hardening; M18 — H-1B wage-level checker tool; M19 — EB priority date calculator; M20 — Company immigration public-data signal; M21 — H-1B transfer and PERM restart tools; M22 — 50 guide/tool content pages; M23 — Technical SEO hardening

## Purpose

M15 adds a conservative quality gate before programmatic company pages can be indexed.

The gate follows `docs/DATA_AND_SEO_POLICY.md`: pages should enter search only when they have enough official-data value, visible unique content, source dates, internal links, and cautious Chinese explanations.

## Company Quality Inputs

Company-page indexability is decided by `lib/seo/company-quality.ts`.

The helper accepts route-neutral company metrics:

- Recent 5-year H-1B LCA count.
- Recent 5-year PERM count.
- Recent 5-year USCIS Employer Data Hub row count.
- Job-title and worksite-location diversity.
- Professional SOC record count where available.
- Source count and latest data date.
- Visible table/detail availability.
- Related-link availability.
- Chinese explanation length.

The same score is reused by the directory and profile payloads, but indexability is route-specific:

- `/h1b/company/[slug]` requires at least 10 recent LCA records or 3 USCIS Employer Data Hub rows.
- `/perm/company/[slug]` requires at least 3 recent PERM records.
- Both routes also require visible tables, job/location detail, source dates, related links, and enough Chinese explanatory content.

## Robots Metadata

Company page metadata now uses `getCompanyPageSeo(metrics, mode)`:

- Indexable route pages emit `index, follow`.
- Low-data or low-quality route pages emit `noindex, follow`.
- Canonical URLs stay route-specific, for example `/perm/company/brightline-health`.

The public page copy continues to explain that LCA, PERM, and USCIS rows are official-data signals only, not approval odds, hiring promises, or legal conclusions.

M23 centralizes route metadata in `lib/seo/metadata.ts`:

- All public page types emit title, description, canonical, robots, OpenGraph, and Twitter metadata through shared helpers where practical.
- Query-result URLs for interactive tools are `noindex, follow` and canonicalize back to the base tool URL.
- Directory and filter URLs remain `noindex, follow` in local/fixture mode.
- Canonical paths drop query strings and fragments.

## Structured Data

M23 adds shared JSON-LD helpers in `lib/seo/json-ld.ts` and a renderer in `components/seo/json-ld-script.tsx`.

Allowed structured data is limited to visible content:

- `BreadcrumbList` only where breadcrumbs render on the page.
- `WebSite` for the homepage.
- `WebPage`, `CollectionPage`, or `AboutPage` for visible public pages.
- `Article` for guide-like content.
- `WebApplication` for tools.
- `Dataset` for visible official-data table pages.
- `FAQPage` only when the FAQ questions and answers are visible.

M23 intentionally avoids fake ratings, reviews, `JobPosting`, and hidden-content markup.

## Fixture Decisions

M15 keeps local fixtures intentionally small, but creates one high-data validation case:

- `brightline-health` has 3 recent PERM rows, enough visible table content, sources, and internal links. Its PERM company page is indexable.
- `brightline-health` does not have enough H-1B/LCA or USCIS H-1B data, so its H-1B company page remains noindex.
- `northstar-cloud` remains a low-data fixture and is noindex.

This lets tests prove both sides of the quality gate without pretending local fixtures are production data.

## Sitemap Splits

M15 adds XML sitemap route handlers:

- `/sitemap.xml` — sitemap index.
- `/sitemaps/core.xml` — core static pages and indexable compliance pages.
- `/sitemaps/company-pages.xml` — only indexable company routes.
- `/sitemaps/tools.xml` — indexable tool pages only.
- `/sitemaps/guides.xml` — indexable guide pages only.
- `/sitemaps/visa-bulletin.xml` — indexable visa bulletin pages only.

After M22, `/sitemaps/tools.xml` includes `/tools` plus all 12 tool pages from `docs/CONTENT_GUIDE_50_TOPICS.md`. Five routes are interactive pages from M18-M21; seven use the M22 shared content renderer.

After M22, `/sitemaps/guides.xml` includes `/guides` plus all 38 guide pages from `docs/CONTENT_GUIDE_50_TOPICS.md`. Each content page is backed by `lib/content/guide-pages.ts` and contains a unique title, meta description, official source context, checklist, worked example, common mistakes, related links, review date, and disclaimer.

After M19, `/sitemaps/visa-bulletin.xml` includes month-specific pages for fixture-backed Visa Bulletin months, such as `/visa-bulletin/2026/06`. The shell route `/visa-bulletin` remains noindex. Dynamic monthly pages are included only when data exists in the local official-source fixture.

M16 adds `selectCompanyPageRoutes(data)`, which selects the first indexable route pages from the same quality logic. M17 raises the default launch target to 2,000 route pages when data quality supports it. The same selector is used for company route static params, while `dynamicParams = true` keeps low-data company pages accessible on demand with `noindex`.

M17 also adds company sitemap pagination. When the selected company route set exceeds 500 URLs, `/sitemap.xml` points to chunked sitemap files such as `/sitemaps/company-pages/1.xml`, `/sitemaps/company-pages/2.xml`, and so on. The legacy `/sitemaps/company-pages.xml` remains valid for the default one-page fixture state.

M23 adds `app/robots.ts`, which allows crawling public pages and advertises the sitemap index. It does not disallow filter URLs in `robots.txt`, because page-level `noindex` must be crawlable to be seen by search engines.

M23 also adds `lib/seo/internal-link-graph.ts` to verify registered related links, sitemap URLs, and noindex exclusions.

## Validation Coverage

`tests/seo.test.ts` covers:

- Low-data fixture company noindex decisions.
- High-data fixture company route-specific indexability.
- Metadata robots and canonical URLs.
- Company sitemap inclusion/exclusion.
- The M18 wage-level checker and M19 priority-date calculator entering the tools sitemap while noindex-until-data route groups stay out.
- The M20 company immigration signal methodology page entering the tools sitemap.
- The M21 H-1B transfer and PERM restart pages entering the tools sitemap without collecting sensitive personal information.
- The M22 typed content registry publishing 12 tool pages, 38 guide pages, and directory pages into the tools and guides sitemaps.
- M19 fixture-backed monthly Visa Bulletin pages entering `/sitemaps/visa-bulletin.xml`.
- Sitemap XML rendering.

`tests/content-pages.test.tsx` covers M22-specific content quality checks: exact 50-page coverage, priority 1 coverage, source-backed non-thin content fields, forbidden-language guards, rendered source links, disclaimers, review dates, and representative dynamic route rendering.

`tests/technical-seo.test.tsx` covers M23 shared metadata, query-result noindex, visible JSON-LD, internal link graph integrity, robots config, and 404/500 rendering.

`vitest.config.ts` now includes both `.test.ts` and `.test.tsx` files so component and content rendering tests are part of the default `pnpm test` run.

`tests/company-page-scale.test.ts` covers the M16/M17 generated fixture validation, 500-page and 2,000-page route pre-generation limits, sitemap pagination, duplicate-fingerprint check, low-data exclusion, page-size estimates, and selection performance budget.
