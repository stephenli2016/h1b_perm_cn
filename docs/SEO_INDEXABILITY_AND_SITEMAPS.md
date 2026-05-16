# SEO Indexability and Sitemaps — M15

Milestone: M15 — Company page quality scoring, noindex, and sitemap logic

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

Current tools, guides, and visa bulletin routes remain `noindex-until-data`, so their split sitemaps return empty `<urlset>` shells until later content/data milestones make them indexable.

## Validation Coverage

`tests/seo.test.ts` covers:

- Low-data fixture company noindex decisions.
- High-data fixture company route-specific indexability.
- Metadata robots and canonical URLs.
- Company sitemap inclusion/exclusion.
- Empty split sitemaps for noindex-until-data route groups.
- Sitemap XML rendering.
