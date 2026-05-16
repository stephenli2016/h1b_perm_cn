from __future__ import annotations

import csv
import json
import re
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable

from etl.parsers.oflc_lca import (
    fingerprint_raw_row,
    normalize_city,
    normalize_employer_name,
    normalize_state,
    parse_number,
    read_tabular_rows,
)


FIELD_ALIASES = {
    "source_record_id": ["SOURCE_RECORD_ID", "SOURCE RECORD ID", "RECORD_ID"],
    "fiscal_year": ["FISCAL_YEAR", "FISCAL YEAR", "FY", "YEAR"],
    "employer_name": [
        "EMPLOYER",
        "EMPLOYER_NAME",
        "EMPLOYER NAME",
        "EMPLOYER_PETITIONER_NAME",
        "EMPLOYER PETITIONER NAME",
        "EMPLOYER (PETITIONER) NAME",
        "PETITIONER_NAME",
        "PETITIONER NAME",
    ],
    "city": ["CITY", "PETITIONER_CITY", "PETITIONER CITY"],
    "state": ["STATE", "PETITIONER_STATE", "PETITIONER STATE"],
    "postal_code": [
        "ZIP",
        "ZIP_CODE",
        "ZIP CODE",
        "POSTAL_CODE",
        "POSTAL CODE",
        "PETITIONER_ZIP",
        "PETITIONER ZIP",
    ],
    "naics_code": ["NAICS", "NAICS_CODE", "NAICS CODE"],
    "initial_approvals": [
        "INITIAL_APPROVAL",
        "INITIAL APPROVAL",
        "INITIAL_APPROVALS",
        "INITIAL APPROVALS",
        "INITIAL_EMPLOYMENT_APPROVALS",
        "INITIAL EMPLOYMENT APPROVALS",
    ],
    "initial_denials": [
        "INITIAL_DENIAL",
        "INITIAL DENIAL",
        "INITIAL_DENIALS",
        "INITIAL DENIALS",
        "INITIAL_EMPLOYMENT_DENIALS",
        "INITIAL EMPLOYMENT DENIALS",
    ],
    "continuing_approvals": [
        "CONTINUING_APPROVAL",
        "CONTINUING APPROVAL",
        "CONTINUING_APPROVALS",
        "CONTINUING APPROVALS",
        "CONTINUING_EMPLOYMENT_APPROVALS",
        "CONTINUING EMPLOYMENT APPROVALS",
    ],
    "continuing_denials": [
        "CONTINUING_DENIAL",
        "CONTINUING DENIAL",
        "CONTINUING_DENIALS",
        "CONTINUING DENIALS",
        "CONTINUING_EMPLOYMENT_DENIALS",
        "CONTINUING EMPLOYMENT DENIALS",
    ],
}

SENSITIVE_RAW_KEY_PARTS = (
    "EIN",
    "FEIN",
    "IRS",
    "SSN",
    "TAX_ID",
    "TAXID",
    "TIN",
)


@dataclass(frozen=True)
class NormalizedUscisH1BEmployerRecord:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    fiscal_year: int
    raw_employer_name: str
    normalized_employer_name: str | None
    city: str | None
    state: str | None
    postal_code: str | None
    naics_code: str | None
    initial_approvals: int | None
    initial_denials: int | None
    continuing_approvals: int | None
    continuing_denials: int | None
    raw_record_json: dict[str, str | None]


@dataclass(frozen=True)
class UscisH1BEmployerParseResult:
    source_file_id: str
    input_path: str
    records_seen: int
    records_inserted: int
    duplicate_records: int
    records: tuple[NormalizedUscisH1BEmployerRecord, ...]


@dataclass(frozen=True)
class UscisH1BEmployerFiscalYearSummary:
    normalized_employer_name: str
    fiscal_year: int
    total_records: int
    initial_approvals: int
    initial_denials: int
    continuing_approvals: int
    continuing_denials: int
    initial_decisions: int
    continuing_decisions: int
    first_decisions: int
    cities: tuple[str, ...]
    states: tuple[str, ...]
    naics_codes: tuple[str, ...]


def parse_uscis_h1b_employer_file(
    path: Path | str,
    *,
    source_file_id: str,
    fiscal_year: int | None = None,
) -> UscisH1BEmployerParseResult:
    input_path = Path(path)
    raw_rows = list(read_uscis_h1b_employer_rows(input_path))
    seen_fingerprints: set[str] = set()
    normalized_records: list[NormalizedUscisH1BEmployerRecord] = []
    duplicates = 0

    for raw_row in raw_rows:
        record = normalize_uscis_h1b_employer_row(
            raw_row,
            source_file_id=source_file_id,
            fallback_fiscal_year=fiscal_year,
        )
        if record.source_record_fingerprint in seen_fingerprints:
            duplicates += 1
            continue

        seen_fingerprints.add(record.source_record_fingerprint)
        normalized_records.append(record)

    return UscisH1BEmployerParseResult(
        source_file_id=source_file_id,
        input_path=str(input_path),
        records_seen=len(raw_rows),
        records_inserted=len(normalized_records),
        duplicate_records=duplicates,
        records=tuple(normalized_records),
    )


def normalize_uscis_h1b_employer_row(
    raw_row: dict[str, object],
    *,
    source_file_id: str,
    fallback_fiscal_year: int | None = None,
) -> NormalizedUscisH1BEmployerRecord:
    cleaned_row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
    sanitized_raw = sanitize_uscis_raw_row(cleaned_row)
    fingerprint = fingerprint_raw_row(sanitized_raw)

    fiscal_year = resolve_fiscal_year(
        _get(cleaned_row, FIELD_ALIASES["fiscal_year"]),
        fallback_fiscal_year=fallback_fiscal_year,
    )
    raw_employer_name = _require(
        _get(cleaned_row, FIELD_ALIASES["employer_name"]),
        "employer_name",
    )
    normalized_employer = normalize_employer_name(raw_employer_name)
    city = normalize_city(_get(cleaned_row, FIELD_ALIASES["city"]))
    state = normalize_state(_get(cleaned_row, FIELD_ALIASES["state"]))
    postal_code = _normalize_postal_code(_get(cleaned_row, FIELD_ALIASES["postal_code"]))
    naics_code = _normalize_code(_get(cleaned_row, FIELD_ALIASES["naics_code"]))
    source_record_id = _get(cleaned_row, FIELD_ALIASES["source_record_id"])

    return NormalizedUscisH1BEmployerRecord(
        source_file_id=source_file_id,
        source_record_id=source_record_id
        or ":".join(
            [
                source_file_id,
                str(fiscal_year),
                normalized_employer or raw_employer_name.lower(),
                city or "",
                state or "",
                postal_code or "",
                naics_code or "",
                fingerprint[:12],
            ]
        ),
        source_record_fingerprint=fingerprint,
        fiscal_year=fiscal_year,
        raw_employer_name=raw_employer_name,
        normalized_employer_name=normalized_employer,
        city=city,
        state=state,
        postal_code=postal_code,
        naics_code=naics_code,
        initial_approvals=_parse_count(_get(cleaned_row, FIELD_ALIASES["initial_approvals"])),
        initial_denials=_parse_count(_get(cleaned_row, FIELD_ALIASES["initial_denials"])),
        continuing_approvals=_parse_count(
            _get(cleaned_row, FIELD_ALIASES["continuing_approvals"])
        ),
        continuing_denials=_parse_count(
            _get(cleaned_row, FIELD_ALIASES["continuing_denials"])
        ),
        raw_record_json=sanitized_raw,
    )


def read_uscis_h1b_employer_rows(path: Path | str) -> Iterable[dict[str, object]]:
    input_path = Path(path)
    if input_path.suffix.lower() in {".html", ".htm"}:
        yield from _read_html_tables(input_path)
        return

    yield from read_tabular_rows(input_path)


def write_uscis_h1b_employer_jsonl(
    path: Path | str,
    records: Iterable[NormalizedUscisH1BEmployerRecord],
) -> int:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with output_path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(asdict(record), ensure_ascii=False, sort_keys=True))
            handle.write("\n")
            count += 1

    return count


def get_uscis_h1b_summaries_by_employer(
    records: Iterable[NormalizedUscisH1BEmployerRecord],
    employer_name: str,
) -> tuple[UscisH1BEmployerFiscalYearSummary, ...]:
    normalized_name = normalize_employer_name(employer_name)
    if normalized_name is None:
        return tuple()

    matches = [
        record
        for record in records
        if record.normalized_employer_name == normalized_name
    ]
    by_year: dict[int, list[NormalizedUscisH1BEmployerRecord]] = {}

    for record in matches:
        by_year.setdefault(record.fiscal_year, []).append(record)

    return tuple(
        _summarize_year(normalized_name, fiscal_year, year_records)
        for fiscal_year, year_records in sorted(by_year.items(), reverse=True)
    )


def get_uscis_h1b_summary_by_employer_fiscal_year(
    records: Iterable[NormalizedUscisH1BEmployerRecord],
    employer_name: str,
    fiscal_year: int,
) -> UscisH1BEmployerFiscalYearSummary | None:
    summaries = get_uscis_h1b_summaries_by_employer(records, employer_name)
    for summary in summaries:
        if summary.fiscal_year == fiscal_year:
            return summary
    return None


def sanitize_uscis_raw_row(row: dict[str, str | None]) -> dict[str, str | None]:
    sanitized: dict[str, str | None] = {}
    for key, value in row.items():
        normalized_key = _normalize_header(key)
        if any(part in normalized_key for part in SENSITIVE_RAW_KEY_PARTS):
            continue
        sanitized[normalized_key] = value
    return sanitized


def resolve_fiscal_year(
    value: object,
    *,
    fallback_fiscal_year: int | None = None,
) -> int:
    parsed_year = parse_number(value)
    if parsed_year is not None:
        return int(parsed_year)

    if fallback_fiscal_year is not None:
        return fallback_fiscal_year

    raise ValueError("fiscal year is required when it cannot be inferred from the row")


def _summarize_year(
    normalized_employer_name: str,
    fiscal_year: int,
    records: list[NormalizedUscisH1BEmployerRecord],
) -> UscisH1BEmployerFiscalYearSummary:
    initial_approvals = sum(_count(record.initial_approvals) for record in records)
    initial_denials = sum(_count(record.initial_denials) for record in records)
    continuing_approvals = sum(_count(record.continuing_approvals) for record in records)
    continuing_denials = sum(_count(record.continuing_denials) for record in records)

    return UscisH1BEmployerFiscalYearSummary(
        normalized_employer_name=normalized_employer_name,
        fiscal_year=fiscal_year,
        total_records=len(records),
        initial_approvals=initial_approvals,
        initial_denials=initial_denials,
        continuing_approvals=continuing_approvals,
        continuing_denials=continuing_denials,
        initial_decisions=initial_approvals + initial_denials,
        continuing_decisions=continuing_approvals + continuing_denials,
        first_decisions=initial_approvals
        + initial_denials
        + continuing_approvals
        + continuing_denials,
        cities=_sorted_unique(record.city for record in records),
        states=_sorted_unique(record.state for record in records),
        naics_codes=_sorted_unique(record.naics_code for record in records),
    )


def _read_html_tables(path: Path) -> Iterable[dict[str, object]]:
    parser = _TableParser()
    parser.feed(path.read_text(encoding="utf-8"))

    for table in parser.tables:
        if len(table) < 2:
            continue
        headers = table[0]
        for row in table[1:]:
            if len(row) != len(headers):
                continue
            yield dict(zip(headers, row, strict=True))


class _TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tables: list[list[list[str]]] = []
        self._in_table = False
        self._in_row = False
        self._in_cell = False
        self._current_table: list[list[str]] = []
        self._current_row: list[str] = []
        self._current_cell: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "table":
            self._in_table = True
            self._current_table = []
        elif self._in_table and tag == "tr":
            self._in_row = True
            self._current_row = []
        elif self._in_row and tag in {"td", "th"}:
            self._in_cell = True
            self._current_cell = []

    def handle_endtag(self, tag: str) -> None:
        if self._in_cell and tag in {"td", "th"}:
            self._current_row.append(_clean_html_text("".join(self._current_cell)))
            self._in_cell = False
        elif self._in_row and tag == "tr":
            if any(cell for cell in self._current_row):
                self._current_table.append(self._current_row)
            self._in_row = False
        elif self._in_table and tag == "table":
            self.tables.append(self._current_table)
            self._in_table = False

    def handle_data(self, data: str) -> None:
        if self._in_cell:
            self._current_cell.append(data)


def _get(row: dict[str, str | None], candidates: list[str]) -> str | None:
    for candidate in candidates:
        value = row.get(_normalize_header(candidate))
        if value is not None and value != "":
            return value
    return None


def _require(value: str | None, field_name: str) -> str:
    if value is None:
        raise ValueError(f"{field_name} is required")
    return value


def _parse_count(value: object) -> int | None:
    parsed = parse_number(value)
    if parsed is None:
        return None
    return int(parsed)


def _count(value: int | None) -> int:
    return value or 0


def _normalize_code(value: object) -> str | None:
    text = _clean_cell(value)
    if text is None:
        return None
    return re.sub(r"\.0$", "", text)


def _normalize_postal_code(value: object) -> str | None:
    text = _clean_cell(value)
    if text is None:
        return None
    return re.sub(r"\.0$", "", text)


def _sorted_unique(values: Iterable[str | None]) -> tuple[str, ...]:
    return tuple(sorted({value for value in values if value}))


def _normalize_header(value: object) -> str:
    text = str(value or "").strip().upper()
    text = text.replace("(", " ").replace(")", " ")
    text = re.sub(r"[^A-Z0-9]+", "_", text)
    return text.strip("_")


def _clean_cell(value: object) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    if text == "":
        return None

    return re.sub(r"\s+", " ", text)


def _clean_html_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()
