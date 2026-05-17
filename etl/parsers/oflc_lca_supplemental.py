from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

from etl.parsers.oflc_lca import (
    fingerprint_raw_row,
    normalize_city,
    normalize_state,
    parse_bool,
    parse_number,
    read_tabular_rows,
    sanitize_raw_row,
)


WORKSITE_FIELD_ALIASES = {
    "case_number": ["CASE_NUMBER", "CASE_NO", "CASE NO"],
    "worksite_sequence": [
        "WORKSITE_NUMBER",
        "WORKSITE_NUM",
        "WORKSITE_SEQUENCE",
        "WORKSITE_SEQ",
        "ITEM_NUMBER",
        "ITEM NO",
    ],
    "workers": [
        "WORKSITE_WORKERS",
        "WORKSITE WORKERS",
        "NO_OF_WORKERS",
        "NUMBER_OF_WORKERS",
        "TOTAL_WORKERS",
    ],
    "secondary_entity": [
        "SECONDARY_ENTITY",
        "SECONDARY ENTITY",
        "WORKSITE_SECONDARY_ENTITY",
    ],
    "secondary_entity_name": [
        "SECONDARY_ENTITY_BUSINESS_NAME",
        "SECONDARY ENTITY BUSINESS NAME",
        "SECONDARY_ENTITY_NAME",
    ],
    "worksite_city": [
        "WORKSITE_CITY",
        "WORKSITE CITY",
        "PLACE_OF_EMPLOYMENT_CITY",
    ],
    "worksite_county": [
        "WORKSITE_COUNTY",
        "WORKSITE COUNTY",
        "PLACE_OF_EMPLOYMENT_COUNTY",
    ],
    "worksite_state": [
        "WORKSITE_STATE",
        "WORKSITE STATE",
        "PLACE_OF_EMPLOYMENT_STATE",
    ],
    "worksite_postal_code": [
        "WORKSITE_POSTAL_CODE",
        "WORKSITE POSTAL CODE",
        "WORKSITE_ZIP",
        "WORKSITE ZIP",
    ],
}

APPENDIX_A_FIELD_ALIASES = {
    "case_number": ["CASE_NUMBER", "CASE_NO", "CASE NO"],
    "exempt_worker_count": [
        "APPX_A_NO_OF_EXEMPT_WORKERS",
        "APPX A NO OF EXEMPT WORKERS",
        "NO_OF_EXEMPT_WORKERS",
        "NUMBER_OF_EXEMPT_WORKERS",
    ],
    "h1b_dependent": [
        "H1B_DEPENDENT",
        "H_1B_DEPENDENT",
        "H-1B_DEPENDENT",
    ],
    "willful_violator": [
        "WILLFUL_VIOLATOR",
        "WILLFUL VIOLATOR",
    ],
}


@dataclass(frozen=True)
class NormalizedLcaWorksiteRecord:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    case_number: str | None
    fiscal_year: int
    worksite_sequence: int | None
    workers: int | None
    secondary_entity: bool | None
    secondary_entity_name: str | None
    worksite_city: str | None
    worksite_county: str | None
    worksite_state: str | None
    worksite_postal_code: str | None
    raw_record_json: dict[str, str | None]


@dataclass(frozen=True)
class NormalizedLcaAppendixARecord:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    case_number: str | None
    fiscal_year: int
    exempt_worker_count: int | None
    h1b_dependent: bool | None
    willful_violator: bool | None
    raw_record_json: dict[str, str | None]


def iter_lca_worksite_records(
    path: Path | str,
    *,
    source_file_id: str,
    fiscal_year: int,
) -> Iterable[NormalizedLcaWorksiteRecord]:
    for row_number, raw_row in enumerate(read_tabular_rows(path), start=1):
        yield normalize_lca_worksite_row(
            raw_row,
            source_file_id=source_file_id,
            fiscal_year=fiscal_year,
            row_number=row_number,
        )


def iter_lca_appendix_a_records(
    path: Path | str,
    *,
    source_file_id: str,
    fiscal_year: int,
) -> Iterable[NormalizedLcaAppendixARecord]:
    for row_number, raw_row in enumerate(read_tabular_rows(path), start=1):
        yield normalize_lca_appendix_a_row(
            raw_row,
            source_file_id=source_file_id,
            fiscal_year=fiscal_year,
            row_number=row_number,
        )


def normalize_lca_worksite_row(
    raw_row: dict[str, object],
    *,
    source_file_id: str,
    fiscal_year: int,
    row_number: int = 1,
) -> NormalizedLcaWorksiteRecord:
    cleaned_row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
    sanitized_raw = _sanitize_supplemental_raw_row(cleaned_row)
    fingerprint = fingerprint_raw_row(sanitized_raw)

    case_number = _get(cleaned_row, WORKSITE_FIELD_ALIASES["case_number"])
    sequence = _parse_int(_get(cleaned_row, WORKSITE_FIELD_ALIASES["worksite_sequence"]))
    source_record_id = _source_record_id(case_number, sequence, row_number, fingerprint)

    return NormalizedLcaWorksiteRecord(
        source_file_id=source_file_id,
        source_record_id=source_record_id,
        source_record_fingerprint=fingerprint,
        case_number=case_number,
        fiscal_year=fiscal_year,
        worksite_sequence=sequence,
        workers=_parse_int(_get(cleaned_row, WORKSITE_FIELD_ALIASES["workers"])),
        secondary_entity=parse_bool(_get(cleaned_row, WORKSITE_FIELD_ALIASES["secondary_entity"])),
        secondary_entity_name=_get(cleaned_row, WORKSITE_FIELD_ALIASES["secondary_entity_name"]),
        worksite_city=normalize_city(_get(cleaned_row, WORKSITE_FIELD_ALIASES["worksite_city"])),
        worksite_county=normalize_city(_get(cleaned_row, WORKSITE_FIELD_ALIASES["worksite_county"])),
        worksite_state=normalize_state(_get(cleaned_row, WORKSITE_FIELD_ALIASES["worksite_state"])),
        worksite_postal_code=_get(cleaned_row, WORKSITE_FIELD_ALIASES["worksite_postal_code"]),
        raw_record_json=sanitized_raw,
    )


def normalize_lca_appendix_a_row(
    raw_row: dict[str, object],
    *,
    source_file_id: str,
    fiscal_year: int,
    row_number: int = 1,
) -> NormalizedLcaAppendixARecord:
    cleaned_row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
    sanitized_raw = _sanitize_supplemental_raw_row(cleaned_row)
    fingerprint = fingerprint_raw_row(sanitized_raw)
    case_number = _get(cleaned_row, APPENDIX_A_FIELD_ALIASES["case_number"])

    return NormalizedLcaAppendixARecord(
        source_file_id=source_file_id,
        source_record_id=_source_record_id(case_number, None, row_number, fingerprint),
        source_record_fingerprint=fingerprint,
        case_number=case_number,
        fiscal_year=fiscal_year,
        exempt_worker_count=_parse_int(
            _get(cleaned_row, APPENDIX_A_FIELD_ALIASES["exempt_worker_count"])
        ),
        h1b_dependent=parse_bool(_get(cleaned_row, APPENDIX_A_FIELD_ALIASES["h1b_dependent"])),
        willful_violator=parse_bool(
            _get(cleaned_row, APPENDIX_A_FIELD_ALIASES["willful_violator"])
        ),
        raw_record_json=sanitized_raw,
    )


def write_lca_worksite_jsonl(
    path: Path | str,
    records: Iterable[NormalizedLcaWorksiteRecord],
) -> int:
    return _write_dataclass_jsonl(path, records)


def write_lca_appendix_a_jsonl(
    path: Path | str,
    records: Iterable[NormalizedLcaAppendixARecord],
) -> int:
    return _write_dataclass_jsonl(path, records)


def _write_dataclass_jsonl(path: Path | str, records: Iterable[object]) -> int:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with output_path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(asdict(record), ensure_ascii=False, sort_keys=True))
            handle.write("\n")
            count += 1

    return count


def _sanitize_supplemental_raw_row(row: dict[str, str | None]) -> dict[str, str | None]:
    sanitized = sanitize_raw_row(row)
    return {
        key: value
        for key, value in sanitized.items()
        if not _looks_like_street_address_field(key)
    }


def _looks_like_street_address_field(key: str) -> bool:
    compact = re.sub(r"[^A-Z0-9]+", "", key.upper())
    return "ADDRESS" in compact or compact.endswith("ADDR1") or compact.endswith("ADDR2")


def _source_record_id(
    case_number: str | None,
    sequence: int | None,
    row_number: int,
    fingerprint: str,
) -> str:
    parts = [case_number or f"row-{row_number}"]
    parts.append(str(sequence) if sequence is not None else fingerprint[:12])
    return ":".join(parts)


def _parse_int(value: object) -> int | None:
    number = parse_number(value)
    if number is None:
        return None
    return int(number)


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
