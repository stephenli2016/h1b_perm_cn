# Milestone M09 Report — Visa Bulletin + USCIS Filing Chart Parser

## Status

Completed

## Built

- Added a Department of State Visa Bulletin parser for employment-based Final Action Dates and Dates for Filing.
- Added normalized fixture coverage for April, May, and June 2026 Visa Bulletin months.
- Added USCIS adjustment-of-status filing chart selection parsing with a manual fixture fallback.
- Added priority-date helper logic for China mainland-born EB-1, EB-2, and EB-3 comparisons.
- Updated `/visa-bulletin` to render the latest fixture month, category table, USCIS chart selection, source notes, and no-legal-advice warnings.
- Added ETL documentation for Visa Bulletin source mapping and USCIS chart-selection limitations.

## Files changed

- `app/visa-bulletin/page.tsx`
- `data/fixtures/local-fixtures.ts`
- `data/fixtures/raw/dos_visa_bulletin_2026_04.html`
- `data/fixtures/raw/dos_visa_bulletin_2026_05.html`
- `data/fixtures/raw/dos_visa_bulletin_2026_06.html`
- `data/fixtures/raw/uscis_filing_chart_2026_04.html`
- `data/fixtures/raw/uscis_filing_chart_2026_05.html`
- `data/fixtures/raw/uscis_filing_chart_2026_06.html`
- `data/source_manifest.json`
- `docs/ETL.md`
- `docs/ETL_VISA_BULLETIN_MAPPING.md`
- `etl/cli.py`
- `etl/parsers/visa_bulletin.py`
- `lib/db/local-repository.ts`
- `package.json`
- `tests/etl/test_visa_bulletin_parser.py`
- `tests/local-repository.test.ts`

## Validation

- Command: `pnpm etl:test`
- Result: pass, 41 Python ETL tests.

- Command: `pnpm etl:visa:bulletin:fixtures`
- Result: pass, 3 DOS fixture months parsed, 18 cutoff rows plus 3 month rows written.

- Command: `pnpm etl:uscis:filing-chart:fixtures`
- Result: pass, 3 USCIS filing-chart selections written.

- Command: `pnpm etl:validate`
- Result: pass, source manifest validated with 15 sources.

- Command: `pnpm test`
- Result: pass, 21 Vitest tests.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm format`
- Result: pass after `pnpm format:write`.

- Command: `pnpm build`
- Result: pass, `/visa-bulletin` generated as a static route.

- Command: `curl -L http://localhost:3000/visa-bulletin`
- Result: pass, page returned successfully and included the June 2026 table, EB categories, source notes, and disclaimer.

- Command: `git diff --check`
- Result: pass.

- Command: secret scan with `rg --pcre2`
- Result: pass, no local secrets detected.

## Screenshots / local URLs

- Local URL verified during development: `http://localhost:3000/visa-bulletin`
- The local dev server was stopped after verification.

## Decisions made without owner input

- Used April, May, and June 2026 as the first three local fixture months.
- Treated USCIS filing-chart fixture selection as `final_action` for the three fixture months until production refresh confirms the official monthly selection.
- Implemented priority-date checks as strict comparisons: a priority date must be before the cutoff date; equality is not considered current.
- Kept `/visa-bulletin` as `noindex` while the app still uses local fixture data.

## Known limitations

- The USCIS filing chart page can be difficult to fetch reliably in local automation, so the parser supports direct text parsing and manual monthly fallback fixtures.
- Fixture data is sufficient for M09 validation, but production launch still needs an official monthly refresh workflow before indexation.
- Historical DOS pages may have older HTML quirks; the parser is tested against current-style fixture pages and can be expanded as backfill starts.

## Owner action needed

None.

## Recommended next milestone

M10 — Employer canonicalization and top-company selection.
