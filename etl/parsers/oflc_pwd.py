from __future__ import annotations

import csv
import json
import re
import zipfile
from dataclasses import asdict, dataclass
from io import TextIOWrapper
from pathlib import Path
from typing import Iterable

from etl.parsers.oflc_lca import (
    fingerprint_raw_row,
    normalize_city,
    normalize_state,
    normalize_wage_unit,
    parse_number,
    read_tabular_rows,
    sanitize_raw_row,
)


FIELD_ALIASES = {
    "source_record_id": [
        "SOURCE_RECORD_ID",
        "SOURCE RECORD ID",
        "PWD_NUMBER",
        "CASE_NUMBER",
    ],
    "data_series": ["DATA_SERIES", "DATA SERIES", "SERIES", "WAGE_SOURCE"],
    "effective_year": [
        "EFFECTIVE_YEAR",
        "EFFECTIVE YEAR",
        "WAGE_YEAR",
        "YEAR",
        "FISCAL_YEAR",
    ],
    "soc_code": ["SOC_CODE", "SOC CODE", "OCC_CODE", "OCC CODE"],
    "soc_title": [
        "SOC_TITLE",
        "SOC TITLE",
        "OCC_TITLE",
        "OCCUPATION_TITLE",
        "OCCUPATION TITLE",
    ],
    "area_name": ["AREA_NAME", "AREA NAME", "OES_AREA_NAME"],
    "city": ["CITY", "AREA_CITY", "PRIMARY_CITY"],
    "state": ["STATE", "STATE_ABBREVIATION", "AREA_STATE"],
    "wage_level_1": [
        "WAGE_LEVEL_1",
        "WAGE LEVEL 1",
        "LEVEL_1_WAGE",
        "LEVEL 1 WAGE",
        "LEVEL1",
    ],
    "wage_level_2": [
        "WAGE_LEVEL_2",
        "WAGE LEVEL 2",
        "LEVEL_2_WAGE",
        "LEVEL 2 WAGE",
        "LEVEL2",
    ],
    "wage_level_3": [
        "WAGE_LEVEL_3",
        "WAGE LEVEL 3",
        "LEVEL_3_WAGE",
        "LEVEL 3 WAGE",
        "LEVEL3",
    ],
    "wage_level_4": [
        "WAGE_LEVEL_4",
        "WAGE LEVEL 4",
        "LEVEL_4_WAGE",
        "LEVEL 4 WAGE",
        "LEVEL4",
    ],
    "wage_unit": ["WAGE_UNIT", "WAGE UNIT", "UNIT", "RATE_TYPE"],
}


@dataclass(frozen=True)
class NormalizedPwdRecord:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    data_series: str
    effective_year: int
    soc_code: str
    soc_title: str | None
    area_name: str | None
    city: str | None
    state: str | None
    wage_level_1: float | None
    wage_level_2: float | None
    wage_level_3: float | None
    wage_level_4: float | None
    wage_unit: str | None
    raw_record_json: dict[str, str | None]


@dataclass(frozen=True)
class PwdParseResult:
    source_file_id: str
    input_path: str
    records_seen: int
    records_inserted: int
    duplicate_records: int
    records: tuple[NormalizedPwdRecord, ...]


@dataclass(frozen=True)
class PrevailingWageLookup:
    status: str
    record: NormalizedPwdRecord | None
    match_scope: str | None
    message: str


@dataclass(frozen=True)
class WageLevelMatch:
    band: str
    lower_level: int | None
    lower_amount: float | None
    next_level: int | None
    next_amount: float | None
    message: str


def parse_pwd_file(
    path: Path | str,
    *,
    source_file_id: str,
    effective_year: int | None = None,
    data_series: str | None = None,
) -> PwdParseResult:
    input_path = Path(path)
    raw_rows = list(read_pwd_rows(input_path))
    seen_fingerprints: set[str] = set()
    normalized_records: list[NormalizedPwdRecord] = []
    duplicates = 0

    for raw_row in raw_rows:
        record = normalize_pwd_row(
            raw_row,
            source_file_id=source_file_id,
            fallback_effective_year=effective_year,
            fallback_data_series=data_series,
        )
        if record.source_record_fingerprint in seen_fingerprints:
            duplicates += 1
            continue

        seen_fingerprints.add(record.source_record_fingerprint)
        normalized_records.append(record)

    return PwdParseResult(
        source_file_id=source_file_id,
        input_path=str(input_path),
        records_seen=len(raw_rows),
        records_inserted=len(normalized_records),
        duplicate_records=duplicates,
        records=tuple(normalized_records),
    )


def normalize_pwd_row(
    raw_row: dict[str, object],
    *,
    source_file_id: str,
    fallback_effective_year: int | None = None,
    fallback_data_series: str | None = None,
) -> NormalizedPwdRecord:
    cleaned_row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
    sanitized_raw = sanitize_raw_row(cleaned_row)
    fingerprint = fingerprint_raw_row(sanitized_raw)

    effective_year = resolve_effective_year(
        _get(cleaned_row, FIELD_ALIASES["effective_year"]),
        fallback_effective_year=fallback_effective_year,
    )
    data_series = (
        _get(cleaned_row, FIELD_ALIASES["data_series"])
        or fallback_data_series
        or "OFLC wage data"
    )
    source_record_id = _get(cleaned_row, FIELD_ALIASES["source_record_id"])
    soc_code = _require(_get(cleaned_row, FIELD_ALIASES["soc_code"]), "soc_code")

    return NormalizedPwdRecord(
        source_file_id=source_file_id,
        source_record_id=source_record_id
        or f"{source_file_id}:{soc_code}:{effective_year}:{fingerprint[:12]}",
        source_record_fingerprint=fingerprint,
        data_series=data_series,
        effective_year=effective_year,
        soc_code=soc_code,
        soc_title=_get(cleaned_row, FIELD_ALIASES["soc_title"]),
        area_name=_get(cleaned_row, FIELD_ALIASES["area_name"]),
        city=normalize_city(_get(cleaned_row, FIELD_ALIASES["city"])),
        state=normalize_state(_get(cleaned_row, FIELD_ALIASES["state"])),
        wage_level_1=parse_number(_get(cleaned_row, FIELD_ALIASES["wage_level_1"])),
        wage_level_2=parse_number(_get(cleaned_row, FIELD_ALIASES["wage_level_2"])),
        wage_level_3=parse_number(_get(cleaned_row, FIELD_ALIASES["wage_level_3"])),
        wage_level_4=parse_number(_get(cleaned_row, FIELD_ALIASES["wage_level_4"])),
        wage_unit=normalize_wage_unit(_get(cleaned_row, FIELD_ALIASES["wage_unit"])),
        raw_record_json=sanitized_raw,
    )


def lookup_prevailing_wage(
    records: Iterable[NormalizedPwdRecord],
    *,
    soc_code: str,
    state: str,
    city: str | None = None,
    effective_year: int | None = None,
) -> PrevailingWageLookup:
    state_upper = state.upper()
    city_key = _location_key(city)
    candidates = [
        record
        for record in records
        if record.soc_code == soc_code
        and (record.state or "").upper() == state_upper
        and (effective_year is None or record.effective_year == effective_year)
    ]
    candidates.sort(key=lambda record: record.effective_year, reverse=True)

    if not candidates:
        return PrevailingWageLookup(
            status="not_found",
            record=None,
            match_scope=None,
            message="No wage record matched the requested SOC, state, and year.",
        )

    if city_key:
        exact_city = [
            record
            for record in candidates
            if _location_key(record.city) == city_key
        ]
        if exact_city:
            return PrevailingWageLookup(
                status="matched",
                record=exact_city[0],
                match_scope="city_state",
                message="Matched by exact city, state, SOC, and year.",
            )

        area_matches = [
            record
            for record in candidates
            if city_key in _location_key(record.area_name)
        ]
        if area_matches:
            return PrevailingWageLookup(
                status="matched",
                record=area_matches[0],
                match_scope="area_name",
                message="Matched by SOC, state, year, and area name containing the requested city.",
            )

        state_level = [record for record in candidates if not record.city]
        if state_level:
            return PrevailingWageLookup(
                status="fallback",
                record=state_level[0],
                match_scope="state",
                message="No city or area match was found; returned a state-level wage record.",
            )

        return PrevailingWageLookup(
            status="not_found",
            record=None,
            match_scope=None,
            message="No city, area, or state-level wage record matched the requested location.",
        )

    return PrevailingWageLookup(
        status="matched",
        record=candidates[0],
        match_scope="state",
        message="Matched by SOC, state, and year.",
    )


def match_wage_level(record: NormalizedPwdRecord, wage_amount: float) -> WageLevelMatch:
    levels = [
        (1, record.wage_level_1),
        (2, record.wage_level_2),
        (3, record.wage_level_3),
        (4, record.wage_level_4),
    ]
    populated_levels = [(level, value) for level, value in levels if value is not None]

    if not populated_levels:
        return WageLevelMatch(
            band="unknown",
            lower_level=None,
            lower_amount=None,
            next_level=None,
            next_amount=None,
            message="No wage level amounts are available for this record.",
        )

    first_level, first_amount = populated_levels[0]
    if wage_amount < first_amount:
        return WageLevelMatch(
            band="below_level_1",
            lower_level=None,
            lower_amount=None,
            next_level=first_level,
            next_amount=first_amount,
            message="The wage is below the first available wage level amount.",
        )

    for index, (level, amount) in enumerate(populated_levels):
        next_pair = populated_levels[index + 1] if index + 1 < len(populated_levels) else None
        if next_pair is None:
            return WageLevelMatch(
                band=f"level_{level}_or_above",
                lower_level=level,
                lower_amount=amount,
                next_level=None,
                next_amount=None,
                message="The wage is at or above the highest available wage level amount.",
            )

        next_level, next_amount = next_pair
        if wage_amount < next_amount:
            return WageLevelMatch(
                band=f"level_{level}_to_{next_level}",
                lower_level=level,
                lower_amount=amount,
                next_level=next_level,
                next_amount=next_amount,
                message="The wage falls between two available wage level amounts.",
            )

    raise AssertionError("unreachable wage level matching state")


def read_pwd_rows(path: Path | str) -> Iterable[dict[str, object]]:
    input_path = Path(path)
    if input_path.suffix.lower() != ".zip":
        yield from read_tabular_rows(input_path)
        return

    with zipfile.ZipFile(input_path) as archive:
        csv_name = _first_csv_member(archive)
        with archive.open(csv_name) as binary_handle:
            text_handle = TextIOWrapper(binary_handle, encoding="utf-8-sig", newline="")
            reader = csv.DictReader(text_handle)
            for row in reader:
                yield dict(row)


def write_pwd_jsonl(path: Path | str, records: Iterable[NormalizedPwdRecord]) -> int:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with output_path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(asdict(record), ensure_ascii=False, sort_keys=True))
            handle.write("\n")
            count += 1

    return count


def resolve_effective_year(
    value: object,
    *,
    fallback_effective_year: int | None = None,
) -> int:
    text = _clean_cell(value)
    if text:
        year_matches = re.findall(r"\d{4}", text)
        if year_matches:
            return int(year_matches[-1])

    if fallback_effective_year is not None:
        return fallback_effective_year

    raise ValueError("effective year is required when it cannot be inferred from the row")


def _first_csv_member(archive: zipfile.ZipFile) -> str:
    for name in archive.namelist():
        if name.lower().endswith(".csv"):
            return name
    raise ValueError("zip file does not contain a CSV wage data file")


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


def _location_key(value: str | None) -> str:
    if value is None:
        return ""
    return re.sub(r"[^a-z0-9]+", "", value.lower())
