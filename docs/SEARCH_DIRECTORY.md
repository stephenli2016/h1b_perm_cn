# Search and Directory Pages — M13

Milestone: M13 — Search and directory pages

## Scope

M13 adds local fixture-backed directory search for:

- `/h1b` — H-1B LCA record search.
- `/perm` — PERM record search.
- `/companies` — combined company directory from H-1B LCA and PERM records.

These pages reuse the public query repository so future production database queries can replace fixture reads without changing the page contract.

## Supported URL Filters

All directory pages accept GET query parameters:

- `employer` — employer display/canonical-name search.
- `fiscalYear` — four-digit fiscal year.
- `state` — two-letter U.S. state code.
- `city` — worksite city text search.
- `jobOrSoc` — job title, SOC title, or SOC code search.
- `caseStatus` — dataset-supported case status.
- `page` — positive integer pagination page.

Pagination currently uses a small fixture-friendly page size so local validation shows multiple pages with limited data.

## SEO Policy

All M13 directory and filtered URLs return `noindex, follow`.

Reasons:

- The current data source is local fixture data.
- Filter combinations can create many low-value URL permutations.
- Future milestones will add quality scoring, sitemap rules, canonical logic, and production-data thresholds before any directory or company page becomes indexable.

## Data Interpretation

Each directory page includes a Chinese interpretation box and disclaimer:

- H-1B LCA records are labor condition application signals, not H-1B petition approvals.
- PERM certification is one immigration process step, not I-140/I-485 or green-card approval.
- Combined company counts are historical public-data signals, not employer promises or legal conclusions.

## Known Fixture Limits

- The local fixture includes only a few employers and records.
- Search behavior validates URL/filter logic, empty states, pagination, and copy boundaries.
- Production search will need SQL-backed pagination and larger official-source data imports.
