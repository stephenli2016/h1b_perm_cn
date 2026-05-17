from __future__ import annotations

import csv
import hashlib
import json
import re
import zipfile
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree


FIELD_ALIASES = {
    "case_number": ["CASE_NUMBER", "CASE_NO", "CASE NO", "CASE"],
    "case_status": ["CASE_STATUS", "CASE STATUS", "STATUS"],
    "visa_class": ["VISA_CLASS", "VISA CLASS", "CLASS_OF_ADMISSION"],
    "employer_name": ["EMPLOYER_NAME", "EMPLOYER NAME", "EMPLOYER_BUSINESS_NAME"],
    "fiscal_year": ["FISCAL_YEAR", "FISCAL YEAR"],
    "soc_code": ["SOC_CODE", "SOC CODE", "SOC"],
    "soc_title": ["SOC_TITLE", "SOC TITLE", "SOC_NAME"],
    "job_title": ["JOB_TITLE", "JOB TITLE"],
    "worksite_city": ["WORKSITE_CITY", "WORKSITE CITY", "PLACE_OF_EMPLOYMENT_CITY"],
    "worksite_state": ["WORKSITE_STATE", "WORKSITE STATE", "PLACE_OF_EMPLOYMENT_STATE"],
    "worksite_postal_code": [
        "WORKSITE_POSTAL_CODE",
        "WORKSITE ZIP",
        "WORKSITE_ZIP",
        "WORKSITE_POSTAL",
        "PLACE_OF_EMPLOYMENT_POSTAL_CODE",
    ],
    "wage_rate_of_pay_from": [
        "WAGE_RATE_OF_PAY_FROM",
        "WAGE RATE OF PAY FROM",
        "WAGE_RATE_OF_PAY",
        "WAGE OFFER FROM",
    ],
    "wage_rate_of_pay_to": [
        "WAGE_RATE_OF_PAY_TO",
        "WAGE RATE OF PAY TO",
        "WAGE OFFER TO",
    ],
    "wage_unit": [
        "WAGE_UNIT_OF_PAY",
        "WAGE UNIT OF PAY",
        "WAGE_UNIT",
        "WAGE UNIT",
    ],
    "prevailing_wage": ["PREVAILING_WAGE", "PREVAILING WAGE", "PW_WAGE"],
    "prevailing_wage_unit": [
        "PW_UNIT_OF_PAY",
        "PW UNIT OF PAY",
        "PREVAILING_WAGE_UNIT",
        "PW_UNIT",
    ],
    "wage_level": [
        "WAGE_LEVEL",
        "WAGE LEVEL",
        "PW_WAGE_LEVEL",
        "PW WAGE LEVEL",
        "PREVAILING_WAGE_LEVEL",
    ],
    "full_time": ["FULL_TIME_POSITION", "FULL TIME POSITION", "FULL_TIME"],
    "received_date": ["RECEIVED_DATE", "RECEIVED DATE"],
    "decision_date": ["DECISION_DATE", "DECISION DATE"],
}

PII_KEY_PATTERNS = (
    "ALIEN",
    "ATTORNEY",
    "ATTY",
    "BENEFICIARY",
    "CONTACT",
    "DECLPREP",
    "EMAIL",
    "FEIN",
    "FOREIGNWORKER",
    "PHONE",
    "POC",
    "PREPARER",
    "SSN",
    "TAXID",
    "WORKER",
)

ANNUALIZATION_FACTORS = {
    "YEAR": 1.0,
    "ANNUAL": 1.0,
    "MONTH": 12.0,
    "MON": 12.0,
    "BIWEEKLY": 26.0,
    "BI-WEEKLY": 26.0,
    "WEEK": 52.0,
    "WK": 52.0,
    "DAY": 260.0,
    "HOUR": 2080.0,
    "HR": 2080.0,
}


@dataclass(frozen=True)
class NormalizedLcaRecord:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    case_number: str | None
    case_status: str | None
    visa_class: str | None
    raw_employer_name: str | None
    normalized_employer_name: str | None
    fiscal_year: int
    soc_code: str | None
    soc_title: str | None
    job_title: str | None
    worksite_city: str | None
    worksite_state: str | None
    worksite_postal_code: str | None
    wage_rate_of_pay_from: float | None
    wage_rate_of_pay_to: float | None
    wage_unit: str | None
    annualized_wage_from: float | None
    annualized_wage_to: float | None
    prevailing_wage: float | None
    prevailing_wage_unit: str | None
    annualized_prevailing_wage: float | None
    wage_level: str | None
    full_time: bool | None
    received_date: str | None
    decision_date: str | None
    raw_record_json: dict[str, str | None]


@dataclass(frozen=True)
class LcaParseResult:
    source_file_id: str
    input_path: str
    records_seen: int
    records_inserted: int
    duplicate_records: int
    records: tuple[NormalizedLcaRecord, ...]


def parse_lca_file(
    path: Path | str,
    *,
    source_file_id: str,
    fiscal_year: int | None = None,
) -> LcaParseResult:
    input_path = Path(path)
    seen_fingerprints: set[str] = set()
    normalized_records: list[NormalizedLcaRecord] = []
    duplicates = 0
    records_seen = 0

    for raw_row in read_tabular_rows(input_path):
        records_seen += 1
        record = normalize_lca_row(
            raw_row,
            source_file_id=source_file_id,
            fallback_fiscal_year=fiscal_year,
        )
        if record.source_record_fingerprint in seen_fingerprints:
            duplicates += 1
            continue

        seen_fingerprints.add(record.source_record_fingerprint)
        normalized_records.append(record)

    return LcaParseResult(
        source_file_id=source_file_id,
        input_path=str(input_path),
        records_seen=records_seen,
        records_inserted=len(normalized_records),
        duplicate_records=duplicates,
        records=tuple(normalized_records),
    )


def normalize_lca_row(
    raw_row: dict[str, object],
    *,
    source_file_id: str,
    fallback_fiscal_year: int | None = None,
) -> NormalizedLcaRecord:
    cleaned_row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
    sanitized_raw = sanitize_raw_row(cleaned_row)
    fingerprint = fingerprint_raw_row(sanitized_raw)

    case_number = _get(cleaned_row, FIELD_ALIASES["case_number"])
    employer_name = _get(cleaned_row, FIELD_ALIASES["employer_name"])
    wage_from = parse_number(_get(cleaned_row, FIELD_ALIASES["wage_rate_of_pay_from"]))
    wage_to = parse_number(_get(cleaned_row, FIELD_ALIASES["wage_rate_of_pay_to"]))
    wage_unit = normalize_wage_unit(_get(cleaned_row, FIELD_ALIASES["wage_unit"]))
    prevailing_wage = parse_number(_get(cleaned_row, FIELD_ALIASES["prevailing_wage"]))
    prevailing_wage_unit = normalize_wage_unit(_get(cleaned_row, FIELD_ALIASES["prevailing_wage_unit"]))
    received_date = parse_date(_get(cleaned_row, FIELD_ALIASES["received_date"]))
    decision_date = parse_date(_get(cleaned_row, FIELD_ALIASES["decision_date"]))

    return NormalizedLcaRecord(
        source_file_id=source_file_id,
        source_record_id=case_number or fingerprint,
        source_record_fingerprint=fingerprint,
        case_number=case_number,
        case_status=_get(cleaned_row, FIELD_ALIASES["case_status"]),
        visa_class=_get(cleaned_row, FIELD_ALIASES["visa_class"]),
        raw_employer_name=employer_name,
        normalized_employer_name=normalize_employer_name(employer_name),
        fiscal_year=resolve_fiscal_year(
            _get(cleaned_row, FIELD_ALIASES["fiscal_year"]),
            fallback_fiscal_year=fallback_fiscal_year,
            decision_date=decision_date,
        ),
        soc_code=_get(cleaned_row, FIELD_ALIASES["soc_code"]),
        soc_title=_get(cleaned_row, FIELD_ALIASES["soc_title"]),
        job_title=_get(cleaned_row, FIELD_ALIASES["job_title"]),
        worksite_city=normalize_city(_get(cleaned_row, FIELD_ALIASES["worksite_city"])),
        worksite_state=normalize_state(_get(cleaned_row, FIELD_ALIASES["worksite_state"])),
        worksite_postal_code=_get(cleaned_row, FIELD_ALIASES["worksite_postal_code"]),
        wage_rate_of_pay_from=wage_from,
        wage_rate_of_pay_to=wage_to,
        wage_unit=wage_unit,
        annualized_wage_from=annualize_wage(wage_from, wage_unit),
        annualized_wage_to=annualize_wage(wage_to, wage_unit),
        prevailing_wage=prevailing_wage,
        prevailing_wage_unit=prevailing_wage_unit,
        annualized_prevailing_wage=annualize_wage(prevailing_wage, prevailing_wage_unit),
        wage_level=_get(cleaned_row, FIELD_ALIASES["wage_level"]),
        full_time=parse_bool(_get(cleaned_row, FIELD_ALIASES["full_time"])),
        received_date=received_date,
        decision_date=decision_date,
        raw_record_json=sanitized_raw,
    )


def read_tabular_rows(path: Path | str) -> Iterable[dict[str, object]]:
    input_path = Path(path)
    suffix = input_path.suffix.lower()

    if suffix == ".csv":
        yield from _read_csv_rows(input_path)
        return

    if suffix == ".xlsx":
        yield from _read_xlsx_rows(input_path)
        return

    raise ValueError(f"unsupported tabular input file type: {input_path.suffix}")


def write_lca_jsonl(path: Path | str, records: Iterable[NormalizedLcaRecord]) -> int:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with output_path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(asdict(record), ensure_ascii=False, sort_keys=True))
            handle.write("\n")
            count += 1

    return count


def fingerprint_raw_row(raw_row: dict[str, str | None]) -> str:
    payload = json.dumps(raw_row, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def sanitize_raw_row(raw_row: dict[str, str | None]) -> dict[str, str | None]:
    sanitized: dict[str, str | None] = {}

    for key, value in raw_row.items():
        tokens = {token for token in re.split(r"[^A-Z0-9]+", key.upper()) if token}
        compact_key = re.sub(r"[^A-Z0-9]+", "", key.upper())
        if "SSN" in tokens:
            continue
        if any(pattern in compact_key for pattern in PII_KEY_PATTERNS if pattern != "SSN"):
            continue
        if ("ADDRESS" in compact_key or "ADDR" in compact_key) and "WORKSITE" not in compact_key:
            continue
        sanitized[key] = value

    return sanitized


def annualize_wage(value: float | None, wage_unit: str | None) -> float | None:
    if value is None or wage_unit is None:
        return None

    factor = ANNUALIZATION_FACTORS.get(_compact_unit(wage_unit))
    if factor is None:
        return None

    return round(value * factor, 2)


def parse_number(value: object) -> float | None:
    text = _clean_cell(value)
    if text is None:
        return None

    normalized = text.replace("$", "").replace(",", "").strip()
    if normalized in {"", "-", "--"}:
        return None

    try:
        return float(normalized)
    except ValueError:
        return None


def parse_bool(value: object) -> bool | None:
    text = _clean_cell(value)
    if text is None:
        return None

    normalized = text.strip().upper()
    if normalized in {"Y", "YES", "TRUE", "1", "FULL TIME"}:
        return True
    if normalized in {"N", "NO", "FALSE", "0", "PART TIME"}:
        return False
    return None


def parse_date(value: object) -> str | None:
    text = _clean_cell(value)
    if text is None:
        return None

    if re.fullmatch(r"\d+(\.0)?", text):
        serial = int(float(text))
        if serial > 10000:
            return (date(1899, 12, 30) + timedelta(days=serial)).isoformat()

    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y/%m/%d"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            pass

    return None


def resolve_fiscal_year(
    fiscal_year_value: object,
    *,
    fallback_fiscal_year: int | None,
    decision_date: str | None,
) -> int:
    parsed_year = parse_number(fiscal_year_value)
    if parsed_year is not None:
        return int(parsed_year)

    if fallback_fiscal_year is not None:
        return fallback_fiscal_year

    if decision_date:
        parsed_date = datetime.strptime(decision_date, "%Y-%m-%d").date()
        return parsed_date.year + 1 if parsed_date.month >= 10 else parsed_date.year

    raise ValueError("fiscal year is required when it cannot be inferred from the row")


def normalize_employer_name(value: object) -> str | None:
    text = _clean_cell(value)
    if text is None:
        return None

    normalized = re.sub(r"[^\w\s&-]", " ", text.upper())
    normalized = re.sub(
        r"\b(L\.?L\.?C\.?|INC\.?|INCORPORATED|CORP\.?|CORPORATION|CO\.?|COMPANY|LTD\.?|LIMITED)\b",
        " ",
        normalized,
    )
    return re.sub(r"\s+", " ", normalized).strip().lower() or None


def normalize_wage_unit(value: object) -> str | None:
    text = _clean_cell(value)
    if text is None:
        return None

    compact = _compact_unit(text)
    display_units = {
        "YEAR": "Year",
        "ANNUAL": "Year",
        "MONTH": "Month",
        "MON": "Month",
        "BIWEEKLY": "Bi-Weekly",
        "BI-WEEKLY": "Bi-Weekly",
        "WEEK": "Week",
        "WK": "Week",
        "DAY": "Day",
        "HOUR": "Hour",
        "HR": "Hour",
    }
    return display_units.get(compact, text.strip())


def normalize_city(value: object) -> str | None:
    text = _clean_cell(value)
    if text is None:
        return None
    return text.title()


def normalize_state(value: object) -> str | None:
    text = _clean_cell(value)
    if text is None:
        return None
    return text.upper()


def _read_csv_rows(path: Path) -> Iterable[dict[str, object]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            yield dict(row)


def _read_xlsx_rows(path: Path) -> Iterable[dict[str, object]]:
    with zipfile.ZipFile(path) as archive:
        shared_strings = _read_shared_strings(archive)
        worksheet_name = _first_worksheet_name(archive)
        with archive.open(worksheet_name) as worksheet:
            headers: list[str] | None = None
            for _, row_element in ElementTree.iterparse(worksheet, events=("end",)):
                if _local_name(row_element.tag) != "row":
                    continue

                cells: dict[int, str | None] = {}
                for cell in row_element:
                    if _local_name(cell.tag) != "c":
                        continue
                    reference = cell.attrib.get("r", "")
                    column_index = _column_index(reference)
                    cells[column_index] = _xlsx_cell_value(cell, shared_strings)

                if cells:
                    values = [cells.get(index) for index in range(max(cells) + 1)]
                    if not any(_clean_cell(value) is not None for value in values):
                        row_element.clear()
                        continue
                    if headers is None:
                        headers = [_clean_cell(value) or "" for value in values]
                    else:
                        yield {
                            header: values[index] if index < len(values) else None
                            for index, header in enumerate(headers)
                            if header
                        }

                row_element.clear()


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


def _compact_unit(value: str) -> str:
    normalized = value.strip().upper()
    normalized = normalized.replace("PER ", "")
    normalized = normalized.replace("/", "")
    normalized = normalized.replace("_", "-")
    normalized = re.sub(r"\s+", "-", normalized)
    return normalized
