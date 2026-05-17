from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from pathlib import Path
from typing import Sequence

from etl.downloader import download_manifest
from etl.employer_canonicalization import (
    build_company_canonicalization,
    load_manual_alias_seeds,
    load_source_records_from_jsonl,
    write_jsonl,
)
from etl.fingerprint import fingerprint_file
from etl.manifest import ManifestError, SourceEntry, load_manifest
from etl.parsers.oflc_lca import parse_lca_file, write_lca_jsonl
from etl.parsers.oflc_perm import parse_perm_file, write_perm_jsonl
from etl.parsers.oflc_pwd import parse_pwd_file, write_pwd_jsonl
from etl.parsers.uscis_h1b_employer import (
    parse_uscis_h1b_employer_file,
    write_uscis_h1b_employer_jsonl,
)
from etl.parsers.visa_bulletin import (
    parse_uscis_filing_chart_file,
    parse_visa_bulletin_file,
    write_uscis_filing_chart_jsonl,
    write_visa_bulletin_jsonl,
)
from etl.production_import import prepare_postgres_import_package
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

    parse_visa_bulletin_parser = subparsers.add_parser("parse-visa-bulletin")
    parse_visa_bulletin_parser.add_argument("--input", required=True)
    parse_visa_bulletin_parser.add_argument("--source-id", required=True)
    parse_visa_bulletin_parser.add_argument("--source-url", required=True)
    parse_visa_bulletin_parser.add_argument("--month-key")
    parse_visa_bulletin_parser.add_argument("--output", required=True)

    parse_visa_bulletin_manifest_parser = subparsers.add_parser(
        "parse-visa-bulletin-manifest"
    )
    parse_visa_bulletin_manifest_parser.add_argument("--manifest", required=True)
    parse_visa_bulletin_manifest_parser.add_argument("--repo-root", default=".")
    parse_visa_bulletin_manifest_parser.add_argument("--output", required=True)
    parse_visa_bulletin_manifest_parser.add_argument(
        "--fixtures-only",
        action="store_true",
    )

    parse_uscis_filing_chart_parser = subparsers.add_parser(
        "parse-uscis-filing-chart"
    )
    parse_uscis_filing_chart_parser.add_argument("--input", required=True)
    parse_uscis_filing_chart_parser.add_argument("--source-id", required=True)
    parse_uscis_filing_chart_parser.add_argument("--month-key")
    parse_uscis_filing_chart_parser.add_argument(
        "--fallback-employment-based-chart",
        choices=["final_action", "dates_for_filing"],
    )
    parse_uscis_filing_chart_parser.add_argument("--output", required=True)

    parse_uscis_filing_chart_manifest_parser = subparsers.add_parser(
        "parse-uscis-filing-chart-manifest"
    )
    parse_uscis_filing_chart_manifest_parser.add_argument("--manifest", required=True)
    parse_uscis_filing_chart_manifest_parser.add_argument("--repo-root", default=".")
    parse_uscis_filing_chart_manifest_parser.add_argument("--output", required=True)
    parse_uscis_filing_chart_manifest_parser.add_argument(
        "--fixtures-only",
        action="store_true",
    )

    build_company_candidates_parser = subparsers.add_parser(
        "build-company-candidates"
    )
    build_company_candidates_parser.add_argument("--lca", required=True)
    build_company_candidates_parser.add_argument("--perm", required=True)
    build_company_candidates_parser.add_argument("--uscis-h1b", required=True)
    build_company_candidates_parser.add_argument("--manual-aliases")
    build_company_candidates_parser.add_argument("--employers-output", required=True)
    build_company_candidates_parser.add_argument("--aliases-output", required=True)
    build_company_candidates_parser.add_argument("--output", required=True)
    build_company_candidates_parser.add_argument("--recent-years", type=int, default=5)
    build_company_candidates_parser.add_argument("--limit", type=int, default=2000)

    prepare_postgres_import_parser = subparsers.add_parser(
        "prepare-postgres-import"
    )
    prepare_postgres_import_parser.add_argument(
        "--manifest",
        default="data/source_manifest.json",
    )
    prepare_postgres_import_parser.add_argument(
        "--normalized-dir",
        default="data/normalized",
    )
    prepare_postgres_import_parser.add_argument("--repo-root", default=".")
    prepare_postgres_import_parser.add_argument("--output-dir", required=True)
    prepare_postgres_import_parser.add_argument(
        "--fail-on-anomaly",
        action="store_true",
    )

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
                        "invalid_records": result.invalid_records,
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
                        "invalid_records": sum(
                            result.invalid_records for result in parse_results
                        ),
                        "records_written": written,
                        "sources": [
                            {
                                "source_file_id": result.source_file_id,
                                "input_path": result.input_path,
                                "records_seen": result.records_seen,
                                "records_inserted": result.records_inserted,
                                "duplicate_records": result.duplicate_records,
                                "invalid_records": result.invalid_records,
                            }
                            for result in parse_results
                        ],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-visa-bulletin":
            result = parse_visa_bulletin_file(
                args.input,
                source_file_id=args.source_id,
                source_url=args.source_url,
                month_key=args.month_key,
            )
            written = write_visa_bulletin_jsonl(args.output, [result])
            print(
                json.dumps(
                    {
                        "source_file_id": result.source_file_id,
                        "input_path": result.input_path,
                        "output": args.output,
                        "month_key": result.month.month_key,
                        "records_seen": result.records_seen,
                        "records_inserted": result.records_inserted,
                        "records_written": written,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-visa-bulletin-manifest":
            manifest = load_manifest(args.manifest)
            repo_root = Path(args.repo_root)
            visa_bulletin_sources = [
                source
                for source in manifest.sources
                if source.parser_name == "dos_visa_bulletin"
            ]
            parse_results = []
            for source in visa_bulletin_sources:
                input_path = _source_input_path(source, repo_root, args.fixtures_only)
                result = parse_visa_bulletin_file(
                    input_path,
                    source_file_id=source.id,
                    source_url=source.official_url,
                )
                parse_results.append(result)

            written = write_visa_bulletin_jsonl(args.output, parse_results)
            print(
                json.dumps(
                    {
                        "parser_name": "dos_visa_bulletin",
                        "source_count": len(visa_bulletin_sources),
                        "output": args.output,
                        "records_seen": sum(
                            result.records_seen for result in parse_results
                        ),
                        "records_inserted": sum(
                            result.records_inserted for result in parse_results
                        ),
                        "records_written": written,
                        "sources": [
                            {
                                "source_file_id": result.source_file_id,
                                "input_path": result.input_path,
                                "month_key": result.month.month_key,
                                "records_seen": result.records_seen,
                                "records_inserted": result.records_inserted,
                            }
                            for result in parse_results
                        ],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-uscis-filing-chart":
            result = parse_uscis_filing_chart_file(
                args.input,
                source_file_id=args.source_id,
                month_key=args.month_key,
                fallback_employment_based_chart=args.fallback_employment_based_chart,
            )
            written = write_uscis_filing_chart_jsonl(args.output, [result])
            print(
                json.dumps(
                    {
                        "source_file_id": result.source_file_id,
                        "input_path": result.input_path,
                        "output": args.output,
                        "month_key": result.selection.month_key,
                        "employment_based_chart": result.selection.employment_based_chart,
                        "records_written": written,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "parse-uscis-filing-chart-manifest":
            manifest = load_manifest(args.manifest)
            repo_root = Path(args.repo_root)
            filing_chart_sources = [
                source
                for source in manifest.sources
                if source.parser_name == "uscis_adjustment_filing_chart"
            ]
            parse_results = []
            for source in filing_chart_sources:
                input_path = _source_input_path(source, repo_root, args.fixtures_only)
                result = parse_uscis_filing_chart_file(
                    input_path,
                    source_file_id=source.id,
                )
                parse_results.append(result)

            written = write_uscis_filing_chart_jsonl(args.output, parse_results)
            print(
                json.dumps(
                    {
                        "parser_name": "uscis_adjustment_filing_chart",
                        "source_count": len(filing_chart_sources),
                        "output": args.output,
                        "records_written": written,
                        "sources": [
                            {
                                "source_file_id": result.source_file_id,
                                "input_path": result.input_path,
                                "month_key": result.selection.month_key,
                                "employment_based_chart": result.selection.employment_based_chart,
                            }
                            for result in parse_results
                        ],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "build-company-candidates":
            lca_records = load_source_records_from_jsonl(
                args.lca,
                source_system="oflc_lca",
            )
            perm_records = load_source_records_from_jsonl(
                args.perm,
                source_system="oflc_perm",
            )
            uscis_records = load_source_records_from_jsonl(
                args.uscis_h1b,
                source_system="uscis_h1b_hub",
            )
            result = build_company_canonicalization(
                [*lca_records, *perm_records, *uscis_records],
                manual_alias_seeds=load_manual_alias_seeds(args.manual_aliases),
                recent_year_window=args.recent_years,
                limit=args.limit,
            )
            employers_written = write_jsonl(args.employers_output, result.employers)
            aliases_written = write_jsonl(args.aliases_output, result.aliases)
            candidates_written = write_jsonl(args.output, result.candidates)

            print(
                json.dumps(
                    {
                        "parser_name": "employer_canonicalization",
                        "latest_fiscal_year": result.latest_fiscal_year,
                        "recent_year_window": result.recent_year_window,
                        "employer_count": len(result.employers),
                        "alias_count": len(result.aliases),
                        "candidate_count": len(result.candidates),
                        "indexable_count": sum(
                            1 for candidate in result.candidates if candidate.indexable
                        ),
                        "employers_written": employers_written,
                        "aliases_written": aliases_written,
                        "candidates_written": candidates_written,
                        "outputs": {
                            "employers": args.employers_output,
                            "aliases": args.aliases_output,
                            "candidates": args.output,
                        },
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if args.command == "prepare-postgres-import":
            package = prepare_postgres_import_package(
                manifest_path=args.manifest,
                normalized_dir=args.normalized_dir,
                output_dir=args.output_dir,
                repo_root=args.repo_root,
            )
            print(
                json.dumps(
                    {
                        "output_dir": package.output_dir,
                        "table_counts": package.table_counts,
                        "anomalies": package.anomalies,
                        "load_order_sql": package.load_order_sql,
                        "report_path": package.report_path,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 1 if args.fail_on_anomaly and package.anomalies else 0

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
