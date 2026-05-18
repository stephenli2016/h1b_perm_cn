# Milestone P3 Report — Trust And Fallback Polish

## Status

Completed locally. P3 changes are not committed yet.

## Built

- Made fallback states actionable instead of dead ends:
  - `DataTable` now supports an empty-state action
  - `ErrorState` now supports an action area
  - company, H-1B, and PERM search pages now link users back to cleared results or source coverage when no records match
- Added recovery paths to data loading/error states:
  - company directory errors link back to the company directory and correction flow
  - H-1B and PERM data errors link back to their data entry pages and source notes
  - wage-level and priority-date tool errors link to restart or related source pages
- Polished the 500 error page:
  - replaced the raw `Error digest` label with a user-facing `错误参考码`
  - added links to the data source page and correction flow
- Added regression coverage for empty-state actions, error-state actions, and the updated 500 recovery links.

## Files changed

- `app/companies/page.tsx`
- `app/error.tsx`
- `app/h1b/page.tsx`
- `app/perm/page.tsx`
- `app/tools/eb2-eb3-china-priority-date-calculator/page.tsx`
- `app/tools/h1b-wage-level-checker/page.tsx`
- `components/ui/data-table.tsx`
- `components/ui/feedback-state.tsx`
- `tests/technical-seo.test.tsx`
- `tests/ui-components.test.tsx`
- `docs/milestone_reports/P3_trust_fallback_polish.md`

## Validation

- Command: `pnpm format`
- Result: pass
- Command: `pnpm lint`
- Result: pass
- Command: `pnpm typecheck`
- Result: pass
- Command: `pnpm test`
- Result: pass, 21 files / 136 tests
- Command: `pnpm seo:audit`
- Result: pass, 4 files / 30 tests
- Command: `pnpm build`
- Result: pass, 79 static pages generated

## Screenshots / local URLs

- Browser-verified local fixture server at `http://localhost:3001`.
- Verified `/h1b?employer=definitely-no-company-p3`:
  - contains `没有找到 H-1B 记录`
  - contains `清除筛选，查看全部 H-1B 记录`
- Verified `/perm?employer=definitely-no-company-p3`:
  - contains `没有找到 PERM 记录`
  - contains `清除筛选，查看全部 PERM 记录`
- Verified `/tools/h1b-wage-level-checker?offeredWage=abc&wageYear=2025`:
  - contains `重新开始`
  - contains `查看数据来源`
- Verified `/not-a-real-p3-page`:
  - contains `页面未找到`
  - contains `可能发生了什么`
  - contains `回到公司目录`
  - contains `提交纠错`

## Decisions made without owner input

- Treated P3 as the trust, fallback, and recovery polish pass after P1 terminology cleanup and P2 company-page reading-flow work.
- Kept fallback actions as plain server-rendered links so they remain simple, accessible, and SEO-safe.
- Did not add site-wide search; the immediate gap was recovery from empty/error states, not discovery volume.

## Known limitations

- P3 is complete locally but not committed, pushed, or deployed.
- Browser verification used local fixture data for deterministic empty-result and 404 checks.
- Runtime production database errors still depend on Vercel/Supabase availability; this pass improves user recovery paths, not infrastructure reliability.

## Owner action needed

- Confirm whether P3 is accepted.

## Recommended next milestone

P4 — Continue the next priority bucket after owner confirmation.
