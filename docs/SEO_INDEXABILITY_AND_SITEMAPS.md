# SEO Indexability and Sitemaps — M15-M19

Milestones: M15 — Company page quality scoring, noindex, and sitemap logic; M16 — Generate first 500 high-quality company pages; M17 — Expand toward 2,000 company pages and performance hardening; M18 — H-1B wage-level checker tool; M19 — EB priority date calculator

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

After M19, `/sitemaps/tools.xml` includes `/tools/h1b-wage-level-checker` and `/tools/eb2-eb3-china-priority-date-calculator` because both have real forms, fixture-backed official-source comparisons, worked examples, source notes, related internal links, and cautious Chinese explanations. The `/tools` directory itself remains `noindex-until-data` until it has enough standalone content.

Guides still return empty `<urlset>` shells until later content milestones make guide routes indexable.

After M19, `/sitemaps/visa-bulletin.xml` includes month-specific pages for fixture-backed Visa Bulletin months, such as `/visa-bulletin/2026/06`. The shell route `/visa-bulletin` remains noindex. Dynamic monthly pages are included only when data exists in the local official-source fixture.

M16 adds `selectCompanyPageRoutes(data)`, which selects the first indexable route pages from the same quality logic. M17 raises the default launch target to 2,000 route pages when data quality supports it. The same selector is used for company route static params, while `dynamicParams = true` keeps low-data company pages accessible on demand with `noindex`.

M17 also adds company sitemap pagination. When the selected company route set exceeds 500 URLs, `/sitemap.xml` points to chunked sitemap files such as `/sitemaps/company-pages/1.xml`, `/sitemaps/company-pages/2.xml`, and so on. The legacy `/sitemaps/company-pages.xml` remains valid for the default one-page fixture state.

## Validation Coverage

`tests/seo.test.ts` covers:

- Low-data fixture company noindex decisions.
- High-data fixture company route-specific indexability.
- Metadata robots and canonical URLs.
- Company sitemap inclusion/exclusion.
- The M18 wage-level checker and M19 priority-date calculator entering the tools sitemap while noindex-until-data route groups stay out.
- M19 fixture-backed monthly Visa Bulletin pages entering `/sitemaps/visa-bulletin.xml`.
- Sitemap XML rendering.

`tests/company-page-scale.test.ts` covers the M16/M17 generated fixture validation, 500-page and 2,000-page route pre-generation limits, sitemap pagination, duplicate-fingerprint check, low-data exclusion, page-size estimates, and selection performance budget.
