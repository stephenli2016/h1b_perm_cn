# Milestone M04 Report — ETL framework and source manifest

## Status

Completed

## Built

- Added a standard-library Python ETL package under `etl/` for manifest parsing, raw-file fingerprinting, official URL downloads, fixture fallback, and JSONL run logging.
- Added `data/source_manifest.json` with 7 official-source entries covering DOL OFLC LCA, PERM, prevailing wage, FLAG wage downloads, USCIS H-1B Employer Data Hub, DOS Visa Bulletin, and USCIS filing chart sources.
- Added small synthetic raw fixtures under `data/fixtures/raw/` so the ETL can run locally without network access or secrets.
- Added package scripts: `etl:validate`, `etl:fingerprint`, `etl:fixtures`, and `etl:test`.
- Added Python unit tests for manifest validation, SHA-256 fingerprinting, failed-download fixture fallback, and run log creation.
- Added `docs/ETL.md` with the manifest schema, local fixture workflow, and ETL commands.

## Files changed

- `.gitignore`
- `package.json`
- `data/source_manifest.json`
- `data/fixtures/raw/*`
- `data/raw/.gitkeep`
- `data/etl_runs/.gitkeep`
- `etl/__init__.py`
- `etl/cli.py`
- `etl/downloader.py`
- `etl/fingerprint.py`
- `etl/manifest.py`
- `etl/requirements.txt`
- `etl/run_log.py`
- `tests/etl/test_downloader.py`
- `tests/etl/test_fingerprint.py`
- `tests/etl/test_manifest.py`
- `tests/etl/test_run_log.py`
- `docs/ETL.md`
- `docs/milestone_reports/M04_etl_framework_source_manifest.md`

## Validation

- Command: `pnpm etl:validate`
- Result: pass; manifest version 1 loaded with 7 source entries.

- Command: `pnpm etl:fingerprint`
- Result: pass; fixture SHA-256 fingerprint produced for the LCA sample.

- Command: `pnpm etl:fixtures`
- Result: pass; 7 fixture source statuses logged to `data/etl_runs/local.jsonl`.

- Command: `pnpm etl:test`
- Result: pass; 10 Python unit tests passed.

- Command: `pnpm format`
- Result: pass after formatting fixture HTML with `pnpm format:write`.

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

- Not applicable. M04 is ETL/backend infrastructure and did not change public UI.

## Decisions made without owner input

- Kept M04 Python runtime standard-library only. `etl/requirements.txt` documents this and leaves placeholders for future `duckdb`, `polars`, and `pytest` additions when larger parsers arrive.
- Used fixture-only validation by default because the sandbox has restricted network access and M04 acceptance only requires robust fixture fallback.
- Stored generated raw downloads and JSONL ETL logs under ignored paths while keeping `.gitkeep` files so directories exist.
- Left manifest checksums as `null` because the verified official source pages do not publish consistent SHA-256 checksums for the selected files/pages.
- Enforced HTTPS `.gov` official URLs in the manifest validator to support the official-source policy.

## Known limitations

- M04 does not parse the full official datasets yet; parser implementation begins in M05.
- The DOL disclosure entries use current FY2026 Q2 file URLs verified from the official OFLC performance page. If DOL changes file naming later, the manifest can be updated without changing the ETL framework.
- USCIS and DOS entries currently use official index/page URLs plus fixture HTML; later milestones can add direct downloadable files or specific monthly pages as parser needs become concrete.

## Owner action needed

None.

## Recommended next milestone

M05 — OFLC LCA/H-1B parser
