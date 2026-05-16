# Milestone M19 Report — EB Priority Date Calculator

## Status

Completed

## Built

- Implemented `/tools/eb2-eb3-china-priority-date-calculator` with category, China mainland-born chargeability, priority date, chart type, and Visa Bulletin month inputs.
- Added fixture-backed priority-date comparison in the public query repository, including date, `C`, and `U` handling.
- Added USCIS filing chart notes so Dates for Filing is not treated as automatically usable for I-485.
- Added indexable monthly Visa Bulletin pages at `/visa-bulletin/[year]/[month]` for fixture-backed months.
- Added month-specific Visa Bulletin sitemap entries and route-map metadata.
- Added documentation for the calculator, public query method, route behavior, and SEO/sitemap behavior.

## Files changed

- `app/tools/eb2-eb3-china-priority-date-calculator/page.tsx`
- `app/tools/page.tsx`
- `app/visa-bulletin/[year]/[month]/page.tsx`
- `app/visa-bulletin/page.tsx`
- `lib/db/public-query-repository.ts`
- `lib/priority-date-tool.ts`
- `lib/seo/sitemaps.ts`
- `lib/site.ts`
- `tests/public-query-repository.test.ts`
- `tests/seo.test.ts`
- `tests/site-routes.test.ts`
- `docs/EB_PRIORITY_DATE_CALCULATOR.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/PUBLIC_QUERY_API.md`
- `docs/ROUTE_MAP.md`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `docs/milestone_reports/M19_eb_priority_date_calculator.md`

## Validation

- Command: `pnpm lint`
- Result: pass

- Command: `pnpm typecheck`
- Result: pass

- Command: `pnpm test`
- Result: pass, 7 test files and 57 tests

- Command: `pnpm etl:test`
- Result: pass, 46 ETL tests

- Command: `pnpm etl:validate`
- Result: pass, 15 source manifest entries

- Command: `pnpm format`
- Result: pass after running `pnpm format:write`

- Command: `pnpm build`
- Result: pass; generated `/visa-bulletin/2026/06`, `/visa-bulletin/2026/05`, and `/visa-bulletin/2026/04`

- Command: `git diff --check`
- Result: pass

- Command: secret scan with `rg`
- Result: no secrets found; matches were `.env.example` placeholders and documentation text

## Screenshots / local URLs

- Browser-verified `http://localhost:3000/tools/eb2-eb3-china-priority-date-calculator`
- Browser-verified a not-current query URL for EB-3 equal to the June 2026 Final Action cutoff
- Browser-verified `http://localhost:3000/visa-bulletin/2026/06`
- Browser-verified `http://localhost:3000/sitemaps/tools.xml`
- Browser-verified `http://localhost:3000/sitemaps/visa-bulletin.xml`
- Browser checks found expected text, no horizontal overflow at the tested viewport, and no console errors.

## Decisions made without owner input

- Defaulted the worked example to EB-2, China mainland-born, priority date `2021-08-31`, Final Action Dates, latest fixture month `2026-06`.
- Kept `/visa-bulletin` as a noindex shell while adding indexable monthly pages only for fixture-backed months.
- Named the tool route `/tools/eb2-eb3-china-priority-date-calculator` to match the milestone and keep URL slugs English.

## Known limitations

- Local fixture data currently covers only April, May, and June 2026 Visa Bulletin rows.
- The calculator currently supports only China mainland-born chargeability in the MVP fixture.
- Production launch still needs an official data refresh workflow before relying on current-month public data.
- The tool does not and must not determine filing eligibility, approval odds, or legal strategy.

## Owner action needed

None

## Recommended next milestone

M20 — Company immigration signal score
