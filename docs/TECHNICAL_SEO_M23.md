# Technical SEO Hardening — M23

Milestone: M23 — Technical SEO hardening

## Purpose

M23 centralizes crawlability, canonical, structured-data, robots, sitemap, and error-page rules so new route families can be added without hand-copying SEO behavior.

## Shared Metadata

Metadata helpers live in `lib/seo/metadata.ts`.

- `buildSeoMetadata()` emits title, description, canonical path, `robots`, OpenGraph, and Twitter metadata.
- `buildRouteSeoMetadata()` uses `lib/site.ts` route definitions for static public routes.
- `hasSubmittedSearchParams()` detects query-result URLs that should not create indexable variants.

Rules:

- Base tool and content pages can be indexable when they have useful visible content.
- Directory/filter URLs stay `noindex, follow` until production data quality is high enough.
- Interactive tool query-result URLs are `noindex, follow` and canonicalize back to the base tool page.
- Canonical paths drop query strings and fragments.

## Structured Data

JSON-LD helpers live in `lib/seo/json-ld.ts`, with rendering through `components/seo/json-ld-script.tsx`.

Allowed M23 types:

- `BreadcrumbList` from visible breadcrumb navigation.
- `WebSite` on the homepage.
- `WebPage`, `CollectionPage`, or `AboutPage` for visible public pages.
- `Article` for guide-like content pages.
- `WebApplication` for tool pages.
- `Dataset` for visible official-data table pages.
- `FAQPage` only where the FAQ text is visible on the page.

The implementation intentionally avoids `JobPosting`, fake reviews, ratings, or hidden content markup.

## Robots and Sitemaps

`app/robots.ts` emits an allow-all public crawl policy plus the sitemap index URL. It does not block filter URLs in `robots.txt`, because `noindex` must be crawlable to be seen.

Sitemap behavior remains split by page type:

- `/sitemap.xml`
- `/sitemaps/core.xml`
- `/sitemaps/company-pages.xml`
- `/sitemaps/company-pages/[page].xml`
- `/sitemaps/tools.xml`
- `/sitemaps/guides.xml`
- `/sitemaps/visa-bulletin.xml`

Sitemaps must not include query URLs or known noindex static routes.

## Internal Link Graph Checks

`lib/seo/internal-link-graph.ts` builds a conservative known-path graph from:

- `lib/site.ts` public routes and sample dynamic paths.
- M22 content registry paths and related links.
- XML sitemap entries.
- Sitemap index entries.

`tests/technical-seo.test.tsx` fails if:

- A registered internal related link points to an unknown local path.
- Any sitemap URL contains search parameters.
- A static noindex route appears in a sitemap.

## Error Pages

M23 adds:

- `app/not-found.tsx` with noindex metadata and useful recovery links.
- `app/error.tsx` with a calm 500 experience, retry button, and homepage fallback.

## Validation Coverage

`tests/technical-seo.test.tsx` covers:

- Shared metadata output.
- Query-result noindex behavior for interactive tools.
- Directory filter noindex behavior.
- Visible breadcrumb JSON-LD.
- `Article` and `WebApplication` schema on content pages.
- Internal link graph integrity.
- Robots config.
- 404 and 500 rendering.

M23 also updates `vitest.config.ts` so `.tsx` tests are included in `pnpm test`.
