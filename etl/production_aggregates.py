from __future__ import annotations

import argparse
import csv
import heapq
import json
import re
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


AGGREGATE_TABLES = (
    "company_yearly_immigration_stats",
    "company_breakdown_stats",
    "company_wage_stats",
    "company_source_stats",
    "company_recent_h1b_samples",
    "company_recent_perm_samples",
)


@dataclass
class YearStats:
    h1b_total: int = 0
    h1b_certified: int = 0
    h1b_withdrawn: int = 0
    h1b_denied: int = 0
    perm_total: int = 0
    perm_certified: int = 0
    perm_denied: int = 0
    perm_withdrawn: int = 0
    uscis_record_count: int = 0
    uscis_initial_approvals: int = 0
    uscis_initial_denials: int = 0
    uscis_continuing_approvals: int = 0
    uscis_continuing_denials: int = 0


@dataclass
class BreakdownStats:
    label: str
    key: str
    soc_code: str | None = None
    soc_title: str | None = None
    city: str | None = None
    state: str | None = None
    h1b_count: int = 0
    perm_count: int = 0
    latest_fiscal_year: int = 0

    @property
    def total_count(self) -> int:
        return self.h1b_count + self.perm_count


@dataclass(order=True)
class SampleCandidate:
    sort_key: tuple[str, str]
    row: dict[str, str] = field(compare=False)


@dataclass
class AggregatePackage:
    output_dir: str
    table_counts: dict[str, int]
    report_path: str
    load_order_sql: str


def prepare_production_aggregate_package(
    *,
    import_dir: Path | str,
    output_dir: Path | str,
    target_limit: int = 2000,
    top_breakdowns_per_company: int = 30,
    recent_samples_per_company: int = 8,
) -> AggregatePackage:
    import_path = Path(import_dir)
    csv_path = import_path / "csv"
    output_path = Path(output_dir)
    output_csv_path = output_path / "csv"
    output_csv_path.mkdir(parents=True, exist_ok=True)

    target_employer_ids = _read_target_employer_ids(
        csv_path / "company_page_metrics.csv",
        limit=target_limit,
    )
    source_files = _read_source_files(csv_path / "source_files.csv")
    yearly: dict[tuple[str, int], YearStats] = defaultdict(YearStats)
    job_stats: dict[tuple[str, str], BreakdownStats] = {}
    location_stats: dict[tuple[str, str], BreakdownStats] = {}
    wages_by_employer: dict[str, list[float]] = defaultdict(list)
    wage_years_by_employer: dict[str, set[int]] = defaultdict(set)
    source_ids_by_employer: dict[str, set[str]] = defaultdict(set)
    h1b_samples: dict[str, list[SampleCandidate]] = defaultdict(list)
    perm_samples: dict[str, list[SampleCandidate]] = defaultdict(list)

    _consume_h1b_records(
        csv_path / "h1b_lca_records.csv",
        target_employer_ids=target_employer_ids,
        yearly=yearly,
        job_stats=job_stats,
        location_stats=location_stats,
        wages_by_employer=wages_by_employer,
        wage_years_by_employer=wage_years_by_employer,
        source_ids_by_employer=source_ids_by_employer,
        samples=h1b_samples,
        recent_samples_per_company=recent_samples_per_company,
    )
    _consume_perm_records(
        csv_path / "perm_records.csv",
        target_employer_ids=target_employer_ids,
        yearly=yearly,
        job_stats=job_stats,
        location_stats=location_stats,
        source_ids_by_employer=source_ids_by_employer,
        samples=perm_samples,
        recent_samples_per_company=recent_samples_per_company,
    )
    _consume_uscis_records(
        csv_path / "uscis_h1b_employer_records.csv",
        target_employer_ids=target_employer_ids,
        yearly=yearly,
        source_ids_by_employer=source_ids_by_employer,
    )

    table_counts = {
        "company_yearly_immigration_stats": _write_csv(
            output_csv_path / "company_yearly_immigration_stats.csv",
            _iter_yearly_rows(yearly),
        ),
        "company_breakdown_stats": _write_csv(
            output_csv_path / "company_breakdown_stats.csv",
            _iter_breakdown_rows(
                job_stats,
                location_stats,
                top_breakdowns_per_company=top_breakdowns_per_company,
            ),
        ),
        "company_wage_stats": _write_csv(
            output_csv_path / "company_wage_stats.csv",
            _iter_wage_rows(wages_by_employer, wage_years_by_employer),
        ),
        "company_source_stats": _write_csv(
            output_csv_path / "company_source_stats.csv",
            _iter_source_rows(source_ids_by_employer, source_files),
        ),
        "company_recent_h1b_samples": _write_csv(
            output_csv_path / "company_recent_h1b_samples.csv",
            _iter_h1b_sample_rows(h1b_samples),
        ),
        "company_recent_perm_samples": _write_csv(
            output_csv_path / "company_recent_perm_samples.csv",
            _iter_perm_sample_rows(perm_samples),
        ),
    }

    load_order_sql = output_path / "load_aggregates.sql"
    load_order_sql.write_text(_render_load_order_sql(), encoding="utf-8")
    report_path = output_path / "production_aggregate_report.md"
    report_path.write_text(
        _render_report(table_counts, target_count=len(target_employer_ids)),
        encoding="utf-8",
    )

    return AggregatePackage(
        output_dir=str(output_path),
        table_counts=table_counts,
        report_path=str(report_path),
        load_order_sql=str(load_order_sql),
    )


def _read_target_employer_ids(path: Path, *, limit: int) -> set[str]:
    with path.open("r", newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    rows.sort(
        key=lambda row: (
            -_to_float(row.get("quality_score")),
            -_to_int(row.get("lca_count_5y")),
            -_to_int(row.get("perm_count_5y")),
            row.get("employer_id") or "",
        ),
    )
    return {
        row["employer_id"]
        for row in rows[:limit]
        if row.get("employer_id")
    }


def _read_source_files(path: Path) -> dict[str, dict[str, str]]:
    with path.open("r", newline="", encoding="utf-8") as handle:
        return {
            row["id"]: row
            for row in csv.DictReader(handle)
            if row.get("id")
        }


def _consume_h1b_records(
    path: Path,
    *,
    target_employer_ids: set[str],
    yearly: dict[tuple[str, int], YearStats],
    job_stats: dict[tuple[str, str], BreakdownStats],
    location_stats: dict[tuple[str, str], BreakdownStats],
    wages_by_employer: dict[str, list[float]],
    wage_years_by_employer: dict[str, set[int]],
    source_ids_by_employer: dict[str, set[str]],
    samples: dict[str, list[SampleCandidate]],
    recent_samples_per_company: int,
) -> None:
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            _consume_h1b_row(
                row,
                target_employer_ids=target_employer_ids,
                yearly=yearly,
                job_stats=job_stats,
                location_stats=location_stats,
                wages_by_employer=wages_by_employer,
                wage_years_by_employer=wage_years_by_employer,
                source_ids_by_employer=source_ids_by_employer,
                samples=samples,
                recent_samples_per_company=recent_samples_per_company,
            )


def _consume_h1b_row(
    row: dict[str, str],
    *,
    target_employer_ids: set[str],
    yearly: dict[tuple[str, int], YearStats],
    job_stats: dict[tuple[str, str], BreakdownStats],
    location_stats: dict[tuple[str, str], BreakdownStats],
    wages_by_employer: dict[str, list[float]],
    wage_years_by_employer: dict[str, set[int]],
    source_ids_by_employer: dict[str, set[str]],
    samples: dict[str, list[SampleCandidate]],
    recent_samples_per_company: int,
) -> None:
        employer_id = row.get("employer_id") or ""
        if employer_id not in target_employer_ids:
            return

        fiscal_year = _to_int(row.get("fiscal_year"))
        status = (row.get("case_status") or "").upper()
        stats = yearly[(employer_id, fiscal_year)]
        stats.h1b_total += 1
        if status == "CERTIFIED":
            stats.h1b_certified += 1
        elif status == "WITHDRAWN":
            stats.h1b_withdrawn += 1
        elif status == "DENIED":
            stats.h1b_denied += 1

        _add_breakdown(
            job_stats,
            employer_id=employer_id,
            kind_key=_text_key(f"{row.get('job_title') or ''}:{row.get('soc_code') or ''}"),
            label=row.get("job_title") or "Unknown",
            source="h1b",
            fiscal_year=fiscal_year,
            soc_code=row.get("soc_code") or None,
            soc_title=row.get("soc_title") or None,
        )
        _add_breakdown(
            location_stats,
            employer_id=employer_id,
            kind_key=_location_key(row.get("worksite_city"), row.get("worksite_state")),
            label=_location_label(row.get("worksite_city"), row.get("worksite_state")),
            source="h1b",
            fiscal_year=fiscal_year,
            city=row.get("worksite_city") or None,
            state=(row.get("worksite_state") or "").upper() or None,
        )

        annualized_wage = _to_float(row.get("annualized_wage_from"))
        if annualized_wage > 0:
            wages_by_employer[employer_id].append(annualized_wage)
            wage_years_by_employer[employer_id].add(fiscal_year)

        _add_source_id(source_ids_by_employer, employer_id, row.get("source_file_id"))
        _push_sample(
            samples[employer_id],
            row,
            limit=recent_samples_per_company,
            sort_key=(row.get("decision_date") or "", row.get("case_number") or ""),
        )


def _consume_perm_records(
    path: Path,
    *,
    target_employer_ids: set[str],
    yearly: dict[tuple[str, int], YearStats],
    job_stats: dict[tuple[str, str], BreakdownStats],
    location_stats: dict[tuple[str, str], BreakdownStats],
    source_ids_by_employer: dict[str, set[str]],
    samples: dict[str, list[SampleCandidate]],
    recent_samples_per_company: int,
) -> None:
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            _consume_perm_row(
                row,
                target_employer_ids=target_employer_ids,
                yearly=yearly,
                job_stats=job_stats,
                location_stats=location_stats,
                source_ids_by_employer=source_ids_by_employer,
                samples=samples,
                recent_samples_per_company=recent_samples_per_company,
            )


def _consume_perm_row(
    row: dict[str, str],
    *,
    target_employer_ids: set[str],
    yearly: dict[tuple[str, int], YearStats],
    job_stats: dict[tuple[str, str], BreakdownStats],
    location_stats: dict[tuple[str, str], BreakdownStats],
    source_ids_by_employer: dict[str, set[str]],
    samples: dict[str, list[SampleCandidate]],
    recent_samples_per_company: int,
) -> None:
        employer_id = row.get("employer_id") or ""
        if employer_id not in target_employer_ids:
            return

        fiscal_year = _to_int(row.get("fiscal_year"))
        status = row.get("case_status") or ""
        stats = yearly[(employer_id, fiscal_year)]
        stats.perm_total += 1
        if status == "Certified":
            stats.perm_certified += 1
        elif status == "Denied":
            stats.perm_denied += 1
        elif status == "Withdrawn":
            stats.perm_withdrawn += 1

        _add_breakdown(
            job_stats,
            employer_id=employer_id,
            kind_key=_text_key(f"{row.get('job_title') or ''}:{row.get('soc_code') or ''}"),
            label=row.get("job_title") or "Unknown",
            source="perm",
            fiscal_year=fiscal_year,
            soc_code=row.get("soc_code") or None,
            soc_title=row.get("soc_title") or None,
        )
        _add_breakdown(
            location_stats,
            employer_id=employer_id,
            kind_key=_location_key(row.get("worksite_city"), row.get("worksite_state")),
            label=_location_label(row.get("worksite_city"), row.get("worksite_state")),
            source="perm",
            fiscal_year=fiscal_year,
            city=row.get("worksite_city") or None,
            state=(row.get("worksite_state") or "").upper() or None,
        )

        _add_source_id(source_ids_by_employer, employer_id, row.get("source_file_id"))
        _push_sample(
            samples[employer_id],
            row,
            limit=recent_samples_per_company,
            sort_key=(row.get("decision_date") or "", row.get("case_number") or ""),
        )


def _consume_uscis_records(
    path: Path,
    *,
    target_employer_ids: set[str],
    yearly: dict[tuple[str, int], YearStats],
    source_ids_by_employer: dict[str, set[str]],
) -> None:
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            _consume_uscis_row(
                row,
                target_employer_ids=target_employer_ids,
                yearly=yearly,
                source_ids_by_employer=source_ids_by_employer,
            )


def _consume_uscis_row(
    row: dict[str, str],
    *,
    target_employer_ids: set[str],
    yearly: dict[tuple[str, int], YearStats],
    source_ids_by_employer: dict[str, set[str]],
) -> None:
        employer_id = row.get("employer_id") or ""
        if employer_id not in target_employer_ids:
            return

        fiscal_year = _to_int(row.get("fiscal_year"))
        stats = yearly[(employer_id, fiscal_year)]
        stats.uscis_record_count += 1
        stats.uscis_initial_approvals += _to_int(row.get("initial_approvals"))
        stats.uscis_initial_denials += _to_int(row.get("initial_denials"))
        stats.uscis_continuing_approvals += _to_int(row.get("continuing_approvals"))
        stats.uscis_continuing_denials += _to_int(row.get("continuing_denials"))
        _add_source_id(source_ids_by_employer, employer_id, row.get("source_file_id"))


def _iter_yearly_rows(
    yearly: dict[tuple[str, int], YearStats],
) -> Iterable[dict[str, object | None]]:
    for (employer_id, fiscal_year), stats in sorted(yearly.items()):
        yield {
            "id": f"yearly-{employer_id}-{fiscal_year}",
            "employer_id": employer_id,
            "fiscal_year": fiscal_year,
            "h1b_total": stats.h1b_total,
            "h1b_certified": stats.h1b_certified,
            "h1b_withdrawn": stats.h1b_withdrawn,
            "h1b_denied": stats.h1b_denied,
            "perm_total": stats.perm_total,
            "perm_certified": stats.perm_certified,
            "perm_denied": stats.perm_denied,
            "perm_withdrawn": stats.perm_withdrawn,
            "uscis_record_count": stats.uscis_record_count,
            "uscis_initial_approvals": stats.uscis_initial_approvals,
            "uscis_initial_denials": stats.uscis_initial_denials,
            "uscis_continuing_approvals": stats.uscis_continuing_approvals,
            "uscis_continuing_denials": stats.uscis_continuing_denials,
        }


def _iter_breakdown_rows(
    job_stats: dict[tuple[str, str], BreakdownStats],
    location_stats: dict[tuple[str, str], BreakdownStats],
    *,
    top_breakdowns_per_company: int,
) -> Iterable[dict[str, object | None]]:
    yield from _iter_breakdown_rows_for_kind(
        job_stats,
        kind="job_title",
        top_breakdowns_per_company=top_breakdowns_per_company,
    )
    yield from _iter_breakdown_rows_for_kind(
        location_stats,
        kind="location",
        top_breakdowns_per_company=top_breakdowns_per_company,
    )


def _iter_breakdown_rows_for_kind(
    stats: dict[tuple[str, str], BreakdownStats],
    *,
    kind: str,
    top_breakdowns_per_company: int,
) -> Iterable[dict[str, object | None]]:
    grouped: dict[str, list[BreakdownStats]] = defaultdict(list)
    for (employer_id, _), row in stats.items():
        grouped[employer_id].append(row)

    for employer_id, rows in sorted(grouped.items()):
        sorted_rows = sorted(
            rows,
            key=lambda row: (-row.total_count, -row.latest_fiscal_year, row.label),
        )[:top_breakdowns_per_company]
        for index, row in enumerate(sorted_rows, start=1):
            yield {
                "id": f"{kind}-{employer_id}-{index}",
                "employer_id": employer_id,
                "kind": kind,
                "label": row.label,
                "key": row.key,
                "soc_code": row.soc_code,
                "soc_title": row.soc_title,
                "city": row.city,
                "state": row.state,
                "h1b_count": row.h1b_count,
                "perm_count": row.perm_count,
                "total_count": row.total_count,
                "latest_fiscal_year": row.latest_fiscal_year,
            }


def _iter_wage_rows(
    wages_by_employer: dict[str, list[float]],
    wage_years_by_employer: dict[str, set[int]],
) -> Iterable[dict[str, object | None]]:
    for employer_id, wages in sorted(wages_by_employer.items()):
        if not wages:
            continue
        sorted_wages = sorted(wages)
        yield {
            "id": f"wage-{employer_id}",
            "employer_id": employer_id,
            "record_count": len(sorted_wages),
            "wage_unit": "Year",
            "min_wage": round(sorted_wages[0], 2),
            "p25_wage": round(_percentile(sorted_wages, 0.25), 2),
            "median_wage": round(_percentile(sorted_wages, 0.5), 2),
            "p75_wage": round(_percentile(sorted_wages, 0.75), 2),
            "max_wage": round(sorted_wages[-1], 2),
            "fiscal_years_json": json.dumps(
                sorted(wage_years_by_employer.get(employer_id, set()), reverse=True),
                separators=(",", ":"),
            ),
        }


def _iter_source_rows(
    source_ids_by_employer: dict[str, set[str]],
    source_files: dict[str, dict[str, str]],
) -> Iterable[dict[str, object | None]]:
    for employer_id, source_ids in sorted(source_ids_by_employer.items()):
        source_rows = [source_files[source_id] for source_id in source_ids if source_id in source_files]
        source_names = sorted({row.get("source_name") or "" for row in source_rows if row.get("source_name")})
        latest_dates = sorted(row.get("latest_data_date") or "" for row in source_rows if row.get("latest_data_date"))
        yield {
            "id": f"sources-{employer_id}",
            "employer_id": employer_id,
            "source_file_ids_json": json.dumps(sorted(source_ids), separators=(",", ":")),
            "source_names_json": json.dumps(source_names, separators=(",", ":")),
            "latest_data_date": latest_dates[-1] if latest_dates else None,
        }


def _iter_h1b_sample_rows(
    samples: dict[str, list[SampleCandidate]],
) -> Iterable[dict[str, object | None]]:
    for employer_id, rows in sorted(samples.items()):
        sorted_rows = sorted(rows, key=lambda item: item.sort_key, reverse=True)
        for index, item in enumerate(sorted_rows, start=1):
            row = item.row
            yield {
                "id": f"h1b-sample-{employer_id}-{index}",
                "source_file_id": row.get("source_file_id"),
                "employer_id": employer_id,
                "location_id": row.get("location_id"),
                "source_record_id": row.get("source_record_id"),
                "source_record_fingerprint": row.get("source_record_fingerprint"),
                "case_number": row.get("case_number"),
                "case_status": row.get("case_status"),
                "raw_employer_name": row.get("raw_employer_name"),
                "fiscal_year": row.get("fiscal_year"),
                "soc_code": row.get("soc_code") or "00-0000",
                "soc_title": row.get("soc_title") or "Unknown SOC title",
                "job_title": row.get("job_title") or "Unknown job title",
                "worksite_city": row.get("worksite_city") or "Unknown",
                "worksite_state": row.get("worksite_state") or "NA",
                "wage_rate_of_pay_from": row.get("wage_rate_of_pay_from") or "0",
                "wage_rate_of_pay_to": row.get("wage_rate_of_pay_to"),
                "wage_unit": row.get("wage_unit") or "Year",
                "annualized_wage_from": row.get("annualized_wage_from") or "0",
                "annualized_wage_to": row.get("annualized_wage_to"),
                "prevailing_wage": row.get("prevailing_wage") or "0",
                "prevailing_wage_unit": row.get("prevailing_wage_unit") or "Year",
                "wage_level": row.get("wage_level"),
                "full_time": row.get("full_time"),
                "received_date": row.get("received_date"),
                "decision_date": row.get("decision_date"),
                "sample_rank": index,
            }


def _iter_perm_sample_rows(
    samples: dict[str, list[SampleCandidate]],
) -> Iterable[dict[str, object | None]]:
    for employer_id, rows in sorted(samples.items()):
        sorted_rows = sorted(rows, key=lambda item: item.sort_key, reverse=True)
        for index, item in enumerate(sorted_rows, start=1):
            row = item.row
            yield {
                "id": f"perm-sample-{employer_id}-{index}",
                "source_file_id": row.get("source_file_id"),
                "employer_id": employer_id,
                "location_id": row.get("location_id"),
                "source_record_id": row.get("source_record_id"),
                "source_record_fingerprint": row.get("source_record_fingerprint"),
                "case_number": row.get("case_number"),
                "case_status": row.get("case_status"),
                "raw_employer_name": row.get("raw_employer_name"),
                "fiscal_year": row.get("fiscal_year"),
                "job_title": row.get("job_title") or "Unknown job title",
                "soc_code": row.get("soc_code") or "00-0000",
                "soc_title": row.get("soc_title") or "Unknown SOC title",
                "worksite_city": row.get("worksite_city") or "Unknown",
                "worksite_state": row.get("worksite_state") or "NA",
                "wage_offer_from": row.get("wage_offer_from") or "0",
                "wage_offer_to": row.get("wage_offer_to"),
                "wage_unit": row.get("wage_unit") or "Year",
                "priority_date": row.get("priority_date"),
                "received_date": row.get("received_date"),
                "decision_date": row.get("decision_date"),
                "sample_rank": index,
            }


def _add_breakdown(
    stats: dict[tuple[str, str], BreakdownStats],
    *,
    employer_id: str,
    kind_key: str,
    label: str,
    source: str,
    fiscal_year: int,
    soc_code: str | None = None,
    soc_title: str | None = None,
    city: str | None = None,
    state: str | None = None,
) -> None:
    row = stats.get((employer_id, kind_key))
    if row is None:
        row = BreakdownStats(
            label=label,
            key=kind_key,
            soc_code=soc_code,
            soc_title=soc_title,
            city=city,
            state=state,
            latest_fiscal_year=fiscal_year,
        )
        stats[(employer_id, kind_key)] = row
    if source == "h1b":
        row.h1b_count += 1
    else:
        row.perm_count += 1
    row.latest_fiscal_year = max(row.latest_fiscal_year, fiscal_year)


def _push_sample(
    heap: list[SampleCandidate],
    row: dict[str, str],
    *,
    limit: int,
    sort_key: tuple[str, str],
) -> None:
    candidate = SampleCandidate(sort_key=sort_key, row=dict(row))
    if len(heap) < limit:
        heapq.heappush(heap, candidate)
        return
    if candidate > heap[0]:
        heapq.heapreplace(heap, candidate)


def _add_source_id(
    source_ids_by_employer: dict[str, set[str]],
    employer_id: str,
    source_file_id: str | None,
) -> None:
    if source_file_id:
        source_ids_by_employer[employer_id].add(source_file_id)


def _write_csv(path: Path, rows: Iterable[dict[str, object | None]]) -> int:
    iterator = iter(rows)
    try:
        first_row = next(iterator)
    except StopIteration:
        path.write_text("", encoding="utf-8")
        return 0

    fieldnames = list(first_row.keys())
    count = 0
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerow(_serialize_row(first_row))
        count += 1
        for row in iterator:
            writer.writerow(_serialize_row(row))
            count += 1
    return count


def _serialize_row(row: dict[str, object | None]) -> dict[str, object | None]:
    return {
        key: "" if value is None else value
        for key, value in row.items()
    }


def _render_load_order_sql() -> str:
    return """-- Generated by python3 -m etl.production_aggregates.
BEGIN;

TRUNCATE TABLE public.company_recent_perm_samples;
TRUNCATE TABLE public.company_recent_h1b_samples;
TRUNCATE TABLE public.company_source_stats;
TRUNCATE TABLE public.company_wage_stats;
TRUNCATE TABLE public.company_breakdown_stats;
TRUNCATE TABLE public.company_yearly_immigration_stats;

\\copy public.company_yearly_immigration_stats (id, employer_id, fiscal_year, h1b_total, h1b_certified, h1b_withdrawn, h1b_denied, perm_total, perm_certified, perm_denied, perm_withdrawn, uscis_record_count, uscis_initial_approvals, uscis_initial_denials, uscis_continuing_approvals, uscis_continuing_denials) FROM 'csv/company_yearly_immigration_stats.csv' WITH (FORMAT csv, HEADER true);
\\copy public.company_breakdown_stats (id, employer_id, kind, label, key, soc_code, soc_title, city, state, h1b_count, perm_count, total_count, latest_fiscal_year) FROM 'csv/company_breakdown_stats.csv' WITH (FORMAT csv, HEADER true);
\\copy public.company_wage_stats (id, employer_id, record_count, wage_unit, min_wage, p25_wage, median_wage, p75_wage, max_wage, fiscal_years_json) FROM 'csv/company_wage_stats.csv' WITH (FORMAT csv, HEADER true);
\\copy public.company_source_stats (id, employer_id, source_file_ids_json, source_names_json, latest_data_date) FROM 'csv/company_source_stats.csv' WITH (FORMAT csv, HEADER true);
\\copy public.company_recent_h1b_samples (id, source_file_id, employer_id, location_id, source_record_id, source_record_fingerprint, case_number, case_status, raw_employer_name, fiscal_year, soc_code, soc_title, job_title, worksite_city, worksite_state, wage_rate_of_pay_from, wage_rate_of_pay_to, wage_unit, annualized_wage_from, annualized_wage_to, prevailing_wage, prevailing_wage_unit, wage_level, full_time, received_date, decision_date, sample_rank) FROM 'csv/company_recent_h1b_samples.csv' WITH (FORMAT csv, HEADER true);
\\copy public.company_recent_perm_samples (id, source_file_id, employer_id, location_id, source_record_id, source_record_fingerprint, case_number, case_status, raw_employer_name, fiscal_year, job_title, soc_code, soc_title, worksite_city, worksite_state, wage_offer_from, wage_offer_to, wage_unit, priority_date, received_date, decision_date, sample_rank) FROM 'csv/company_recent_perm_samples.csv' WITH (FORMAT csv, HEADER true);

COMMIT;
"""


def _render_report(table_counts: dict[str, int], *, target_count: int) -> str:
    rows = "\n".join(
        f"| `{table}` | {count:,} |"
        for table, count in table_counts.items()
    )
    return f"""# Production Aggregate Import Package

Target company count: {target_count:,}

## Table CSV Counts

| Table | Rows |
| --- | ---: |
{rows}

## Notes

- Aggregates are derived only from local official-source CSVs in `data/production/postgres_import`.
- Raw H-1B LCA, PERM, and PWD detail tables are intentionally excluded from this package.
- Recent sample tables are bounded per company and are for public-page context, not exhaustive case listings.
"""


def _to_int(value: str | None) -> int:
    if value is None or value == "":
        return 0
    try:
        return int(float(value))
    except ValueError:
        return 0


def _to_float(value: str | None) -> float:
    if value is None or value == "":
        return 0.0
    try:
        return float(value)
    except ValueError:
        return 0.0


def _text_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _location_key(city: str | None, state: str | None) -> str:
    return _text_key(_location_label(city, state))


def _location_label(city: str | None, state: str | None) -> str:
    normalized_city = (city or "Unknown").strip() or "Unknown"
    normalized_state = (state or "").strip().upper()
    return f"{normalized_city}, {normalized_state}".strip().strip(",")


def _percentile(sorted_values: list[float], percentile_value: float) -> float:
    if not sorted_values:
        return 0
    if len(sorted_values) == 1:
        return sorted_values[0]
    index = (len(sorted_values) - 1) * percentile_value
    lower_index = int(index)
    upper_index = min(lower_index + 1, len(sorted_values) - 1)
    lower_value = sorted_values[lower_index]
    upper_value = sorted_values[upper_index]
    return lower_value + (upper_value - lower_value) * (index - lower_index)


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare compact production aggregate CSVs.")
    parser.add_argument("--import-dir", default="data/production/postgres_import")
    parser.add_argument("--output-dir", default="data/production/postgres_aggregates")
    parser.add_argument("--target-limit", type=int, default=2000)
    args = parser.parse_args()

    package = prepare_production_aggregate_package(
        import_dir=args.import_dir,
        output_dir=args.output_dir,
        target_limit=args.target_limit,
    )
    print(json.dumps(package.table_counts, indent=2))
    print(package.report_path)


if __name__ == "__main__":
    main()
