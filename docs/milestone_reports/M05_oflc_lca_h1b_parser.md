# Milestone M05 Report — OFLC LCA/H-1B parser

## Status

Completed

## Built

- Added `etl/parsers/oflc_lca.py` for OFLC LCA/H-1B disclosure parsing.
- Parser supports local CSV fixtures and `.xlsx` workbook input using Python standard library ZIP/XML reading.
- Normalizes case number, case status, visa class, employer name, fiscal year, SOC code/title, job title, worksite city/state/zip, wage fields, wage unit, prevailing wage, wage level, full-time indicator, and received/decision dates.
- Added wage annualization for Year, Month, Bi-Weekly, Week, Day, and Hour units.
- Added SHA-256 source record fingerprinting and duplicate detection within parser runs.
- Added sanitized `raw_record_json` preservation that drops obvious PII-sensitive fields such as worker, alien, beneficiary, attorney/contact, FEIN, phone, email, SSN, and tax IDs.
- Added FY2025 Q4 and FY2026 Q2 LCA fixture coverage and an `etl:lca:fixtures` command that writes generated normalized JSONL to ignored local output.
- Added raw-to-normalized mapping documentation in `docs/ETL_LCA_MAPPING.md`.

## Files changed

- `.gitignore`
- `package.json`
- `data/source_manifest.json`
- `data/fixtures/raw/oflc_lca_fy2025_q4.csv`
- `data/fixtures/raw/oflc_lca_fy2026_q2.csv`
- `data/normalized/.gitkeep`
- `etl/cli.py`
- `etl/parsers/__init__.py`
- `etl/parsers/oflc_lca.py`
- `tests/etl/test_oflc_lca_parser.py`
- `docs/ETL.md`
- `docs/ETL_LCA_MAPPING.md`
- `docs/milestone_reports/M05_oflc_lca_h1b_parser.md`

## Validation

- Command: `pnpm etl:test`
- Result: pass; 17 Python ETL tests passed, including LCA fixture parsing, wage annualization, duplicate fingerprinting, PII sanitization, XLSX reading, and JSONL writing.

- Command: `pnpm etl:lca:fixtures`
- Result: pass; parsed 2 LCA sources, saw 6 records, inserted 6 normalized records, wrote 6 generated JSONL records.

- Command: `pnpm etl:validate`
- Result: pass; manifest version 1 loaded with 8 source entries, including FY2025 Q4 and FY2026 Q2 LCA sources.

- Command: `python3 -m etl.cli download --manifest data/source_manifest.json --log data/etl_runs/download_attempt.jsonl --timeout-seconds 5`
- Result: pass with fallback; sandbox DNS blocked official downloads (`nodename nor servname provided`), and all 8 sources fell back to fixtures without crashing.

- Command: `pnpm etl:fingerprint`
- Result: pass; current FY2026 Q2 LCA fixture SHA-256 fingerprint generated.

- Command: `pnpm format`
- Result: pass after formatting `docs/ETL_LCA_MAPPING.md` with `pnpm format:write`.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm test`
- Result: pass; 4 Vitest files / 17 tests passed. Node still prints the expected experimental `node:sqlite` warning from M03 schema tests.

- Command: `pnpm build`
- Result: pass; Next.js production build completed and generated all current routes.

- Command: `rg --pcre2 <secret-patterns> . --hidden -g '!node_modules' -g '!.next' -g '!.git' -g '!docs/milestone_reports/**'`
- Result: pass; no committed secrets found.

## Screenshots / local URLs

- Not applicable. M05 is ETL/backend parser work and did not change public UI.

## Decisions made without owner input

- Kept the parser standard-library only to avoid adding Python dependency installation before large-file parsing is required.
- Added a tiny XLSX reader rather than adding `openpyxl`, enough for official-style workbook rows and tested with a generated workbook fixture.
- Used FY2025 Q4 plus FY2026 Q2 fixtures because official shell downloads are blocked in the current sandbox. The DOL OFLC performance page was verified and documents the latest FY2026 Q2 LCA disclosure file plus FY2025 Q1-Q4 LCA files.
- Kept generated normalized parser output ignored under `data/normalized/`.

## Known limitations

- The parser has not been run against a full official workbook in this sandbox because DNS/network access is blocked. It has CSV fixture coverage and XLSX structural coverage.
- Worksite and Appendix A side files are not joined yet. M05 captures worksite fields present in the main disclosure row; deeper multi-file joins can be added when company-page aggregation needs them.
- Employer canonicalization remains deterministic and lightweight here; broader alias merging is planned for M10.
- Annualization is a comparison normalization only. It does not determine H-1B wage compliance.

## Owner action needed

None.

## Recommended next milestone

M06 — OFLC PERM parser
