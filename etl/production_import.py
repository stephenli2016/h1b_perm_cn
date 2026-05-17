from __future__ import annotations

import csv
import gzip
import json
import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable, Sequence

from etl.employer_canonicalization import normalize_employer_name
from etl.manifest import SourceEntry, SourceManifest, load_manifest


POSTGRES_IMPORT_TABLES = (
    "locations",
    "source_files",
    "employers",
    "employer_aliases",
    "h1b_lca_records",
    "h1b_lca_worksite_records",
    "h1b_lca_appendix_a_records",
    "perm_records",
    "pwd_records",
    "pwd_case_records",
    "uscis_h1b_employer_records",
    "visa_bulletin_months",
    "visa_bulletin_dates",
    "bls_oews_occupations",
    "bls_oews_areas",
    "company_page_metrics",
)


@dataclass(frozen=True)
class ProductionImportPackage:
    output_dir: str
    table_counts: dict[str, int]
    anomalies: tuple[str, ...]
    load_order_sql: str
    report_path: str


def prepare_postgres_import_package(
    *,
    manifest_path: Path | str,
    normalized_dir: Path | str,
    output_dir: Path | str,
    repo_root: Path | str = ".",
) -> ProductionImportPackage:
    manifest = load_manifest(manifest_path)
    normalized_path = Path(normalized_dir)
    output_path = Path(output_dir)
    csv_dir = output_path / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)

    lca_path = _normalized_input_path(normalized_path, "h1b_lca_records.jsonl")
    lca_worksite_path = _optional_normalized_input_path(
        normalized_path,
        "h1b_lca_worksite_records.jsonl",
    )
    lca_appendix_a_path = _optional_normalized_input_path(
        normalized_path,
        "h1b_lca_appendix_a_records.jsonl",
    )
    perm_path = _normalized_input_path(normalized_path, "perm_records.jsonl")
    pwd_path = _normalized_input_path(normalized_path, "pwd_records.jsonl")
    pwd_case_path = _optional_normalized_input_path(
        normalized_path,
        "pwd_case_records.jsonl",
    )
    uscis_path = _normalized_input_path(
        normalized_path,
        "uscis_h1b_employer_records.jsonl",
    )
    bls_oews_occupations_path = _optional_normalized_input_path(
        normalized_path,
        "bls_oews_occupations.jsonl",
    )
    bls_oews_areas_path = _optional_normalized_input_path(
        normalized_path,
        "bls_oews_areas.jsonl",
    )
    employers = _read_jsonl(normalized_path / "employers.jsonl")
    aliases = _read_jsonl(normalized_path / "employer_aliases.jsonl")
    candidates = _read_jsonl(normalized_path / "company_page_candidates.jsonl")
    visa_records = _read_jsonl(normalized_path / "visa_bulletin_dates.jsonl")
    filing_chart_records = _read_jsonl(normalized_path / "uscis_filing_charts.jsonl")

    employer_id_by_normalized_name = _employer_id_by_normalized_name(employers, aliases)
    locations = _build_locations_from_paths(
        lca_path,
        perm_path,
        pwd_path,
        uscis_path,
        lca_worksite_path=lca_worksite_path,
        pwd_case_path=pwd_case_path,
    )
    location_id_lookup = {
        _location_lookup_key(row["city"], row["state"], row.get("postal_code")): row["id"]
        for row in locations
    }
    first_location_by_employer = _first_location_by_employer(
        _iter_records_from_paths(lca_path, perm_path, uscis_path),
        employer_id_by_normalized_name,
        location_id_lookup,
    )
    uscis_filing_chart_by_month = {
        row.get("month_key"): row.get("employment_based_chart")
        for row in filing_chart_records
        if row.get("month_key")
    }
    visa_months, visa_dates = _build_visa_tables(
        visa_records,
        uscis_filing_chart_by_month,
    )

    source_file_rows = [_source_file_row(source, repo_root=Path(repo_root)) for source in manifest.sources]
    employer_rows = [
        {
            "id": row["id"],
            "canonical_name": row["canonical_name"],
            "display_name": row["display_name"],
            "slug": row["slug"],
            "normalized_name": row["normalized_name"],
            "headquarters_location_id": first_location_by_employer.get(row["id"]),
        }
        for row in employers
    ]
    alias_rows = [
        {
            "id": row["id"],
            "employer_id": row["employer_id"],
            "raw_name": row["raw_name"],
            "normalized_name": row["normalized_name"],
            "source_system": row["source_system"],
            "confidence_score": row["confidence_score"],
            "review_status": row["review_status"],
        }
        for row in aliases
    ]
    metrics_rows = [
        {
            "id": f"metrics-{row['employer_id']}",
            "employer_id": row["employer_id"],
            "lca_count_5y": row["lca_count_5y"],
            "perm_count_5y": row["perm_count_5y"],
            "uscis_record_count_5y": row["uscis_record_count_5y"],
            "job_title_count": row["job_title_count"],
            "location_count": row["location_count"],
            "latest_fiscal_year": row["latest_fiscal_year"],
            "quality_score": row["quality_score"],
            "indexable": row["indexable"],
            "noindex_reason": row.get("noindex_reason"),
        }
        for row in candidates
    ]

    table_counts: dict[str, int] = {}
    table_counts["locations"] = _write_csv(csv_dir / "locations.csv", locations)
    table_counts["source_files"] = _write_csv(csv_dir / "source_files.csv", source_file_rows)
    table_counts["employers"] = _write_csv(csv_dir / "employers.csv", employer_rows)
    table_counts["employer_aliases"] = _write_csv(csv_dir / "employer_aliases.csv", alias_rows)

    unmatched_h1b = 0

    def h1b_rows() -> Iterable[dict[str, object | None]]:
        nonlocal unmatched_h1b
        for record in _iter_jsonl(lca_path):
            row = _build_h1b_row(
                record,
                employer_id_by_normalized_name,
                location_id_lookup,
            )
            if row is None:
                unmatched_h1b += 1
                continue
            yield row

    table_counts["h1b_lca_records"] = _write_csv(csv_dir / "h1b_lca_records.csv", h1b_rows())
    table_counts["h1b_lca_worksite_records"] = _write_csv(
        csv_dir / "h1b_lca_worksite_records.csv",
        (
            _build_lca_worksite_row(record, location_id_lookup)
            for record in _iter_optional_jsonl(lca_worksite_path)
        ),
    )
    table_counts["h1b_lca_appendix_a_records"] = _write_csv(
        csv_dir / "h1b_lca_appendix_a_records.csv",
        (
            _build_lca_appendix_a_row(record)
            for record in _iter_optional_jsonl(lca_appendix_a_path)
        ),
    )

    unmatched_perm = 0

    def perm_rows() -> Iterable[dict[str, object | None]]:
        nonlocal unmatched_perm
        for record in _iter_jsonl(perm_path):
            row = _build_perm_row(
                record,
                employer_id_by_normalized_name,
                location_id_lookup,
            )
            if row is None:
                unmatched_perm += 1
                continue
            yield row

    table_counts["perm_records"] = _write_csv(csv_dir / "perm_records.csv", perm_rows())
    table_counts["pwd_records"] = _write_csv(
        csv_dir / "pwd_records.csv",
        (_build_pwd_row(record, location_id_lookup) for record in _iter_jsonl(pwd_path)),
    )
    table_counts["pwd_case_records"] = _write_csv(
        csv_dir / "pwd_case_records.csv",
        (
            _build_pwd_case_row(
                record,
                employer_id_by_normalized_name,
                location_id_lookup,
            )
            for record in _iter_optional_jsonl(pwd_case_path)
        ),
    )

    unmatched_uscis = 0

    def uscis_rows() -> Iterable[dict[str, object | None]]:
        nonlocal unmatched_uscis
        for record in _iter_jsonl(uscis_path):
            row = _build_uscis_row(record, employer_id_by_normalized_name)
            if row is None:
                unmatched_uscis += 1
                continue
            yield row

    table_counts["uscis_h1b_employer_records"] = _write_csv(
        csv_dir / "uscis_h1b_employer_records.csv",
        uscis_rows(),
    )
    table_counts["visa_bulletin_months"] = _write_csv(
        csv_dir / "visa_bulletin_months.csv",
        visa_months,
    )
    table_counts["visa_bulletin_dates"] = _write_csv(
        csv_dir / "visa_bulletin_dates.csv",
        visa_dates,
    )
    table_counts["bls_oews_occupations"] = _write_csv(
        csv_dir / "bls_oews_occupations.csv",
        (_build_bls_oews_occupation_row(record) for record in _iter_optional_jsonl(bls_oews_occupations_path)),
    )
    table_counts["bls_oews_areas"] = _write_csv(
        csv_dir / "bls_oews_areas.csv",
        (_build_bls_oews_area_row(record) for record in _iter_optional_jsonl(bls_oews_areas_path)),
    )
    table_counts["company_page_metrics"] = _write_csv(
        csv_dir / "company_page_metrics.csv",
        metrics_rows,
    )

    load_order_sql = output_path / "load_order.sql"
    load_order_sql.write_text(
        _render_load_order_sql(POSTGRES_IMPORT_TABLES),
        encoding="utf-8",
    )
    anomalies = _build_anomalies(
        table_counts,
        unmatched_h1b=unmatched_h1b,
        unmatched_perm=unmatched_perm,
        unmatched_uscis=unmatched_uscis,
        manifest=manifest,
        repo_root=Path(repo_root),
    )
    report_path = output_path / "production_import_report.md"
    report_path.write_text(
        _render_report(
            table_counts,
            anomalies,
            output_dir=output_path,
        ),
        encoding="utf-8",
    )

    return ProductionImportPackage(
        output_dir=str(output_path),
        table_counts=table_counts,
        anomalies=tuple(anomalies),
        load_order_sql=str(load_order_sql),
        report_path=str(report_path),
    )


def _normalized_input_path(normalized_path: Path, file_name: str) -> Path:
    compressed_path = normalized_path / f"{file_name}.gz"
    if compressed_path.exists():
        return compressed_path
    return normalized_path / file_name


def _optional_normalized_input_path(normalized_path: Path, file_name: str) -> Path | None:
    compressed_path = normalized_path / f"{file_name}.gz"
    if compressed_path.exists():
        return compressed_path
    uncompressed_path = normalized_path / file_name
    if uncompressed_path.exists():
        return uncompressed_path
    return None


def _read_jsonl(path: Path) -> list[dict[str, object]]:
    if not path.exists():
        raise FileNotFoundError(f"missing normalized JSONL input: {path}")

    return list(_iter_jsonl(path))


def _iter_jsonl(path: Path) -> Iterable[dict[str, object]]:
    if not path.exists():
        raise FileNotFoundError(f"missing normalized JSONL input: {path}")

    with _open_jsonl_text(path, "rt") as handle:
        for line in handle:
            if line.strip():
                yield json.loads(line)


def _iter_optional_jsonl(path: Path | None) -> Iterable[dict[str, object]]:
    if path is None:
        return
    yield from _iter_jsonl(path)


def _iter_records_from_paths(*paths: Path) -> Iterable[dict[str, object]]:
    for path in paths:
        yield from _iter_jsonl(path)


def _open_jsonl_text(path: Path, mode: str):
    if path.suffix == ".gz":
        return gzip.open(path, mode, encoding="utf-8")
    return path.open(mode.replace("t", ""), encoding="utf-8")


def _employer_id_by_normalized_name(
    employers: Sequence[dict[str, object]],
    aliases: Sequence[dict[str, object]],
) -> dict[str, str]:
    lookup: dict[str, str] = {}

    for employer in employers:
        normalized_name = _as_str(employer.get("normalized_name"))
        employer_id = _as_str(employer.get("id"))
        if normalized_name and employer_id:
            lookup[normalized_name] = employer_id

    for alias in aliases:
        normalized_name = _as_str(alias.get("normalized_name"))
        employer_id = _as_str(alias.get("employer_id"))
        if normalized_name and employer_id:
            lookup[normalized_name] = employer_id

    return lookup


def _build_locations(
    lca_records: Sequence[dict[str, object]],
    perm_records: Sequence[dict[str, object]],
    pwd_records: Sequence[dict[str, object]],
    uscis_records: Sequence[dict[str, object]],
) -> list[dict[str, object | None]]:
    rows_by_id: dict[str, dict[str, object | None]] = {}

    for record in [*lca_records, *perm_records]:
        _add_location(
            rows_by_id,
            city=_as_str(record.get("worksite_city")),
            state=_as_str(record.get("worksite_state")),
            postal_code=_as_str(record.get("worksite_postal_code")),
        )

    for record in pwd_records:
        _add_location(
            rows_by_id,
            city=_as_str(record.get("city")),
            state=_as_str(record.get("state")),
            postal_code=None,
        )

    for record in uscis_records:
        _add_location(
            rows_by_id,
            city=_as_str(record.get("city")),
            state=_as_str(record.get("state")),
            postal_code=_as_str(record.get("postal_code")),
        )

    return sorted(rows_by_id.values(), key=lambda row: str(row["id"]))


def _build_locations_from_paths(
    lca_path: Path,
    perm_path: Path,
    pwd_path: Path,
    uscis_path: Path,
    *,
    lca_worksite_path: Path | None = None,
    pwd_case_path: Path | None = None,
) -> list[dict[str, object | None]]:
    rows_by_id: dict[str, dict[str, object | None]] = {}

    for path in (lca_path, perm_path):
        for record in _iter_jsonl(path):
            _add_location(
                rows_by_id,
                city=_as_str(record.get("worksite_city")),
                state=_as_str(record.get("worksite_state")),
                postal_code=_as_str(record.get("worksite_postal_code")),
            )

    for record in _iter_optional_jsonl(lca_worksite_path):
        _add_location(
            rows_by_id,
            city=_as_str(record.get("worksite_city")),
            state=_as_str(record.get("worksite_state")),
            postal_code=_as_str(record.get("worksite_postal_code")),
        )

    for record in _iter_jsonl(pwd_path):
        _add_location(
            rows_by_id,
            city=_as_str(record.get("city")),
            state=_as_str(record.get("state")),
            postal_code=None,
        )

    for record in _iter_optional_jsonl(pwd_case_path):
        _add_location(
            rows_by_id,
            city=_as_str(record.get("worksite_city")),
            state=_as_str(record.get("worksite_state")),
            postal_code=_as_str(record.get("worksite_postal_code")),
        )

    for record in _iter_jsonl(uscis_path):
        _add_location(
            rows_by_id,
            city=_as_str(record.get("city")),
            state=_as_str(record.get("state")),
            postal_code=_as_str(record.get("postal_code")),
        )

    return sorted(rows_by_id.values(), key=lambda row: str(row["id"]))


def _add_location(
    rows_by_id: dict[str, dict[str, object | None]],
    *,
    city: str | None,
    state: str | None,
    postal_code: str | None,
) -> None:
    if not city or not state:
        return

    location_id = _location_id(city, state, postal_code)
    rows_by_id[location_id] = {
        "id": location_id,
        "city": city,
        "state": state.upper(),
        "postal_code": postal_code,
        "country": "US",
        "normalized_key": location_id.replace("loc-", ""),
    }


def _first_location_by_employer(
    records: Iterable[dict[str, object]],
    employer_id_by_normalized_name: dict[str, str],
    location_id_lookup: dict[str, str],
) -> dict[str, str]:
    first: dict[str, str] = {}

    for record in records:
        employer_id = _employer_id_for_record(record, employer_id_by_normalized_name)
        if not employer_id or employer_id in first:
            continue

        location_id = _location_id_for_record(record, location_id_lookup)
        if location_id:
            first[employer_id] = location_id

    return first


def _source_file_row(source: SourceEntry, *, repo_root: Path) -> dict[str, object | None]:
    downloaded_path = source.resolved_download_path(repo_root)

    return {
        "id": source.id,
        "source_name": source.source_name,
        "official_url": source.official_url,
        "fiscal_year": source.fiscal_year,
        "quarter": source.quarter,
        "file_type": source.expected_file_type,
        "checksum_sha256": source.checksum_sha256,
        "storage_path": str(downloaded_path.relative_to(repo_root))
        if downloaded_path.is_absolute() and downloaded_path.exists()
        else source.downloaded_path,
        "latest_data_date": _latest_data_date(source),
        "downloaded_at": None,
    }


def _build_h1b_rows(
    records: Sequence[dict[str, object]],
    employer_id_by_normalized_name: dict[str, str],
    location_id_lookup: dict[str, str],
) -> tuple[list[dict[str, object | None]], int]:
    rows: list[dict[str, object | None]] = []
    unmatched = 0

    for record in records:
        row = _build_h1b_row(
            record,
            employer_id_by_normalized_name,
            location_id_lookup,
        )
        if row is None:
            unmatched += 1
            continue
        rows.append(row)

    return rows, unmatched


def _build_h1b_row(
    record: dict[str, object],
    employer_id_by_normalized_name: dict[str, str],
    location_id_lookup: dict[str, str],
) -> dict[str, object | None] | None:
    employer_id = _employer_id_for_record(record, employer_id_by_normalized_name)
    if not employer_id:
        return None

    source_record_id = _as_str(record.get("source_record_id")) or _as_str(
        record.get("source_record_fingerprint")
    )
    source_scoped_id = ":".join(
        [
            _as_str(record.get("source_file_id")) or "",
            source_record_id or "",
        ]
    )
    return {
        "id": f"h1b-{_stable_id(source_scoped_id)}",
        "source_file_id": record.get("source_file_id"),
        "employer_id": employer_id,
        "location_id": _location_id_for_record(record, location_id_lookup),
        "source_record_id": source_record_id,
        "source_record_fingerprint": record.get("source_record_fingerprint"),
        "case_number": record.get("case_number"),
        "case_status": _normalize_lca_status(record.get("case_status")),
        "raw_employer_name": record.get("raw_employer_name"),
        "fiscal_year": record.get("fiscal_year"),
        "soc_code": record.get("soc_code"),
        "soc_title": record.get("soc_title"),
        "job_title": record.get("job_title"),
        "worksite_city": record.get("worksite_city"),
        "worksite_state": record.get("worksite_state"),
        "worksite_postal_code": record.get("worksite_postal_code"),
        "wage_rate_of_pay_from": record.get("wage_rate_of_pay_from"),
        "wage_rate_of_pay_to": record.get("wage_rate_of_pay_to"),
        "wage_unit": record.get("wage_unit"),
        "annualized_wage_from": record.get("annualized_wage_from"),
        "annualized_wage_to": record.get("annualized_wage_to"),
        "prevailing_wage": record.get("prevailing_wage"),
        "prevailing_wage_unit": record.get("prevailing_wage_unit"),
        "wage_level": record.get("wage_level"),
        "full_time": record.get("full_time"),
        "received_date": record.get("received_date"),
        "decision_date": record.get("decision_date"),
        "raw_record_json": _json_cell(record.get("raw_record_json")),
    }


def _build_lca_worksite_row(
    record: dict[str, object],
    location_id_lookup: dict[str, str],
) -> dict[str, object | None]:
    source_record_id = _as_str(record.get("source_record_id")) or _as_str(
        record.get("source_record_fingerprint")
    )
    source_scoped_id = ":".join(
        [
            _as_str(record.get("source_file_id")) or "",
            source_record_id or "",
        ]
    )
    return {
        "id": f"lca-worksite-{_stable_id(source_scoped_id)}",
        "source_file_id": record.get("source_file_id"),
        "location_id": _location_id_for_record(record, location_id_lookup),
        "source_record_id": source_record_id,
        "source_record_fingerprint": record.get("source_record_fingerprint"),
        "case_number": record.get("case_number"),
        "fiscal_year": record.get("fiscal_year"),
        "worksite_sequence": record.get("worksite_sequence"),
        "workers": record.get("workers"),
        "secondary_entity": record.get("secondary_entity"),
        "secondary_entity_name": record.get("secondary_entity_name"),
        "worksite_city": record.get("worksite_city"),
        "worksite_county": record.get("worksite_county"),
        "worksite_state": record.get("worksite_state"),
        "worksite_postal_code": record.get("worksite_postal_code"),
        "raw_record_json": _json_cell(record.get("raw_record_json")),
    }


def _build_lca_appendix_a_row(record: dict[str, object]) -> dict[str, object | None]:
    source_record_id = _as_str(record.get("source_record_id")) or _as_str(
        record.get("source_record_fingerprint")
    )
    source_scoped_id = ":".join(
        [
            _as_str(record.get("source_file_id")) or "",
            source_record_id or "",
        ]
    )
    return {
        "id": f"lca-appendix-a-{_stable_id(source_scoped_id)}",
        "source_file_id": record.get("source_file_id"),
        "source_record_id": source_record_id,
        "source_record_fingerprint": record.get("source_record_fingerprint"),
        "case_number": record.get("case_number"),
        "fiscal_year": record.get("fiscal_year"),
        "exempt_worker_count": record.get("exempt_worker_count"),
        "h1b_dependent": record.get("h1b_dependent"),
        "willful_violator": record.get("willful_violator"),
        "raw_record_json": _json_cell(record.get("raw_record_json")),
    }


def _build_perm_rows(
    records: Sequence[dict[str, object]],
    employer_id_by_normalized_name: dict[str, str],
    location_id_lookup: dict[str, str],
) -> tuple[list[dict[str, object | None]], int]:
    rows: list[dict[str, object | None]] = []
    unmatched = 0

    for record in records:
        row = _build_perm_row(
            record,
            employer_id_by_normalized_name,
            location_id_lookup,
        )
        if row is None:
            unmatched += 1
            continue
        rows.append(row)

    return rows, unmatched


def _build_perm_row(
    record: dict[str, object],
    employer_id_by_normalized_name: dict[str, str],
    location_id_lookup: dict[str, str],
) -> dict[str, object | None] | None:
    employer_id = _employer_id_for_record(record, employer_id_by_normalized_name)
    if not employer_id:
        return None

    source_record_id = _as_str(record.get("source_record_id")) or _as_str(
        record.get("source_record_fingerprint")
    )
    source_scoped_id = ":".join(
        [
            _as_str(record.get("source_file_id")) or "",
            source_record_id or "",
        ]
    )
    return {
        "id": f"perm-{_stable_id(source_scoped_id)}",
        "source_file_id": record.get("source_file_id"),
        "employer_id": employer_id,
        "location_id": _location_id_for_record(record, location_id_lookup),
        "source_record_id": source_record_id,
        "source_record_fingerprint": record.get("source_record_fingerprint"),
        "case_number": record.get("case_number"),
        "case_status": record.get("case_status"),
        "raw_employer_name": record.get("raw_employer_name"),
        "fiscal_year": record.get("fiscal_year"),
        "job_title": record.get("job_title"),
        "soc_code": record.get("soc_code"),
        "soc_title": record.get("soc_title"),
        "worksite_city": record.get("worksite_city"),
        "worksite_state": record.get("worksite_state"),
        "wage_offer_from": record.get("wage_offer_from"),
        "wage_offer_to": record.get("wage_offer_to"),
        "wage_unit": record.get("wage_unit"),
        "priority_date": record.get("priority_date"),
        "received_date": record.get("received_date"),
        "decision_date": record.get("decision_date"),
        "pwd_case_number": record.get("pwd_case_number"),
        "pwd_soc_code": record.get("pwd_soc_code"),
        "pwd_soc_title": record.get("pwd_soc_title"),
        "pwd_wage": record.get("pwd_wage"),
        "pwd_unit": record.get("pwd_unit"),
        "annualized_pwd_wage": record.get("annualized_pwd_wage"),
        "pwd_wage_level": record.get("pwd_wage_level"),
        "minimum_education": record.get("minimum_education"),
        "major_field_of_study": record.get("major_field_of_study"),
        "training_months": record.get("training_months"),
        "experience_months": record.get("experience_months"),
        "alternate_education": record.get("alternate_education"),
        "alternate_experience_months": record.get("alternate_experience_months"),
        "foreign_language_required": record.get("foreign_language_required"),
        "raw_record_json": _json_cell(record.get("raw_record_json")),
    }


def _build_pwd_row(
    record: dict[str, object],
    location_id_lookup: dict[str, str],
) -> dict[str, object | None]:
    source_record_id = _as_str(record.get("source_record_id")) or _as_str(record.get("source_record_fingerprint"))
    source_scoped_id = ":".join(
        [
            _as_str(record.get("source_file_id")) or "",
            source_record_id or "",
        ]
    )

    return {
        "id": f"pwd-{_stable_id(source_scoped_id)}",
        "source_file_id": record.get("source_file_id"),
        "location_id": _location_id_for_record(record, location_id_lookup),
        "source_record_id": source_record_id,
        "source_record_fingerprint": record.get("source_record_fingerprint"),
        "data_series": record.get("data_series"),
        "effective_year": record.get("effective_year"),
        "soc_code": record.get("soc_code"),
        "soc_title": record.get("soc_title"),
        "area_name": record.get("area_name"),
        "city": record.get("city"),
        "state": record.get("state"),
        "wage_level_1": record.get("wage_level_1"),
        "wage_level_2": record.get("wage_level_2"),
        "wage_level_3": record.get("wage_level_3"),
        "wage_level_4": record.get("wage_level_4"),
        "wage_unit": record.get("wage_unit"),
        "raw_record_json": _json_cell(record.get("raw_record_json")),
    }


def _build_pwd_case_row(
    record: dict[str, object],
    employer_id_by_normalized_name: dict[str, str],
    location_id_lookup: dict[str, str],
) -> dict[str, object | None]:
    source_record_id = _as_str(record.get("source_record_id")) or _as_str(
        record.get("source_record_fingerprint")
    )
    source_scoped_id = ":".join(
        [
            _as_str(record.get("source_file_id")) or "",
            source_record_id or "",
        ]
    )
    return {
        "id": f"pwd-case-{_stable_id(source_scoped_id)}",
        "source_file_id": record.get("source_file_id"),
        "employer_id": _employer_id_for_record(record, employer_id_by_normalized_name),
        "location_id": _location_id_for_record(record, location_id_lookup),
        "source_record_id": source_record_id,
        "source_record_fingerprint": record.get("source_record_fingerprint"),
        "case_number": record.get("case_number"),
        "case_status": record.get("case_status"),
        "visa_class": record.get("visa_class"),
        "raw_employer_name": record.get("raw_employer_name"),
        "fiscal_year": record.get("fiscal_year"),
        "naics_code": record.get("naics_code"),
        "job_title": record.get("job_title"),
        "soc_code": record.get("soc_code"),
        "soc_title": record.get("soc_title"),
        "worksite_city": record.get("worksite_city"),
        "worksite_county": record.get("worksite_county"),
        "worksite_state": record.get("worksite_state"),
        "worksite_postal_code": record.get("worksite_postal_code"),
        "other_worksite_location": record.get("other_worksite_location"),
        "wage_source_requested": record.get("wage_source_requested"),
        "pwd_wage_rate": record.get("pwd_wage_rate"),
        "pwd_unit": record.get("pwd_unit"),
        "annualized_pwd_wage": record.get("annualized_pwd_wage"),
        "pwd_wage_level": record.get("pwd_wage_level"),
        "pwd_wage_source": record.get("pwd_wage_source"),
        "bls_area": record.get("bls_area"),
        "o_net_code": record.get("o_net_code"),
        "o_net_title": record.get("o_net_title"),
        "required_education_level": record.get("required_education_level"),
        "required_education_major": record.get("required_education_major"),
        "required_training_months": record.get("required_training_months"),
        "required_experience_months": record.get("required_experience_months"),
        "required_occupation": record.get("required_occupation"),
        "alternative_requirements": record.get("alternative_requirements"),
        "alt_education_level": record.get("alt_education_level"),
        "alt_experience_months": record.get("alt_experience_months"),
        "special_skills": record.get("special_skills"),
        "foreign_language_required": record.get("foreign_language_required"),
        "travel_required": record.get("travel_required"),
        "received_date": record.get("received_date"),
        "determination_date": record.get("determination_date"),
        "expiration_date": record.get("expiration_date"),
        "raw_record_json": _json_cell(record.get("raw_record_json")),
    }


def _build_bls_oews_occupation_row(record: dict[str, object]) -> dict[str, object | None]:
    source_record_id = _as_str(record.get("source_record_id")) or _as_str(
        record.get("occupation_code")
    )
    source_scoped_id = ":".join(
        [
            _as_str(record.get("source_file_id")) or "",
            source_record_id or "",
        ]
    )
    return {
        "id": f"bls-oews-occ-{_stable_id(source_scoped_id)}",
        "source_file_id": record.get("source_file_id"),
        "source_record_id": source_record_id,
        "source_record_fingerprint": record.get("source_record_fingerprint"),
        "release_year": record.get("release_year"),
        "occupation_code": record.get("occupation_code"),
        "occupation_name": record.get("occupation_name"),
        "display_level": record.get("display_level"),
        "selectable": record.get("selectable"),
        "sort_sequence": record.get("sort_sequence"),
        "raw_record_json": _json_cell(record.get("raw_record_json")),
    }


def _build_bls_oews_area_row(record: dict[str, object]) -> dict[str, object | None]:
    source_record_id = _as_str(record.get("source_record_id")) or _as_str(record.get("area_code"))
    source_scoped_id = ":".join(
        [
            _as_str(record.get("source_file_id")) or "",
            source_record_id or "",
        ]
    )
    return {
        "id": f"bls-oews-area-{_stable_id(source_scoped_id)}",
        "source_file_id": record.get("source_file_id"),
        "source_record_id": source_record_id,
        "source_record_fingerprint": record.get("source_record_fingerprint"),
        "release_year": record.get("release_year"),
        "area_code": record.get("area_code"),
        "area_name": record.get("area_name"),
        "area_type_code": record.get("area_type_code"),
        "display_level": record.get("display_level"),
        "selectable": record.get("selectable"),
        "sort_sequence": record.get("sort_sequence"),
        "raw_record_json": _json_cell(record.get("raw_record_json")),
    }


def _build_uscis_rows(
    records: Sequence[dict[str, object]],
    employer_id_by_normalized_name: dict[str, str],
) -> tuple[list[dict[str, object | None]], int]:
    rows: list[dict[str, object | None]] = []
    unmatched = 0

    for record in records:
        row = _build_uscis_row(record, employer_id_by_normalized_name)
        if row is None:
            unmatched += 1
            continue
        rows.append(row)

    return rows, unmatched


def _build_uscis_row(
    record: dict[str, object],
    employer_id_by_normalized_name: dict[str, str],
) -> dict[str, object | None] | None:
    employer_id = _employer_id_for_record(record, employer_id_by_normalized_name)
    if not employer_id:
        return None

    source_record_id = _as_str(record.get("source_record_id")) or _as_str(
        record.get("source_record_fingerprint")
    )
    source_scoped_id = ":".join(
        [
            _as_str(record.get("source_file_id")) or "",
            source_record_id or "",
        ]
    )
    return {
        "id": f"uscis-h1b-{_stable_id(source_scoped_id)}",
        "source_file_id": record.get("source_file_id"),
        "employer_id": employer_id,
        "source_record_id": source_record_id,
        "source_record_fingerprint": record.get("source_record_fingerprint"),
        "fiscal_year": record.get("fiscal_year"),
        "raw_employer_name": record.get("raw_employer_name"),
        "city": record.get("city"),
        "state": record.get("state"),
        "postal_code": record.get("postal_code"),
        "naics_code": record.get("naics_code"),
        "initial_approvals": record.get("initial_approvals"),
        "initial_denials": record.get("initial_denials"),
        "continuing_approvals": record.get("continuing_approvals"),
        "continuing_denials": record.get("continuing_denials"),
        "raw_record_json": _json_cell(record.get("raw_record_json")),
    }


def _build_visa_tables(
    records: Sequence[dict[str, object]],
    filing_chart_by_month: dict[object, object],
) -> tuple[list[dict[str, object | None]], list[dict[str, object | None]]]:
    month_by_key: dict[str, dict[str, object | None]] = {}
    date_rows: list[dict[str, object | None]] = []

    for record in records:
        if record.get("record_type") == "month":
            month_key = _as_str(record.get("month_key"))
            if not month_key:
                continue

            month_by_key[month_key] = {
                "id": f"vb-{month_key}",
                "month_key": month_key,
                "bulletin_year": record.get("bulletin_year"),
                "bulletin_month": record.get("bulletin_month"),
                "source_url": record.get("source_url"),
                "published_at": record.get("published_at"),
                "uscis_filing_chart": filing_chart_by_month.get(month_key) or "final_action",
            }
            continue

        if record.get("record_type") != "date":
            continue

        month_key = _as_str(record.get("month_key"))
        if not month_key:
            continue

        date_rows.append(
            {
                "id": "vb-date-"
                + _stable_id(
                    ":".join(
                        [
                            month_key,
                            _as_str(record.get("category")) or "",
                            _as_str(record.get("chargeability_area")) or "",
                            _as_str(record.get("chart_type")) or "",
                        ]
                    )
                ),
                "bulletin_month_id": f"vb-{month_key}",
                "category": record.get("category"),
                "chargeability_area": record.get("chargeability_area"),
                "chart_type": record.get("chart_type"),
                "cutoff_date": record.get("cutoff_date"),
                "cutoff_status": record.get("cutoff_status"),
                "raw_value": record.get("raw_value"),
            }
        )

    return (
        sorted(month_by_key.values(), key=lambda row: str(row["month_key"])),
        sorted(date_rows, key=lambda row: str(row["id"])),
    )


def _build_anomalies(
    table_counts: dict[str, int],
    *,
    unmatched_h1b: int,
    unmatched_perm: int,
    unmatched_uscis: int,
    manifest: SourceManifest,
    repo_root: Path,
) -> list[str]:
    anomalies: list[str] = []

    for table_name, count in table_counts.items():
        if table_name in {"h1b_lca_records", "perm_records", "visa_bulletin_months"} and count == 0:
            anomalies.append(f"{table_name} has zero rows")

    if unmatched_h1b:
        anomalies.append(f"{unmatched_h1b} H-1B LCA row(s) could not be matched to canonical employers")
    if unmatched_perm:
        anomalies.append(f"{unmatched_perm} PERM row(s) could not be matched to canonical employers")
    if unmatched_uscis:
        anomalies.append(f"{unmatched_uscis} USCIS H-1B row(s) could not be matched to canonical employers")

    missing_downloads = [
        source.id
        for source in manifest.sources
        if source.downloaded_path and not source.resolved_download_path(repo_root).exists()
    ]
    if missing_downloads:
        anomalies.append(
            f"{len(missing_downloads)} official raw download(s) are not present locally: "
            + ", ".join(missing_downloads[:8])
            + ("..." if len(missing_downloads) > 8 else "")
        )

    return anomalies


def _render_load_order_sql(table_names: Sequence[str]) -> str:
    lines = [
        "-- Generated by python3 -m etl.cli prepare-postgres-import.",
        "-- Run only against a prepared Supabase/Postgres database after review.",
        "-- Paths are relative to this load_order.sql file.",
        "BEGIN;",
        "",
    ]

    for table_name in table_names:
        columns = POSTGRES_COLUMNS[table_name]
        lines.append(
            "\\copy public."
            + table_name
            + " ("
            + ", ".join(columns)
            + f") FROM 'csv/{table_name}.csv' WITH (FORMAT csv, HEADER true);"
        )

    lines.extend(["", "COMMIT;", ""])
    return "\n".join(lines)


def _render_report(
    table_counts: dict[str, int],
    anomalies: Sequence[str],
    *,
    output_dir: Path,
) -> str:
    lines = [
        "# Production Official Data Import Package",
        "",
        f"Output directory: `{output_dir}`",
        "",
        "## Table CSV Counts",
        "",
        "| Table | Rows |",
        "| --- | ---: |",
    ]
    lines.extend(f"| `{table}` | {count} |" for table, count in table_counts.items())
    lines.extend(
        [
            "",
            "## Anomalies",
            "",
            *(f"- {anomaly}" for anomaly in anomalies),
        ]
        if anomalies
        else ["", "## Anomalies", "", "- None"]
    )
    lines.extend(
        [
            "",
            "## Safety Notes",
            "",
            "- Review this package before importing into Supabase/Postgres.",
            "- Raw official downloads and generated CSVs are local artifacts and should not be committed.",
            "- Importing data does not change `PRELAUNCH_NOINDEX`; keep public indexing off until launch gate approval.",
        ]
    )
    return "\n".join(lines) + "\n"


def _write_csv(path: Path, rows: Iterable[dict[str, object | None]]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    table_name = path.stem
    columns = POSTGRES_COLUMNS[table_name]
    count = 0

    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({column: _csv_cell(row.get(column)) for column in columns})
            count += 1

    return count


def _csv_cell(value: object | None) -> object | None:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (dict, list, tuple)):
        return _json_cell(value)
    return value


def _json_cell(value: object | None) -> str | None:
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def _employer_id_for_record(
    record: dict[str, object],
    employer_id_by_normalized_name: dict[str, str],
) -> str | None:
    normalized_name = normalize_employer_name(
        _as_str(record.get("raw_employer_name"))
        or _as_str(record.get("normalized_employer_name"))
        or ""
    )
    return employer_id_by_normalized_name.get(normalized_name)


def _location_id_for_record(
    record: dict[str, object],
    location_id_lookup: dict[str, str],
) -> str | None:
    city = _as_str(record.get("worksite_city")) or _as_str(record.get("city"))
    state = _as_str(record.get("worksite_state")) or _as_str(record.get("state"))
    postal_code = _as_str(record.get("worksite_postal_code")) or _as_str(
        record.get("postal_code")
    )
    return location_id_lookup.get(_location_lookup_key(city, state, postal_code)) or location_id_lookup.get(
        _location_lookup_key(city, state, None)
    )


def _location_lookup_key(
    city: str | None,
    state: str | None,
    postal_code: str | None,
) -> str:
    return f"{_normalize_location_part(city)}|{(state or '').upper()}|{postal_code or ''}"


def _location_id(city: str, state: str, postal_code: str | None) -> str:
    parts = [_normalize_location_part(city), state.lower()]
    if postal_code:
        parts.append(_normalize_location_part(postal_code))
    return "loc-" + "-".join(part for part in parts if part)


def _normalize_location_part(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")


def _stable_id(value: str | None) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value or "").strip("-").lower()
    return normalized[:96] or "unknown"


def _normalize_lca_status(value: object) -> str | None:
    text = _as_str(value)
    if text is None:
        return None
    return text.upper().replace(" ", "_")


def _latest_data_date(source: SourceEntry) -> str | None:
    if source.parser_name in {"dos_visa_bulletin", "uscis_adjustment_filing_chart"}:
        match = re.search(r"_(\d{4})_(\d{2})$", source.id)
        if match:
            return f"{match.group(1)}-{match.group(2)}-01"

    if source.parser_name.startswith("bls_oews_") and source.fiscal_year:
        return f"{source.fiscal_year}-05-01"

    if source.fiscal_year and source.quarter:
        quarter_end_month_day = {
            "Q1": (12, 31),
            "Q2": (3, 31),
            "Q3": (6, 30),
            "Q4": (9, 30),
        }.get(source.quarter.upper())
        if quarter_end_month_day:
            year = source.fiscal_year - 1 if source.quarter.upper() == "Q1" else source.fiscal_year
            month, day = quarter_end_month_day
            return date(year, month, day).isoformat()

    if source.fiscal_year:
        return f"{source.fiscal_year}-09-30"

    return None


def _as_str(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


POSTGRES_COLUMNS: dict[str, list[str]] = {
    "locations": [
        "id",
        "city",
        "state",
        "postal_code",
        "country",
        "normalized_key",
    ],
    "source_files": [
        "id",
        "source_name",
        "official_url",
        "fiscal_year",
        "quarter",
        "file_type",
        "checksum_sha256",
        "storage_path",
        "latest_data_date",
        "downloaded_at",
    ],
    "employers": [
        "id",
        "canonical_name",
        "display_name",
        "slug",
        "normalized_name",
        "headquarters_location_id",
    ],
    "employer_aliases": [
        "id",
        "employer_id",
        "raw_name",
        "normalized_name",
        "source_system",
        "confidence_score",
        "review_status",
    ],
    "h1b_lca_records": [
        "id",
        "source_file_id",
        "employer_id",
        "location_id",
        "source_record_id",
        "source_record_fingerprint",
        "case_number",
        "case_status",
        "raw_employer_name",
        "fiscal_year",
        "soc_code",
        "soc_title",
        "job_title",
        "worksite_city",
        "worksite_state",
        "worksite_postal_code",
        "wage_rate_of_pay_from",
        "wage_rate_of_pay_to",
        "wage_unit",
        "annualized_wage_from",
        "annualized_wage_to",
        "prevailing_wage",
        "prevailing_wage_unit",
        "wage_level",
        "full_time",
        "received_date",
        "decision_date",
        "raw_record_json",
    ],
    "h1b_lca_worksite_records": [
        "id",
        "source_file_id",
        "location_id",
        "source_record_id",
        "source_record_fingerprint",
        "case_number",
        "fiscal_year",
        "worksite_sequence",
        "workers",
        "secondary_entity",
        "secondary_entity_name",
        "worksite_city",
        "worksite_county",
        "worksite_state",
        "worksite_postal_code",
        "raw_record_json",
    ],
    "h1b_lca_appendix_a_records": [
        "id",
        "source_file_id",
        "source_record_id",
        "source_record_fingerprint",
        "case_number",
        "fiscal_year",
        "exempt_worker_count",
        "h1b_dependent",
        "willful_violator",
        "raw_record_json",
    ],
    "perm_records": [
        "id",
        "source_file_id",
        "employer_id",
        "location_id",
        "source_record_id",
        "source_record_fingerprint",
        "case_number",
        "case_status",
        "raw_employer_name",
        "fiscal_year",
        "job_title",
        "soc_code",
        "soc_title",
        "worksite_city",
        "worksite_state",
        "wage_offer_from",
        "wage_offer_to",
        "wage_unit",
        "priority_date",
        "received_date",
        "decision_date",
        "pwd_case_number",
        "pwd_soc_code",
        "pwd_soc_title",
        "pwd_wage",
        "pwd_unit",
        "annualized_pwd_wage",
        "pwd_wage_level",
        "minimum_education",
        "major_field_of_study",
        "training_months",
        "experience_months",
        "alternate_education",
        "alternate_experience_months",
        "foreign_language_required",
        "raw_record_json",
    ],
    "pwd_records": [
        "id",
        "source_file_id",
        "location_id",
        "source_record_id",
        "source_record_fingerprint",
        "data_series",
        "effective_year",
        "soc_code",
        "soc_title",
        "area_name",
        "city",
        "state",
        "wage_level_1",
        "wage_level_2",
        "wage_level_3",
        "wage_level_4",
        "wage_unit",
        "raw_record_json",
    ],
    "pwd_case_records": [
        "id",
        "source_file_id",
        "employer_id",
        "location_id",
        "source_record_id",
        "source_record_fingerprint",
        "case_number",
        "case_status",
        "visa_class",
        "raw_employer_name",
        "fiscal_year",
        "naics_code",
        "job_title",
        "soc_code",
        "soc_title",
        "worksite_city",
        "worksite_county",
        "worksite_state",
        "worksite_postal_code",
        "other_worksite_location",
        "wage_source_requested",
        "pwd_wage_rate",
        "pwd_unit",
        "annualized_pwd_wage",
        "pwd_wage_level",
        "pwd_wage_source",
        "bls_area",
        "o_net_code",
        "o_net_title",
        "required_education_level",
        "required_education_major",
        "required_training_months",
        "required_experience_months",
        "required_occupation",
        "alternative_requirements",
        "alt_education_level",
        "alt_experience_months",
        "special_skills",
        "foreign_language_required",
        "travel_required",
        "received_date",
        "determination_date",
        "expiration_date",
        "raw_record_json",
    ],
    "uscis_h1b_employer_records": [
        "id",
        "source_file_id",
        "employer_id",
        "source_record_id",
        "source_record_fingerprint",
        "fiscal_year",
        "raw_employer_name",
        "city",
        "state",
        "postal_code",
        "naics_code",
        "initial_approvals",
        "initial_denials",
        "continuing_approvals",
        "continuing_denials",
        "raw_record_json",
    ],
    "visa_bulletin_months": [
        "id",
        "month_key",
        "bulletin_year",
        "bulletin_month",
        "source_url",
        "published_at",
        "uscis_filing_chart",
    ],
    "visa_bulletin_dates": [
        "id",
        "bulletin_month_id",
        "category",
        "chargeability_area",
        "chart_type",
        "cutoff_date",
        "cutoff_status",
        "raw_value",
    ],
    "bls_oews_occupations": [
        "id",
        "source_file_id",
        "source_record_id",
        "source_record_fingerprint",
        "release_year",
        "occupation_code",
        "occupation_name",
        "display_level",
        "selectable",
        "sort_sequence",
        "raw_record_json",
    ],
    "bls_oews_areas": [
        "id",
        "source_file_id",
        "source_record_id",
        "source_record_fingerprint",
        "release_year",
        "area_code",
        "area_name",
        "area_type_code",
        "display_level",
        "selectable",
        "sort_sequence",
        "raw_record_json",
    ],
    "company_page_metrics": [
        "id",
        "employer_id",
        "lca_count_5y",
        "perm_count_5y",
        "uscis_record_count_5y",
        "job_title_count",
        "location_count",
        "latest_fiscal_year",
        "quality_score",
        "indexable",
        "noindex_reason",
    ],
}
