# Milestone M08 Report — USCIS H-1B Employer Data Hub Ingestion

## Status

Completed

## Built

- Added `etl/parsers/uscis_h1b_employer.py` for USCIS H-1B Employer Data Hub CSV-style files and local HTML table fixtures.
- Normalized USCIS employer hub fields:
  - fiscal year
  - employer / petitioner name
  - deterministic normalized employer name
  - city/state/ZIP
  - NAICS code
  - initial approvals/denials
  - continuing approvals/denials
  - sanitized raw JSON and source fingerprint
- Added privacy sanitization for Tax ID / FEIN / TIN-like raw fields before JSONL output.
- Added CLI commands and pnpm scripts:
  - `pnpm etl:uscis:h1b:fixture`
  - `pnpm etl:uscis:h1b:fixtures`
  - `python3 -m etl.cli parse-uscis-h1b`
  - `python3 -m etl.cli parse-uscis-h1b-manifest`
- Added fixture CSV `data/fixtures/raw/uscis_h1b_employer_data_fy2023.csv`.
- Added Python summary helpers by employer and fiscal year.
- Added TypeScript helper `summarizeUscisH1BEmployerData`.
- Documented USCIS mapping, source limitations, and public interpretation guardrails in `docs/ETL_USCIS_H1B_EMPLOYER_MAPPING.md`.

## Files changed

- `data/fixtures/raw/uscis_h1b_employer_data_fy2023.csv`
- `data/source_manifest.json`
- `docs/ETL.md`
- `docs/ETL_USCIS_H1B_EMPLOYER_MAPPING.md`
- `docs/milestone_reports/M08_uscis_h1b_employer_data_hub.md`
- `etl/cli.py`
- `etl/parsers/uscis_h1b_employer.py`
- `lib/db/local-repository.ts`
- `package.json`
- `tests/etl/test_uscis_h1b_employer_parser.py`
- `tests/local-repository.test.ts`

## Validation

- Command: `pnpm etl:test`
- Result: pass — 35 ETL tests passed.

- Command: `pnpm etl:validate`
- Result: pass — manifest validates with 11 source entries.

- Command: `pnpm etl:uscis:h1b:fixture`
- Result: pass — 3 USCIS fixture rows parsed and written.

- Command: `pnpm etl:uscis:h1b:fixtures`
- Result: pass — 1 manifest USCIS source parsed, 3 rows written, 0 duplicates.

- Command: `pnpm test`
- Result: pass — 4 Vitest files / 20 tests passed.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm build`
- Result: pass — Next.js production build completed.

- Command: secret scan with `rg --pcre2 ...`
- Result: pass — no matches found.

- Command: `git diff --check`
- Result: pass.

## Screenshots / local URLs

- Not applicable for M08; this milestone added ETL/parser/query behavior, not a new public UI.

## Decisions made without owner input

- Added a fixture-backed manifest source `uscis_h1b_employer_data_fy2023` using the official USCIS H-1B Employer Data Hub Files archive page as the source page.
- Kept the existing `uscis_h1b_employer_data_hub_index` source as a non-required HTML/index source and added a separate required CSV-style parser source for normalized records.
- Supported HTML table fixtures in the parser so local development can still run when official CSV links are unavailable or move.
- Removed Tax ID / FEIN / TIN-like fields from raw JSONL output for MVP privacy and disambiguation safety.
- Returned decision counts, not “success rate” labels, from helper APIs.

## Known limitations

- Direct access to USCIS Data Hub pages/files was unreliable from the local environment during M08. Search-indexed official USCIS results show the archived Data Hub Files page lists FY2009-FY2023 yearly data and was last reviewed/updated on July 1, 2025, but production backfill should refresh exact CSV download URLs before ingestion.
- Fixture rows are synthetic and must not be published as real USCIS figures.
- USCIS Employer Data Hub records are petition first-decision data, separate from DOL LCA data. They do not show worker worksites, later appeals, later revocations, employer future sponsorship policy, or individual hiring outcomes.
- The parser has aliases for expected USCIS CSV layouts, but full production files may require adding column aliases after the exact current CSV is downloaded.

## Owner action needed

None.

## Recommended next milestone

M09 — Visa Bulletin and USCIS filing chart parser
