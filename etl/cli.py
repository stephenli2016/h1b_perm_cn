from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from pathlib import Path
from typing import Sequence

from etl.downloader import download_manifest
from etl.fingerprint import fingerprint_file
from etl.manifest import ManifestError, SourceEntry, load_manifest
from etl.parsers.oflc_lca import parse_lca_file, write_lca_jsonl
from etl.parsers.oflc_perm import parse_perm_file, write_perm_jsonl
from etl.parsers.oflc_pwd import parse_pwd_file, write_pwd_jsonl
from etl.parsers.uscis_h1b_employer import (
    parse_uscis_h1b_employer_file,
    write_uscis_h1b_employer_jsonl,
)
from etl.run_log import append_run_log, create_run_id, record_from_download_result


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python3 -m etl.cli")
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate_parser = subparsers.add_parser("validate-manifest")
    validate_parser.add_argument("--manifest", required=True)

    fingerprint_parser = subparsers.add_parser("fingerprint")
    fingerprint_parser.add_argument("--path", required=True)

    download_parser = subparsers.add_parser("download")
    download_parser.add_argument("--manifest", required=True)
    download_parser.add_argument("--repo-root", default=".")
    download_parser.add_argument("--log", required=True)
    download_parser.add_argument("--fixtures-only", action="store_true")
    download_parser.add_argument("--timeout-seconds", type=int, default=30)

    parse_lca_parser = subparsers.add_parser("parse-lca")
    parse_lca_parser.add_argument("--input", required=True)
    parse_lca_parser.add_argument("--source-id", required=True)
    parse_lca_parser.add_argument("--fiscal-year", type=int)
    parse_lca_parser.add_argument("--output", required=True)

    parse_lca_manifest_parser = subparsers.add_parser("parse-lca-manifest")
    parse_lca_manifest_parser.add_argument("--manifest", required=True)
    parse_lca_manifest_parser.add_argument("--repo-root", default=".")
    parse_lca_manifest_parser.add_argument("--output", required=True)
    parse_lca_manifest_parser.add_argument("--fixtures-only", action="store_true")

    parse_perm_parser = subparsers.add_parser("parse-perm")
    parse_perm_parser.add_argument("--input", required=True)
    parse_perm_parser.add_argument("--source-id", required=True)
    parse_perm_parser.add_argument("--fiscal-year", type=int)
    parse_perm_parser.add_argument("--output", required=True)

    parse_perm_manifest_parser = subparsers.add_parser("parse-perm-manifest")
    parse_perm_manifest_parser.add_argument("--manifest", required=True)
    parse_perm_manifest_parser.add_argument("--repo-root", default=".")
    parse_perm_manifest_parser.add_argument("--output", required=True)
    parse_perm_manifest_parser.add_argument("--fixtures-only", action="store_true")

    parse_pwd_parser = subparsers.add_parser("parse-pwd")
    parse_pwd_parser.add_argument("--input", required=True)
    parse_pwd_parser.add_argument("--source-id", required=True)
    parse_pwd_parser.add_argument("--effective-year", type=int)
    parse_pwd_parser.add_argument("--data-series")
    parse_pwd_parser.add_argument("--output", required=True)

    parse_pwd_manifest_parser = subparsers.add_parser("parse-pwd-manifest")
    parse_pwd_manifest_parser.add_argument("--manifest", required=True)
    parse_pwd_manifest_parser.add_argument("--repo-root", default=".")
    parse_pwd_manifest_parser.add_argument("--output", required=True)
    parse_pwd_manifest_parser.add_argument("--fixtures-only", action="store_true")

    parse_uscis_h1b_parser = subparsers.add_parser("parse-uscis-h1b")
    parse_uscis_h1b_parser.add_argument("--input", required=True)
    parse_uscis_h1b_parser.add_argument("--source-id", required=True)
    parse_uscis_h1b_parser.add_argument("--fiscal-year", type=int)
    parse_uscis_h1b_parser.add_argument("--output", required=True)

    parse_uscis_h1b_manifest_parser = subparsers.add_parser(
        "parse-uscis-h1b-manifest"
    )
    parse_uscis_h1b_manifest_parser.add_argument("--manifest", required=True)
    parse_uscis_h1b_manifest_parser.add_argument("--repo-root", default=".")
    parse_uscis_h1b_manifest_parser.add_argument("--output", required=True)
    parse_uscis_h1b_manifest_parser.add_argument("--fixtures-only", action="store_true")

    args = parser.parse_args(argv)

    try:
        if args.command == "validate-manifest":
            manifest = load_manifest(args.manifest)
            print(
                json.dumps(
                    {
                        "manifest": args.manifest,
                        "manifest_version": manifest.manifest_version,
                        "source_count": len(manifest.sources),
                        "source_ids": [source.id for source in manifest.sources],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "fingerprint":
            fingerprint = fingerprint_file(args.path)
            print(json.dumps(asdict(fingerprint), ensure_ascii=False, indent=2))
            return 0

        if args.command == "download":
            manifest = load_manifest(args.manifest)
            results = download_manifest(
                manifest,
                Path(args.repo_root),
                fixtures_only=args.fixtures_only,
                timeout_seconds=args.timeout_seconds,
            )
            run_id = create_run_id()
            records = [
                record_from_download_result(result, run_id=run_id)
                for result in results
            ]
            append_run_log(args.log, records)

            summary = {
                "run_id": run_id,
                "result_count": len(results),
                "status_counts": _count_statuses(results),
                "log": args.log,
            }
            print(json.dumps(summary, ensure_ascii=False, indent=2))
            return 1 if any(result.status == "failed" for result in results) else 0

        if args.command == "parse-lca":
            result = parse_lca_file(
                args.input,
                source_file_id=args.source_id,
                fiscal_year=args.fiscal_year,
            )
            written = write_lca_jsonl(args.output, result.records)
            print(
                json.dumps(
                    {
                        "source_file_id": result.source_file_id,
                        "input_path": result.input_path,
                        "output": args.output,
                        "records_seen": result.records_seen,
                        "records_inserted": result.records_inserted,
                        "duplicate_records": result.duplicate_records,
                        "records_written": written,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-lca-manifest":
            manifest = load_manifest(args.manifest)
            repo_root = Path(args.repo_root)
            lca_sources = [
                source
                for source in manifest.sources
                if source.parser_name == "oflc_lca_disclosure"
            ]
            parse_results = []
            all_records = []
            for source in lca_sources:
                input_path = _source_input_path(source, repo_root, args.fixtures_only)
                result = parse_lca_file(
                    input_path,
                    source_file_id=source.id,
                    fiscal_year=source.fiscal_year,
                )
                parse_results.append(result)
                all_records.extend(result.records)

            written = write_lca_jsonl(args.output, all_records)
            print(
                json.dumps(
                    {
                        "parser_name": "oflc_lca_disclosure",
                        "source_count": len(lca_sources),
                        "output": args.output,
                        "records_seen": sum(result.records_seen for result in parse_results),
                        "records_inserted": sum(
                            result.records_inserted for result in parse_results
                        ),
                        "duplicate_records": sum(
                            result.duplicate_records for result in parse_results
                        ),
                        "records_written": written,
                        "sources": [
                            {
                                "source_file_id": result.source_file_id,
                                "input_path": result.input_path,
                                "records_seen": result.records_seen,
                                "records_inserted": result.records_inserted,
                                "duplicate_records": result.duplicate_records,
                            }
                            for result in parse_results
                        ],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-perm":
            result = parse_perm_file(
                args.input,
                source_file_id=args.source_id,
                fiscal_year=args.fiscal_year,
            )
            written = write_perm_jsonl(args.output, result.records)
            print(
                json.dumps(
                    {
                        "source_file_id": result.source_file_id,
                        "input_path": result.input_path,
                        "output": args.output,
                        "records_seen": result.records_seen,
                        "records_inserted": result.records_inserted,
                        "duplicate_records": result.duplicate_records,
                        "records_written": written,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-perm-manifest":
            manifest = load_manifest(args.manifest)
            repo_root = Path(args.repo_root)
            perm_sources = [
                source
                for source in manifest.sources
                if source.parser_name == "oflc_perm_disclosure"
            ]
            parse_results = []
            all_records = []
            for source in perm_sources:
                input_path = _source_input_path(source, repo_root, args.fixtures_only)
                result = parse_perm_file(
                    input_path,
                    source_file_id=source.id,
                    fiscal_year=source.fiscal_year,
                )
                parse_results.append(result)
                all_records.extend(result.records)

            written = write_perm_jsonl(args.output, all_records)
            print(
                json.dumps(
                    {
                        "parser_name": "oflc_perm_disclosure",
                        "source_count": len(perm_sources),
                        "output": args.output,
                        "records_seen": sum(result.records_seen for result in parse_results),
                        "records_inserted": sum(
                            result.records_inserted for result in parse_results
                        ),
                        "duplicate_records": sum(
                            result.duplicate_records for result in parse_results
                        ),
                        "records_written": written,
                        "sources": [
                            {
                                "source_file_id": result.source_file_id,
                                "input_path": result.input_path,
                                "records_seen": result.records_seen,
                                "records_inserted": result.records_inserted,
                                "duplicate_records": result.duplicate_records,
                            }
                            for result in parse_results
                        ],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-pwd":
            result = parse_pwd_file(
                args.input,
                source_file_id=args.source_id,
                effective_year=args.effective_year,
                data_series=args.data_series,
            )
            written = write_pwd_jsonl(args.output, result.records)
            print(
                json.dumps(
                    {
                        "source_file_id": result.source_file_id,
                        "input_path": result.input_path,
                        "output": args.output,
                        "records_seen": result.records_seen,
                        "records_inserted": result.records_inserted,
                        "duplicate_records": result.duplicate_records,
                        "records_written": written,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-pwd-manifest":
            manifest = load_manifest(args.manifest)
            repo_root = Path(args.repo_root)
            pwd_sources = [
                source
                for source in manifest.sources
                if source.parser_name == "oflc_pwd_disclosure"
            ]
            parse_results = []
            all_records = []
            for source in pwd_sources:
                input_path = _source_input_path(source, repo_root, args.fixtures_only)
                result = parse_pwd_file(
                    input_path,
                    source_file_id=source.id,
                    effective_year=source.fiscal_year,
                    data_series=source.source_name,
                )
                parse_results.append(result)
                all_records.extend(result.records)

            written = write_pwd_jsonl(args.output, all_records)
            print(
                json.dumps(
                    {
                        "parser_name": "oflc_pwd_disclosure",
                        "source_count": len(pwd_sources),
                        "output": args.output,
                        "records_seen": sum(result.records_seen for result in parse_results),
                        "records_inserted": sum(
                            result.records_inserted for result in parse_results
                        ),
                        "duplicate_records": sum(
                            result.duplicate_records for result in parse_results
                        ),
                        "records_written": written,
                        "sources": [
                            {
                                "source_file_id": result.source_file_id,
                                "input_path": result.input_path,
                                "records_seen": result.records_seen,
                                "records_inserted": result.records_inserted,
                                "duplicate_records": result.duplicate_records,
                            }
                            for result in parse_results
                        ],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-uscis-h1b":
            result = parse_uscis_h1b_employer_file(
                args.input,
                source_file_id=args.source_id,
                fiscal_year=args.fiscal_year,
            )
            written = write_uscis_h1b_employer_jsonl(args.output, result.records)
            print(
                json.dumps(
                    {
                        "source_file_id": result.source_file_id,
                        "input_path": result.input_path,
                        "output": args.output,
                        "records_seen": result.records_seen,
                        "records_inserted": result.records_inserted,
                        "duplicate_records": result.duplicate_records,
                        "records_written": written,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-uscis-h1b-manifest":
            manifest = load_manifest(args.manifest)
            repo_root = Path(args.repo_root)
            uscis_sources = [
                source
                for source in manifest.sources
                if source.parser_name == "uscis_h1b_employer_data_hub"
            ]
            parse_results = []
            all_records = []
            for source in uscis_sources:
                input_path = _source_input_path(source, repo_root, args.fixtures_only)
                result = parse_uscis_h1b_employer_file(
                    input_path,
                    source_file_id=source.id,
                    fiscal_year=source.fiscal_year,
                )
                parse_results.append(result)
                all_records.extend(result.records)

            written = write_uscis_h1b_employer_jsonl(args.output, all_records)
            print(
                json.dumps(
                    {
                        "parser_name": "uscis_h1b_employer_data_hub",
                        "source_count": len(uscis_sources),
                        "output": args.output,
                        "records_seen": sum(result.records_seen for result in parse_results),
                        "records_inserted": sum(
                            result.records_inserted for result in parse_results
                        ),
                        "duplicate_records": sum(
                            result.duplicate_records for result in parse_results
                        ),
                        "records_written": written,
                        "sources": [
                            {
                                "source_file_id": result.source_file_id,
                                "input_path": result.input_path,
                                "records_seen": result.records_seen,
                                "records_inserted": result.records_inserted,
                                "duplicate_records": result.duplicate_records,
                            }
                            for result in parse_results
                        ],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

    except (ManifestError, FileNotFoundError, OSError) as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False, indent=2))
        return 1

    return 1


def _count_statuses(results: Sequence[object]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for result in results:
        status = getattr(result, "status")
        counts[status] = counts.get(status, 0) + 1
    return counts


def _source_input_path(source: SourceEntry, repo_root: Path, fixtures_only: bool) -> Path:
    fixture_path = source.resolved_fixture_path(repo_root)
    downloaded_path = source.resolved_download_path(repo_root)

    if fixtures_only:
        if fixture_path is None:
            raise FileNotFoundError(f"{source.id} has no fixture_path")
        return fixture_path

    if downloaded_path.exists():
        return downloaded_path
    if fixture_path and fixture_path.exists():
        return fixture_path
    return downloaded_path


if __name__ == "__main__":
    raise SystemExit(main())
