# Milestone M06 Report — OFLC PERM parser

## Status

Completed

## Built

- Added `etl/parsers/oflc_perm.py` for OFLC PERM disclosure parsing.
- Parser supports CSV fixtures and `.xlsx` input through the M05 tabular reader.
- Handles current-style PERM fields and revised ETA-9089 / New Form style fields.
- Normalizes employer name, case number, case status, fiscal year, job title, SOC code/title, worksite city/state, offered wage, wage unit, priority date, received date, decision date, country of citizenship, and country of birth.
- Preserves sanitized `raw_record_json` while removing obvious personal identifiers and sensitive fields.
- Added `get_perm_summary_by_employer()` so PERM records can be queried by normalized employer.
- Added `parse-perm`, `parse-perm-manifest`, `etl:perm:fixture`, and `etl:perm:fixtures`.
- Added FY2026 Q2 current-style and FY2024 New Form PERM fixtures.
- Added revised layout and mapping documentation in `docs/ETL_PERM_MAPPING.md`.

## Files changed

- `data/source_manifest.json`
- `data/fixtures/raw/oflc_perm_fy2026_q2.csv`
- `data/fixtures/raw/oflc_perm_fy2024_new_form.csv`
- `etl/cli.py`
- `etl/parsers/oflc_lca.py`
- `etl/parsers/oflc_perm.py`
- `tests/etl/test_oflc_perm_parser.py`
- `docs/ETL.md`
- `docs/ETL_PERM_MAPPING.md`
- `docs/milestone_reports/M06_oflc_perm_parser.md`

## Validation

- Command: `pnpm etl:test`
- Result: pass; 23 Python ETL tests passed, including PERM current layout, revised New Form layout, duplicate detection, PII sanitization, employer summary query, and JSONL output.

- Command: `pnpm etl:perm:fixtures`
- Result: pass; parsed 2 PERM sources, saw 4 records, inserted 4 normalized records, wrote 4 generated JSONL records.

- Command: `pnpm etl:validate`
- Result: pass; manifest version 1 loaded with 9 source entries, including FY2026 Q2 PERM and FY2024 New Form PERM sources.

- Command: `python3 -m etl.cli download --manifest data/source_manifest.json --log data/etl_runs/download_attempt_m06.jsonl --timeout-seconds 5`
- Result: pass with fallback; sandbox DNS blocked official downloads (`nodename nor servname provided`), and all 9 sources fell back to fixtures without crashing.

- Command: `pnpm etl:fingerprint`
- Result: pass; current fixture SHA-256 fingerprint generated.

- Command: `pnpm etl:fixtures`
- Result: pass; 9 fixture source statuses logged to `data/etl_runs/local.jsonl`.

- Command: `pnpm format`
- Result: pass after formatting `docs/ETL_PERM_MAPPING.md` with `pnpm format:write`.

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

- Not applicable. M06 is ETL/backend parser work and did not change public UI.

## Decisions made without owner input

- Reused the M05 standard-library tabular reader and avoided adding Python dependencies.
- Added a FY2024 New Form fixture because DOL historical PERM files split original and new ETA-9089 layouts there, making it a useful compatibility test.
- Preserved country of citizenship/birth as normalized country-level fields because M06 acceptance asks for them when available and safe. Names, emails, contact fields, FEINs, addresses, SSNs, and personal worker/beneficiary fields are stripped from preserved raw JSON.
- Fixed the shared sanitizer so fields like `EMPLOYER_BUSINESS_NAME` are not accidentally removed just because `BUSINESSNAME` contains consecutive `SSN` characters. Actual `SSN` fields are still stripped at token level.

## Known limitations

- The parser has not been run against a full official workbook in this sandbox because DNS/network access is blocked. It has fixture coverage for current and revised layouts plus inherited XLSX reader coverage from M05.
- PERM summaries are in-memory ETL helpers for now. M11 will add the public server-side query layer.
- PERM certification is only a labor certification signal. It is not I-140, I-485, consular processing, green-card approval, or a future employer promise.
- Country fields must be used carefully in public pages and should be aggregated when cohorts are small.

## Owner action needed

None.

## Recommended next milestone

M07 — Prevailing wage / PWD parser and wage lookup model
