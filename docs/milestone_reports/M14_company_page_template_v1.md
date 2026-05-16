# Milestone M14 Report — Company page template v1

## Status

Completed

## Built

- Replaced placeholder `/h1b/company/[slug]` and `/perm/company/[slug]` pages with a shared Chinese company profile template.
- Added `getCompanyProfileBySlug` and `listCompanySlugs` to the public query repository.
- Added company page sections for employer summary, H-1B/LCA cards, PERM cards, wage distribution, job breakdown, worksite breakdown, PERM timeline, source notes, disclaimer, related links, FAQ, and JSON-LD.
- Expanded local fixtures from 3 to 5 employers:
  - `acme-analytics` — mixed H-1B/PERM/USCIS shape.
  - `northstar-cloud` — small mixed sample with denied PERM.
  - `lakeside-robotics` — denied H-1B LCA plus certified PERM.
  - `brightline-health` — PERM-only, no H-1B wage samples.
  - `cedar-fintech-labs` — H-1B-only with USCIS row, no PERM timeline.
- Added docs for the company page template and updated the public query API docs.

## Files changed

- `app/h1b/company/[slug]/page.tsx`
- `app/perm/company/[slug]/page.tsx`
- `components/company/company-profile.tsx`
- `data/fixtures/local-fixtures.ts`
- `docs/COMPANY_PAGE_TEMPLATE.md`
- `docs/PUBLIC_QUERY_API.md`
- `docs/milestone_reports/M14_company_page_template_v1.md`
- `lib/db/public-query-repository.ts`
- `tests/local-repository.test.ts`
- `tests/public-query-repository.test.ts`
- `tests/ui-components.test.tsx`

## Validation

- Command: `pnpm test`
- Result: pass, 5 test files / 38 tests. Node emitted the existing experimental SQLite warning only.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm etl:test`
- Result: pass, 46 ETL tests.

- Command: `pnpm etl:validate`
- Result: pass, manifest validates with 15 sources.

- Command: `pnpm build`
- Result: pass. Next.js generated 24 static pages, including 5 fixture company paths under both `/h1b/company/[slug]` and `/perm/company/[slug]`.

- Command: `git diff --check`
- Result: pass.

- Command: refined secret scan with `rg --pcre2`
- Result: pass, no plaintext secrets found. Local `.env.example` placeholder was excluded from the positive-secret pattern.

- Command: compliance phrase scan for misleading guarantee/approval-odds language
- Result: pass after review. Matches were existing negated compliance text such as “不会...保证”.

## Screenshots / local URLs

- Browser plugin was not available in this session, so local verification used Next dev server plus `curl`/`rg`.
- `http://localhost:3000/h1b/company/acme-analytics` — HTTP 200; verified employer summary, wage distribution, PERM timeline, FAQ JSON-LD, and `noindex, follow`.
- `http://localhost:3000/perm/company/brightline-health` — HTTP 200; verified PERM-only page, empty H-1B sections, empty wage state, PERM timeline, FAQ JSON-LD, and `noindex, follow`.
- `http://localhost:3000/h1b/company/cedar-fintech-labs` — HTTP 200; verified H-1B-only page, wage distribution, empty PERM section, FAQ JSON-LD, and `noindex, follow`.

## Decisions made without owner input

- Used one shared company template for both H-1B and PERM routes so future production data and UI changes stay consistent.
- Kept all company pages `noindex, follow` because M15 owns final indexability and sitemap decisions.
- Added two fixture companies locally instead of waiting for production data, so M14 acceptance could be validated without secrets or external downloads.
- Used visible `FAQPage` and `BreadcrumbList` JSON-LD only because those structured-data objects match visible page content.

## Known limitations

- Company pages still use local fixture data only.
- The wage distribution is based on H-1B LCA annualized wage fields, not a full prevailing wage comparison.
- Related companies/jobs/locations are lightweight fixture signals, not recommendations.
- XML sitemap and quality-score-driven robots behavior are intentionally deferred to M15.

## Owner action needed

None.

## Recommended next milestone

M15 — Company page quality scoring, noindex, and sitemap logic
