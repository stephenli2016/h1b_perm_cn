# Milestone M20 Report — Company Immigration Signal Score

## Status

Completed

## Built

- Added company-level `公开数据友好度信号` to H-1B and PERM company pages.
- Implemented transparent signal scoring across six visible dimensions: recent LCA activity, PERM activity, repeat filing history, data consistency, job/location diversity, and wage context.
- Added low-sample detection and score capping for sparse public records.
- Added `/tools/company-immigration-score` methodology page with dimension table, fixture example, source notes, related links, and disclaimer.
- Added signal details to `getCompanyProfileBySlug` payload.
- Added route-map, sitemap, public query API, company template, design-system, and signal methodology documentation.

## Files changed

- `app/tools/company-immigration-score/page.tsx`
- `app/tools/page.tsx`
- `components/company/company-immigration-signal.tsx`
- `components/company/company-profile.tsx`
- `lib/company-immigration-signals.ts`
- `lib/db/public-query-repository.ts`
- `lib/site.ts`
- `tests/company-immigration-signals.test.ts`
- `tests/public-query-repository.test.ts`
- `tests/seo.test.ts`
- `tests/site-routes.test.ts`
- `tests/ui-components.test.tsx`
- `docs/COMPANY_IMMIGRATION_SIGNALS.md`
- `docs/COMPANY_PAGE_TEMPLATE.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/PUBLIC_QUERY_API.md`
- `docs/ROUTE_MAP.md`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `docs/milestone_reports/M20_company_immigration_signal_score.md`

## Validation

- Command: `pnpm lint`
- Result: pass

- Command: `pnpm typecheck`
- Result: pass

- Command: `pnpm test`
- Result: pass, 8 test files and 61 tests

- Command: `pnpm etl:test`
- Result: pass, 46 ETL tests

- Command: `pnpm etl:validate`
- Result: pass, 15 source manifest entries

- Command: `pnpm format`
- Result: pass after running `pnpm format:write`

- Command: `pnpm build`
- Result: pass; generated `/tools/company-immigration-score`

- Command: `git diff --check`
- Result: pass

- Command: secret scan with `rg`
- Result: no secrets found; matches were `.env.example` placeholders and documentation text

## Screenshots / local URLs

- Browser-verified `http://localhost:3000/tools/company-immigration-score`
- Browser-verified `http://localhost:3000/perm/company/brightline-health`
- Browser-verified `http://localhost:3000/h1b/company/cedar-fintech-labs`
- Browser-verified `http://localhost:3000/sitemaps/tools.xml`
- Browser checks found expected text, no misleading `成功率为` / guarantee claims, no horizontal overflow at the tested viewport, and no console errors.

## Decisions made without owner input

- Used the public label `公开数据友好度信号`.
- Implemented the methodology as `/tools/company-immigration-score` because it is already one of the 50 planned high-value tool pages.
- Used a low-sample threshold of fewer than 3 H-1B/PERM records, or fewer than 3 total related official records including USCIS Employer Hub rows, over the last five fiscal years.
- Based the five-year window on the latest official-data fiscal year present in the fixture, not the machine wall-clock year.

## Known limitations

- The current score uses local official-source fixtures only.
- The signal measures public-data coverage and explainability, not employer policy, legal eligibility, approval odds, or sponsor commitment.
- PWD wage-context matching is currently fixture-level and should be expanded after production wage data is connected.

## Owner action needed

None

## Recommended next milestone

M21 — H-1B transfer and PERM restart timeline estimator
