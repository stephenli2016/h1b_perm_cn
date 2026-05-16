from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

from etl.parsers.oflc_lca import (
    annualize_wage,
    fingerprint_raw_row,
    normalize_city,
    normalize_employer_name,
    normalize_state,
    normalize_wage_unit,
    parse_date,
    parse_number,
    read_tabular_rows,
    resolve_fiscal_year,
    sanitize_raw_row,
)


FIELD_ALIASES = {
    "case_number": [
        "CASE_NUMBER",
        "CASE_NO",
        "CASE NO",
        "ETA_CASE_NUMBER",
        "PERM_CASE_NUMBER",
    ],
    "case_status": ["CASE_STATUS", "CASE STATUS", "STATUS"],
    "employer_name": [
        "EMPLOYER_NAME",
        "EMPLOYER NAME",
        "EMPLOYER_BUSINESS_NAME",
        "EMPLOYER BUSINESS NAME",
    ],
    "fiscal_year": ["FISCAL_YEAR", "FISCAL YEAR"],
    "job_title": [
        "JOB_TITLE",
        "JOB TITLE",
        "JOB_INFO_JOB_TITLE",
        "JOB OPPORTUNITY TITLE",
        "JOB_OPPORTUNITY_TITLE",
    ],
    "soc_code": [
        "SOC_CODE",
        "SOC CODE",
        "SOC",
        "SOC_OCCUPATION_CODE",
        "SOC OCCUPATION CODE",
    ],
    "soc_title": [
        "SOC_TITLE",
        "SOC TITLE",
        "SOC_NAME",
        "SOC_OCCUPATION_TITLE",
        "SOC OCCUPATION TITLE",
    ],
    "worksite_city": [
        "WORKSITE_CITY",
        "WORKSITE CITY",
        "PLACE_OF_EMPLOYMENT_CITY",
        "PLACE OF EMPLOYMENT CITY",
        "JOB_INFO_WORK_CITY",
    ],
    "worksite_state": [
        "WORKSITE_STATE",
        "WORKSITE STATE",
        "PLACE_OF_EMPLOYMENT_STATE",
        "PLACE OF EMPLOYMENT STATE",
        "JOB_INFO_WORK_STATE",
    ],
    "wage_offer_from": [
        "WAGE_OFFER_FROM",
        "WAGE OFFER FROM",
        "WAGE_OFFER_FROM_9089",
        "OFFERED_WAGE_FROM",
        "OFFERED WAGE FROM",
    ],
    "wage_offer_to": [
        "WAGE_OFFER_TO",
        "WAGE OFFER TO",
        "WAGE_OFFER_TO_9089",
        "OFFERED_WAGE_TO",
        "OFFERED WAGE TO",
    ],
    "wage_unit": [
        "WAGE_UNIT",
        "WAGE UNIT",
        "WAGE_UNIT_OF_PAY",
        "WAGE_OFFER_UNIT_OF_PAY_9089",
        "OFFERED_WAGE_UNIT",
        "OFFERED WAGE UNIT",
    ],
    "priority_date": ["PRIORITY_DATE", "PRIORITY DATE"],
    "received_date": [
        "RECEIVED_DATE",
        "RECEIVED DATE",
        "APPLICATION_RECEIVED_DATE",
        "APPLICATION RECEIVED DATE",
    ],
    "decision_date": ["DECISION_DATE", "DECISION DATE"],
    "country_of_citizenship": [
        "COUNTRY_OF_CITIZENSHIP",
        "COUNTRY OF CITIZENSHIP",
        "FOREIGN_WORKER_INFO_CITIZENSHIP_COUNTRY",
        "BENEFICIARY_CITIZENSHIP_COUNTRY",
    ],
    "country_of_birth": [
        "COUNTRY_OF_BIRTH",
        "COUNTRY OF BIRTH",
        "FOREIGN_WORKER_INFO_BIRTH_COUNTRY",
        "BENEFICIARY_BIRTH_COUNTRY",
    ],
}


@dataclass(frozen=True)
class NormalizedPermRecord:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    case_number: str | None
    case_status: str | None
    raw_employer_name: str | None
    normalized_employer_name: str | None
    fiscal_year: int
    job_title: str | None
    soc_code: str | None
    soc_title: str | None
    worksite_city: str | None
    worksite_state: str | None
    wage_offer_from: float | None
    wage_offer_to: float | None
    wage_unit: str | None
    annualized_wage_offer_from: float | None
    annualized_wage_offer_to: float | None
    priority_date: str | None
    received_date: str | None
    decision_date: str | None
    country_of_citizenship: str | None
    country_of_birth: str | None
    raw_record_json: dict[str, str | None]


@dataclass(frozen=True)
class PermParseResult:
    source_file_id: str
    input_path: str
    records_seen: int
    records_inserted: int
    duplicate_records: int
    records: tuple[NormalizedPermRecord, ...]


@dataclass(frozen=True)
class PermEmployerSummary:
    normalized_employer_name: str
    raw_employer_names: tuple[str, ...]
    total_records: int
    certified: int
    denied: int
    withdrawn: int
    fiscal_years: tuple[int, ...]
    top_job_titles: tuple[tuple[str, int], ...]
    latest_decision_date: str | None


def parse_perm_file(
    path: Path | str,
    *,
    source_file_id: str,
    fiscal_year: int | None = None,
) -> PermParseResult:
    input_path = Path(path)
    raw_rows = list(read_tabular_rows(input_path))
    seen_fingerprints: set[str] = set()
    normalized_records: list[NormalizedPermRecord] = []
    duplicates = 0

    for raw_row in raw_rows:
        record = normalize_perm_row(
            raw_row,
            source_file_id=source_file_id,
            fallback_fiscal_year=fiscal_year,
        )
        if record.source_record_fingerprint in seen_fingerprints:
            duplicates += 1
            continue

        seen_fingerprints.add(record.source_record_fingerprint)
        normalized_records.append(record)

    return PermParseResult(
        source_file_id=source_file_id,
        input_path=str(input_path),
        records_seen=len(raw_rows),
        records_inserted=len(normalized_records),
        duplicate_records=duplicates,
        records=tuple(normalized_records),
    )


def normalize_perm_row(
    raw_row: dict[str, object],
    *,
    source_file_id: str,
    fallback_fiscal_year: int | None = None,
) -> NormalizedPermRecord:
    cleaned_row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
    sanitized_raw = sanitize_raw_row(cleaned_row)
    fingerprint = fingerprint_raw_row(sanitized_raw)

    case_number = _get(cleaned_row, FIELD_ALIASES["case_number"])
    employer_name = _get(cleaned_row, FIELD_ALIASES["employer_name"])
    wage_from = parse_number(_get(cleaned_row, FIELD_ALIASES["wage_offer_from"]))
    wage_to = parse_number(_get(cleaned_row, FIELD_ALIASES["wage_offer_to"]))
    wage_unit = normalize_wage_unit(_get(cleaned_row, FIELD_ALIASES["wage_unit"]))
    priority_date = parse_date(_get(cleaned_row, FIELD_ALIASES["priority_date"]))
    received_date = parse_date(_get(cleaned_row, FIELD_ALIASES["received_date"]))
    decision_date = parse_date(_get(cleaned_row, FIELD_ALIASES["decision_date"]))

    return NormalizedPermRecord(
        source_file_id=source_file_id,
        source_record_id=case_number or fingerprint,
        source_record_fingerprint=fingerprint,
        case_number=case_number,
        case_status=_get(cleaned_row, FIELD_ALIASES["case_status"]),
        raw_employer_name=employer_name,
        normalized_employer_name=normalize_employer_name(employer_name),
        fiscal_year=resolve_fiscal_year(
            _get(cleaned_row, FIELD_ALIASES["fiscal_year"]),
            fallback_fiscal_year=fallback_fiscal_year,
            decision_date=decision_date,
        ),
        job_title=_get(cleaned_row, FIELD_ALIASES["job_title"]),
        soc_code=_get(cleaned_row, FIELD_ALIASES["soc_code"]),
        soc_title=_get(cleaned_row, FIELD_ALIASES["soc_title"]),
        worksite_city=normalize_city(_get(cleaned_row, FIELD_ALIASES["worksite_city"])),
        worksite_state=normalize_state(_get(cleaned_row, FIELD_ALIASES["worksite_state"])),
        wage_offer_from=wage_from,
        wage_offer_to=wage_to,
        wage_unit=wage_unit,
        annualized_wage_offer_from=annualize_wage(wage_from, wage_unit),
        annualized_wage_offer_to=annualize_wage(wage_to, wage_unit),
        priority_date=priority_date,
        received_date=received_date,
        decision_date=decision_date,
        country_of_citizenship=normalize_country(
            _get(cleaned_row, FIELD_ALIASES["country_of_citizenship"])
        ),
        country_of_birth=normalize_country(_get(cleaned_row, FIELD_ALIASES["country_of_birth"])),
        raw_record_json=sanitized_raw,
    )


def write_perm_jsonl(path: Path | str, records: Iterable[NormalizedPermRecord]) -> int:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with output_path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(asdict(record), ensure_ascii=False, sort_keys=True))
            handle.write("\n")
            count += 1

    return count


def get_perm_summary_by_employer(
    records: Iterable[NormalizedPermRecord],
    employer_name: str,
) -> PermEmployerSummary | None:
    target_name = normalize_employer_name(employer_name)
    matched = [record for record in records if record.normalized_employer_name == target_name]
    if not matched or target_name is None:
        return None

    status_values = [record.case_status or "" for record in matched]
    job_title_counts = Counter(record.job_title for record in matched if record.job_title)
    decision_dates = sorted(record.decision_date for record in matched if record.decision_date)

    return PermEmployerSummary(
        normalized_employer_name=target_name,
        raw_employer_names=tuple(
            sorted({record.raw_employer_name for record in matched if record.raw_employer_name})
        ),
        total_records=len(matched),
        certified=sum(1 for status in status_values if status.upper().startswith("CERTIFIED")),
        denied=sum(1 for status in status_values if status.upper() == "DENIED"),
        withdrawn=sum(1 for status in status_values if "WITHDRAWN" in status.upper()),
        fiscal_years=tuple(sorted({record.fiscal_year for record in matched})),
        top_job_titles=tuple(job_title_counts.most_common(5)),
        latest_decision_date=decision_dates[-1] if decision_dates else None,
    )


def normalize_country(value: object) -> str | None:
    text = _clean_cell(value)
    if text is None:
        return None

    upper = text.upper()
    special_names = {
        "CHINA- MAINLAND BORN": "China",
        "CHINA MAINLAND BORN": "China",
        "CHINA, PEOPLE'S REPUBLIC OF": "China",
        "PEOPLES REPUBLIC OF CHINA": "China",
        "UNITED STATES OF AMERICA": "United States",
        "USA": "United States",
        "U.S.A.": "United States",
    }
    return special_names.get(upper, text.title())


def _get(row: dict[str, str | None], candidates: list[str]) -> str | None:
    for candidate in candidates:
        value = row.get(_normalize_header(candidate))
        if value is not None and value != "":
            return value
    return None


def _normalize_header(value: object) -> str:
    text = str(value or "").strip().upper()
    text = re.sub(r"[^A-Z0-9]+", "_", text)
    return text.strip("_")


def _clean_cell(value: object) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    if text == "":
        return None

    return re.sub(r"\s+", " ", text)
