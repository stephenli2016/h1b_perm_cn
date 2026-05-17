from __future__ import annotations

import csv
import hashlib
import json
import re
import zipfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree


SECTOR_TITLES: dict[str, str] = {
    "11": "Agriculture, Forestry, Fishing and Hunting",
    "21": "Mining, Quarrying, and Oil and Gas Extraction",
    "22": "Utilities",
    "23": "Construction",
    "31-33": "Manufacturing",
    "42": "Wholesale Trade",
    "44-45": "Retail Trade",
    "48-49": "Transportation and Warehousing",
    "51": "Information",
    "52": "Finance and Insurance",
    "53": "Real Estate and Rental and Leasing",
    "54": "Professional, Scientific, and Technical Services",
    "55": "Management of Companies and Enterprises",
    "56": "Administrative and Support and Waste Management and Remediation Services",
    "61": "Educational Services",
    "62": "Health Care and Social Assistance",
    "71": "Arts, Entertainment, and Recreation",
    "72": "Accommodation and Food Services",
    "81": "Other Services (except Public Administration)",
    "92": "Public Administration",
}


@dataclass(frozen=True)
class NormalizedNaicsIndustry:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    release_year: int
    naics_code: str
    industry_title: str
    classification_level: str
    sector_code: str | None
    sector_title: str | None
    change_indicator: str | None
    trilateral: bool | None
    raw_record_json: dict[str, str | None]


def iter_naics_industry_records(
    path: Path | str,
    *,
    source_file_id: str,
    release_year: int,
) -> Iterable[NormalizedNaicsIndustry]:
    sector_titles = dict(SECTOR_TITLES)

    for raw_row in _read_naics_rows(path):
        row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
        naics_code = _require(_get(row, ["2022_NAICS_CODE", "NAICS_CODE"]), "naics_code")
        if not re.fullmatch(r"\d{2}(?:-\d{2})?|\d{3,6}", naics_code):
            continue

        raw_title = _require(
            _get(row, ["2022_NAICS_TITLE", "NAICS_TITLE", "TITLE"]),
            "industry_title",
        )
        industry_title, trilateral = _clean_naics_title(raw_title)
        sector_code = _sector_code(naics_code)
        sector_title = sector_titles.get(sector_code) if sector_code else None
        if _classification_level(naics_code) == "sector":
            sector_titles[naics_code] = industry_title
            sector_title = industry_title

        sanitized_raw = {
            "CHANGE_INDICATOR": _get(row, ["CHANGE_INDICATOR"]),
            "NAICS_CODE": naics_code,
            "NAICS_TITLE": raw_title,
        }
        fingerprint = _fingerprint(sanitized_raw)
        yield NormalizedNaicsIndustry(
            source_file_id=source_file_id,
            source_record_id=naics_code,
            source_record_fingerprint=fingerprint,
            release_year=release_year,
            naics_code=naics_code,
            industry_title=industry_title,
            classification_level=_classification_level(naics_code),
            sector_code=sector_code,
            sector_title=sector_title,
            change_indicator=_get(row, ["CHANGE_INDICATOR"]),
            trilateral=trilateral,
            raw_record_json=sanitized_raw,
        )


def write_naics_industry_jsonl(
    path: Path | str,
    records: Iterable[NormalizedNaicsIndustry],
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


def _read_naics_rows(path: Path | str) -> Iterable[dict[str, object]]:
    input_path = Path(path)
    suffix = input_path.suffix.lower()

    if suffix == ".csv":
        yield from _read_delimited_rows(input_path, delimiter=",")
        return

    if suffix in {".tsv", ".txt"}:
        yield from _read_delimited_rows(input_path, delimiter="\t")
        return

    if suffix == ".xlsx":
        yield from _read_naics_xlsx_rows(input_path)
        return

    raise ValueError(f"unsupported NAICS input file type: {input_path.suffix}")


def _read_delimited_rows(path: Path, *, delimiter: str) -> Iterable[dict[str, object]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=delimiter)
        for row in reader:
            yield dict(row)


def _read_naics_xlsx_rows(path: Path) -> Iterable[dict[str, object]]:
    with zipfile.ZipFile(path) as archive:
        shared_strings = _read_shared_strings(archive)
        worksheet_name = _first_worksheet_name(archive)
        headers: list[str] | None = None

        with archive.open(worksheet_name) as worksheet:
            for _, row_element in ElementTree.iterparse(worksheet, events=("end",)):
                if _local_name(row_element.tag) != "row":
                    continue

                values_by_index = _xlsx_row_values(row_element, shared_strings)
                values = [
                    values_by_index.get(index)
                    for index in range(max(values_by_index.keys(), default=-1) + 1)
                ]
                cleaned_values = [_clean_cell(value) for value in values]
                row_element.clear()

                if not any(cleaned_values):
                    continue

                normalized_cells = {_normalize_header(value) for value in cleaned_values if value}
                if "2022_NAICS_CODE" in normalized_cells and "2022_NAICS_TITLE" in normalized_cells:
                    headers = [value or "" for value in cleaned_values]
                    continue

                if headers is None:
                    continue

                yield {
                    header: values[index] if index < len(values) else None
                    for index, header in enumerate(headers)
                    if header
                }


def _read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
    values: list[str] = []
    for item in root.findall("{*}si"):
        text_parts = [node.text or "" for node in item.findall(".//{*}t")]
        values.append("".join(text_parts))
    return values


def _first_worksheet_name(archive: zipfile.ZipFile) -> str:
    for name in archive.namelist():
        if name.startswith("xl/worksheets/sheet") and name.endswith(".xml"):
            return name
    raise ValueError("xlsx file has no worksheet XML")


def _xlsx_row_values(
    row_element: ElementTree.Element,
    shared_strings: list[str],
) -> dict[int, str | None]:
    values: dict[int, str | None] = {}
    for cell in row_element:
        if _local_name(cell.tag) != "c":
            continue
        reference = cell.attrib.get("r", "")
        values[_column_index(reference)] = _xlsx_cell_value(cell, shared_strings)
    return values


def _xlsx_cell_value(cell: ElementTree.Element, shared_strings: list[str]) -> str | None:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        inline_text = cell.find(".//{*}t")
        return inline_text.text if inline_text is not None else None

    value_node = cell.find("{*}v")
    if value_node is None or value_node.text is None:
        return None

    if cell_type == "s":
        return shared_strings[int(value_node.text)]

    return value_node.text


def _column_index(reference: str) -> int:
    letters = re.sub(r"[^A-Z]", "", reference.upper())
    if not letters:
        return 0

    index = 0
    for letter in letters:
        index = index * 26 + (ord(letter) - ord("A") + 1)
    return index - 1


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _clean_naics_title(value: str) -> tuple[str, bool | None]:
    title = _clean_cell(value) or ""
    trilateral = title.endswith("T")
    if trilateral:
        title = title[:-1].strip()
    return title, trilateral or None


def _classification_level(naics_code: str) -> str:
    if "-" in naics_code or len(naics_code) == 2:
        return "sector"
    if len(naics_code) == 3:
        return "subsector"
    if len(naics_code) == 4:
        return "industry_group"
    if len(naics_code) == 5:
        return "naics_industry"
    return "national_industry"


def _sector_code(naics_code: str) -> str | None:
    if "-" in naics_code:
        return naics_code
    prefix = naics_code[:2]
    if prefix in {"31", "32", "33"}:
        return "31-33"
    if prefix in {"44", "45"}:
        return "44-45"
    if prefix in {"48", "49"}:
        return "48-49"
    return prefix if len(prefix) == 2 else None


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
