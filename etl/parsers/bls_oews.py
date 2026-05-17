from __future__ import annotations

import csv
import hashlib
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class NormalizedBlsOewsOccupation:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    release_year: int
    occupation_code: str
    occupation_name: str
    display_level: int | None
    selectable: bool | None
    sort_sequence: int | None
    raw_record_json: dict[str, str | None]


@dataclass(frozen=True)
class NormalizedBlsOewsArea:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    release_year: int
    area_code: str
    area_name: str
    area_type_code: str | None
    display_level: int | None
    selectable: bool | None
    sort_sequence: int | None
    raw_record_json: dict[str, str | None]


def iter_bls_oews_occupation_records(
    path: Path | str,
    *,
    source_file_id: str,
    release_year: int,
) -> Iterable[NormalizedBlsOewsOccupation]:
    for raw_row in _read_tsv_rows(path):
        row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
        occupation_code = _require(_get(row, ["OCCUPATION_CODE", "OCC_CODE"]), "occupation_code")
        occupation_name = _require(
            _get(row, ["OCCUPATION_TEXT", "OCCUPATION_NAME", "OCC_TITLE"]),
            "occupation_name",
        )
        fingerprint = _fingerprint(row)
        yield NormalizedBlsOewsOccupation(
            source_file_id=source_file_id,
            source_record_id=occupation_code,
            source_record_fingerprint=fingerprint,
            release_year=release_year,
            occupation_code=occupation_code,
            occupation_name=occupation_name,
            display_level=_parse_int(_get(row, ["DISPLAY_LEVEL"])),
            selectable=_parse_bool(_get(row, ["SELECTABLE"])),
            sort_sequence=_parse_int(_get(row, ["SORT_SEQUENCE", "SORT_SEQUENCE_CODE"])),
            raw_record_json=row,
        )


def iter_bls_oews_area_records(
    path: Path | str,
    *,
    source_file_id: str,
    release_year: int,
) -> Iterable[NormalizedBlsOewsArea]:
    for raw_row in _read_tsv_rows(path):
        row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
        area_code = _require(_get(row, ["AREA_CODE", "AREA"]), "area_code")
        area_name = _require(_get(row, ["AREA_TEXT", "AREA_NAME"]), "area_name")
        fingerprint = _fingerprint(row)
        yield NormalizedBlsOewsArea(
            source_file_id=source_file_id,
            source_record_id=area_code,
            source_record_fingerprint=fingerprint,
            release_year=release_year,
            area_code=area_code,
            area_name=area_name,
            area_type_code=_get(row, ["AREA_TYPE_CODE", "AREA_TYPE"]),
            display_level=_parse_int(_get(row, ["DISPLAY_LEVEL"])),
            selectable=_parse_bool(_get(row, ["SELECTABLE"])),
            sort_sequence=_parse_int(_get(row, ["SORT_SEQUENCE", "SORT_SEQUENCE_CODE"])),
            raw_record_json=row,
        )


def write_bls_oews_occupation_jsonl(
    path: Path | str,
    records: Iterable[NormalizedBlsOewsOccupation],
) -> int:
    return _write_dataclass_jsonl(path, records)


def write_bls_oews_area_jsonl(
    path: Path | str,
    records: Iterable[NormalizedBlsOewsArea],
) -> int:
    return _write_dataclass_jsonl(path, records)


def _read_tsv_rows(path: Path | str) -> Iterable[dict[str, str | None]]:
    input_path = Path(path)
    with input_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        for row in reader:
            yield dict(row)


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


def _fingerprint(row: dict[str, str | None]) -> str:
    payload = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


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


def _parse_int(value: object) -> int | None:
    text = _clean_cell(value)
    if text is None:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def _parse_bool(value: object) -> bool | None:
    text = _clean_cell(value)
    if text is None:
        return None
    normalized = text.upper()
    if normalized in {"T", "TRUE", "Y", "YES", "1"}:
        return True
    if normalized in {"F", "FALSE", "N", "NO", "0"}:
        return False
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
