# Milestone M07 Report — Prevailing Wage / PWD Parser and Wage Lookup

## Status

Completed

## Built

- Added `etl/parsers/oflc_pwd.py` for OFLC PWD disclosure files and FLAG OFLC wage ZIP/CSV downloads.
- Normalized PWD/wage fields for data series, effective year, SOC code/title, area/city/state, wage levels 1-4, wage unit, source row fingerprint, and sanitized raw JSON.
- Added CLI commands and pnpm scripts for single-file and manifest-based PWD parsing:
  - `pnpm etl:pwd:fixture`
  - `pnpm etl:pwd:fixtures`
- Added fixture coverage for:
  - OFLC PWD disclosure-style rows.
  - FLAG 2025-2026 OFLC wage download rows.
  - State-level fallback rows.
- Added Python lookup helper `lookup_prevailing_wage` with exact city, area-name, state-level, and `not_found` paths.
- Added TypeScript tool-ready helper `lookupPrevailingWage` and `matchWageAmountToLevels` for local product/tool flows.
- Documented mapping and public limitations in `docs/ETL_PWD_MAPPING.md`.

## Files changed

- `data/fixtures/local-fixtures.ts`
- `data/fixtures/raw/flag_oews_wage_2025_2026.csv`
- `data/fixtures/raw/oflc_pwd_fy2026_q2.csv`
- `data/source_manifest.json`
- `docs/ETL.md`
- `docs/ETL_PWD_MAPPING.md`
- `etl/cli.py`
- `etl/parsers/oflc_pwd.py`
- `lib/db/local-repository.ts`
- `package.json`
- `tests/etl/test_oflc_pwd_parser.py`
- `tests/local-repository.test.ts`

## Validation

- Command: `pnpm etl:test`
- Result: pass — 29 ETL tests passed.

- Command: `pnpm etl:validate`
- Result: pass — manifest validates with 10 source entries.

- Command: `pnpm etl:pwd:fixture`
- Result: pass — 3 PWD fixture rows parsed and written.

- Command: `pnpm etl:pwd:fixtures`
- Result: pass — 2 PWD/FLAG sources parsed, 6 rows written, 0 duplicates.

- Command: `pnpm test`
- Result: pass — 4 Vitest files / 19 tests passed.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass. Note: one earlier parallel `pnpm typecheck` run overlapped with `pnpm build` while Next.js was regenerating `.next/types`; rerunning `pnpm typecheck` by itself passed.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm build`
- Result: pass — Next.js production build completed.

- Command: secret scan with `rg --pcre2 ...`
- Result: pass — no matches found.

- Command: `git diff --check`
- Result: pass.

## Screenshots / local URLs

- Not applicable for M07; this milestone added ETL/parser/query behavior, not a new public UI.

## Decisions made without owner input

- Used official DOL OFLC performance disclosure data and FLAG wage download pages as the only wage inputs.
- Added `flag_oews_wage_2025_2026` to the manifest with fixture fallback because the current local environment should remain runnable without network or secrets.
- Treated FLAG `WAGE_YEAR` values such as `2025-2026` as effective year `2026`.
- Made wage lookup fallback explicit instead of silently returning an imprecise row:
  - exact city/state
  - area name containing requested city
  - state-level row
  - `not_found`
- Defined wage-level matching as comparing a wage amount in the same unit as the record. Yearly records expect yearly amounts; hourly records expect hourly amounts.

## Known limitations

- Real official PWD/FLAG files can change column names; the parser has alias coverage for expected layouts but may need expansion after testing against full production downloads.
- State-level fallback is intentionally labeled as fallback and must not be displayed as precise city-level data.
- Wage-level matching is informational only. It is not an H-1B approval probability, legal conclusion, or salary compliance determination.
- The current normalized JSONL output is generated local data and is ignored by git.

## Owner action needed

None.

## Recommended next milestone

M08 — USCIS H-1B Employer Data Hub ingestion
