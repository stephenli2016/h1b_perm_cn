# Company Page Scale Selection — M16

Milestone: M16 — Generate first 500 high-quality company pages

## Purpose

M16 adds the launch-scale selection layer for the first 500 company route pages.

The production rule stays conservative: pages can be selected only from available repository data and only after M15 route-specific quality checks pass. The repository currently has local fixtures, not 500 production-quality official-data companies, so M16 uses generated scale fixtures only inside tests for local validation.

## Selection Logic

`lib/seo/company-page-selection.ts` exports:

- `INITIAL_COMPANY_PAGE_TARGET` — 500 route pages.
- `selectCompanyPageRoutes(data)` — returns the first 500 indexable H-1B/PERM route candidates.
- `listCompanyStaticSlugs(data, mode)` — returns mode-specific slugs for route pre-generation.
- `profileCompanyPageSelection(data)` — measures selection count, route mix, duplicate fingerprints, elapsed time, and budget status.
- `inferCompanyDataSourceKind(data)` — labels data as `official_or_imported`, `fixture`, `generated_fixture`, or `empty`.

Candidates are sorted by quality score, route-specific record count, job/location diversity, latest fiscal year, employer name, and mode. The selector produces route pages, not generic employer rows, because `/h1b/company/[slug]` and `/perm/company/[slug]` have different indexability thresholds.

## Route Generation Strategy

Company pages use:

- `generateStaticParams()` for selected slugs only.
- `dynamicParams = true` so valid low-data pages can still render on demand and remain `noindex`.
- `/sitemaps/company-pages.xml` uses the same selected route candidates and is capped at 500 pages for M16.

This keeps build size bounded while preserving internal access to low-data company pages for QA and future search flows.

## Local 500-Page Validation

`tests/fixtures/m16-scale-fixtures.ts` generates 500 synthetic local-validation employers with:

- 10 recent H-1B LCA records each.
- 2 PERM records each, intentionally below the PERM route threshold.
- Multiple job titles and worksite locations per employer.
- Generated source names clearly labeled as local validation fixtures.

These records are not production data and are not used by the default app repository. They exist only to verify that the selector, static slug generation, sitemap limiting, and performance profile can handle the first-500-page launch shape.

## Current Repository State

Current real/fixture data does not contain 500 qualifying companies:

- `data/normalized/company_page_candidates.jsonl` has 3 local generated candidates.
- The default app fixture has one indexable route: `/perm/company/brightline-health`.
- M16 therefore completes the scale infrastructure and local validation fallback, while production-scale official data ingestion remains a later prerequisite.

## Performance Budget

The local selection budget is 2,500 ms for selecting 500 route pages from generated fixture data.

`tests/company-page-scale.test.ts` verifies:

- 500 selected H-1B route pages.
- 500 unique route paths.
- 500 unique content fingerprints.
- Static pre-generation capped at 500 slugs.
- Company sitemap capped at 500 URLs.
- Selection profile stays within budget.
