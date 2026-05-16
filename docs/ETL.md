# ETL Framework — M04

Milestone: M04 — ETL framework and source manifest

## Scope

M04 creates the ETL foundation only. It does not parse full official disclosure files yet. The framework can:

- Load and validate `data/source_manifest.json`.
- Fingerprint raw source or fixture files with SHA-256.
- Download official public URLs when network access is available.
- Fall back to local fixtures when downloads fail or `--fixtures-only` is used.
- Append JSONL run status records under `data/etl_runs/`.

## Source Manifest

Primary manifest:

- `data/source_manifest.json`

Each source entry includes:

- `id`
- `source_name`
- `official_url`
- `fiscal_year`
- `quarter`
- `expected_file_type`
- `checksum_sha256`
- `downloaded_path`
- `fixture_path`
- `parser_name`
- `required`

Official checksums are currently `null` because the selected source pages did not publish file hashes in a consistent location. The ETL logs SHA-256 fingerprints for local fixtures and downloaded files so later parser runs can be audited.

## Local Fixture Mode

The default milestone validation uses synthetic fixtures in `data/fixtures/raw/`. These files are intentionally small and contain no real worker-level data.

Run:

```bash
pnpm etl:fixtures
```

This skips network access, fingerprints each fixture, and appends ETL status lines to `data/etl_runs/local.jsonl`.

## Commands

```bash
pnpm etl:validate
pnpm etl:fingerprint
pnpm etl:fixtures
pnpm etl:lca:fixtures
pnpm etl:perm:fixtures
pnpm etl:test
```

Use `python3 -m etl.cli download --manifest data/source_manifest.json --log data/etl_runs/download.jsonl` to attempt official downloads with fixture fallback.

M05 adds `parse-lca` and `parse-lca-manifest` for OFLC LCA/H-1B disclosure files. The fixture command writes normalized JSONL to `data/normalized/h1b_lca_records.jsonl`, which is ignored as generated local output.

M06 adds `parse-perm` and `parse-perm-manifest` for OFLC PERM disclosure files. The fixture command writes normalized JSONL to `data/normalized/perm_records.jsonl`, which is ignored as generated local output.
