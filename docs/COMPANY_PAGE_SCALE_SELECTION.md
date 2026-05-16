# Company Page Scale Selection — M16/M17

Milestones: M16 — Generate first 500 high-quality company pages; M17 — Expand toward 2,000 company pages and performance hardening

## Purpose

M16 adds the launch-scale selection layer for the first 500 company route pages. M17 expands the same selector to the full initial target range of up to 2,000 route pages when data quality supports it.

The production rule stays conservative: pages can be selected only from available repository data and only after M15 route-specific quality checks pass. The repository currently has local fixtures, not 500 production-quality official-data companies, so M16 uses generated scale fixtures only inside tests for local validation.

## Selection Logic

`lib/seo/company-page-selection.ts` exports:

- `INITIAL_COMPANY_PAGE_TARGET` — 500 route pages.
- `EXPANDED_COMPANY_PAGE_TARGET` — 2,000 route pages.
- `selectCompanyPageRoutes(data)` — returns the first 2,000 indexable H-1B/PERM route candidates by default.
- `listCompanyStaticSlugs(data, mode)` — returns mode-specific slugs for route pre-generation.
- `profileCompanyPageSelection(data)` — measures selection count, route mix, duplicate fingerprints, low-data selected routes, page-size estimates, elapsed time, and budget status.
- `inferCompanyDataSourceKind(data)` — labels data as `official_or_imported`, `fixture`, `generated_fixture`, or `empty`.

Candidates are sorted by quality score, route-specific record count, job/location diversity, latest fiscal year, employer name, and mode. The selector produces route pages, not generic employer rows, because `/h1b/company/[slug]` and `/perm/company/[slug]` have different indexability thresholds.

## Route Generation Strategy

Company pages use:

- `generateStaticParams()` for selected slugs only.
- `dynamicParams = true` so valid low-data pages can still render on demand and remain `noindex`.
- `/sitemaps/company-pages.xml` uses the same selected route candidates.
- M17 adds paginated sitemap chunks under `/sitemaps/company-pages/[page].xml` when selected company routes exceed the company sitemap page size.

This keeps build size bounded while preserving internal access to low-data company pages for QA and future search flows.

## Local Scale Validation

`tests/fixtures/m16-scale-fixtures.ts` generates synthetic local-validation employers with:

- 10 recent H-1B LCA records each.
- 2 PERM records each, intentionally below the PERM route threshold.
- Multiple job titles and worksite locations per employer.
- Generated source names clearly labeled as local validation fixtures.

These records are not production data and are not used by the default app repository. They exist only to verify that the selector, static slug generation, sitemap limiting, and performance profile can handle the 500–2,000-page launch shape.

## Current Repository State

Current real/fixture data does not contain 500 qualifying companies:

- `data/normalized/company_page_candidates.jsonl` has 3 local generated candidates.
- The default app fixture has one indexable route: `/perm/company/brightline-health`.
- M16/M17 therefore complete the scale infrastructure and local validation fallback, while production-scale official data ingestion remains a later prerequisite.

## Performance Budget

The local selection budget is 4,000 ms for selecting up to 2,000 route pages from generated fixture data.

M17 also adds a visible-row budget for company pages. Page payloads are kept bounded by limiting recent H-1B rows, PERM timeline rows, and job/location breakdown rows. The scale profile records `oversizedPageCount` and `maxEstimatedVisibleRows` so large employers do not silently create oversized HTML pages.

`tests/company-page-scale.test.ts` verifies:

- 500 selected H-1B route pages.
- 2,000 selected H-1B route pages.
- 500 unique route paths.
- Unique content fingerprints.
- Static pre-generation capped at the active launch target.
- Company sitemap capped at the active launch target.
- Company sitemap pagination in 500-URL chunks for 2,000 routes.
- Low-data generated companies are excluded from expanded selection.
- Estimated visible rows stay within the page-size budget.
- Selection profile stays within budget.
