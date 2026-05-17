from __future__ import annotations

import json
import re
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
    parse_bool,
    parse_date,
    parse_number,
    read_tabular_rows,
    resolve_fiscal_year,
    sanitize_raw_row,
)


FIELD_ALIASES = {
    "case_number": ["CASE_NUMBER", "CASE_NO", "PWD_NUMBER"],
    "case_status": ["CASE_STATUS", "CASE STATUS", "STATUS"],
    "visa_class": ["VISA_CLASS", "VISA CLASS"],
    "employer_name": [
        "EMPLOYER_LEGAL_BUSINESS_NAME",
        "EMPLOYER LEGAL BUSINESS NAME",
        "EMPLOYER_NAME",
        "EMPLOYER NAME",
    ],
    "naics_code": ["NAICS_CODE", "NAICS CODE"],
    "job_title": ["JOB_TITLE", "JOB TITLE"],
    "soc_code": ["PWD_SOC_CODE", "PWD SOC CODE", "EMP_SOC_CODES", "EMP SOC CODES", "SOC_CODE"],
    "soc_title": [
        "PWD_SOC_TITLE",
        "PWD SOC TITLE",
        "EMP_SOC_TITLES",
        "EMP SOC TITLES",
        "SOC_TITLE",
    ],
    "worksite_city": [
        "PRIMARY_WORKSITE_CITY",
        "PRIMARY WORKSITE CITY",
        "WORKSITE_CITY",
    ],
    "worksite_state": [
        "PRIMARY_WORKSITE_STATE",
        "PRIMARY WORKSITE STATE",
        "WORKSITE_STATE",
    ],
    "worksite_county": [
        "PRIMARY_WORKSITE_COUNTY",
        "PRIMARY WORKSITE COUNTY",
        "WORKSITE_COUNTY",
    ],
    "worksite_postal_code": [
        "PRIMARY_WORKSITE_POSTAL_CODE",
        "PRIMARY WORKSITE POSTAL CODE",
        "WORKSITE_POSTAL_CODE",
    ],
    "other_worksite_location": [
        "OTHER_WORKSITE_LOCATION",
        "OTHER WORKSITE LOCATION",
    ],
    "wage_source_requested": [
        "WAGE_SOURCE_REQUESTED",
        "WAGE SOURCE REQUESTED",
    ],
    "pwd_wage_rate": ["PWD_WAGE_RATE", "PWD WAGE RATE", "PW_WAGE", "PREVAILING_WAGE"],
    "pwd_unit": ["PWD_UNIT_OF_PAY", "PWD UNIT OF PAY", "PW_UNIT_OF_PAY"],
    "pwd_wage_level": [
        "PWD_OES_WAGE_LEVEL",
        "PWD OES WAGE LEVEL",
        "PW_WAGE_LEVEL",
        "WAGE_LEVEL",
    ],
    "pwd_wage_source": ["PWD_WAGE_SOURCE", "PWD WAGE SOURCE"],
    "bls_area": ["BLS_AREA", "BLS AREA"],
    "o_net_code": ["O_NET_CODE", "O*NET CODE", "ONET_CODE"],
    "o_net_title": ["O_NET_TITLE", "O*NET TITLE", "ONET_TITLE"],
    "required_education_level": [
        "REQUIRED_EDUCATION_LEVEL",
        "REQUIRED EDUCATION LEVEL",
    ],
    "required_education_major": [
        "REQUIRED_EDUCATION_MAJOR",
        "REQUIRED EDUCATION MAJOR",
    ],
    "required_training_months": [
        "REQUIRED_TRAINING_MONTHS",
        "REQUIRED TRAINING MONTHS",
    ],
    "required_experience_months": [
        "REQUIRED_EXPERIENCE_MONTHS",
        "REQUIRED EXPERIENCE MONTHS",
    ],
    "required_occupation": ["REQUIRED_OCCUPATION", "REQUIRED OCCUPATION"],
    "alternative_requirements": [
        "ALTERNATIVE_REQUIREMENTS",
        "ALTERNATIVE REQUIREMENTS",
    ],
    "alt_education_level": ["ALT_EDUCATION_LEVEL", "ALT EDUCATION LEVEL"],
    "alt_experience_months": ["ALT_EXPERIENCE_MONTHS", "ALT EXPERIENCE MONTHS"],
    "special_skills": [
        "SPECIAL_SKILLS_REQUIREMENTS",
        "SPECIAL SKILLS REQUIREMENTS",
    ],
    "foreign_language_required": [
        "SPEC_REQ_FOREIGN_LANG",
        "SPEC REQ FOREIGN LANG",
        "ALT_FOREIGN_LANGUAGE",
    ],
    "travel_required": ["TRAVEL_REQUIRED", "TRAVEL REQUIRED"],
    "received_date": ["RECEIVED_DATE", "RECEIVED DATE"],
    "determination_date": [
        "DETERMINATION_DATE",
        "DETERMINATION DATE",
        "PREVAIL_WAGE_DETERM_DATE",
    ],
    "expiration_date": [
        "PWD_WAGE_EXPIRATION_DATE",
        "PWD WAGE EXPIRATION DATE",
        "EXPIRATION_DATE",
    ],
}


@dataclass(frozen=True)
class NormalizedPwdCaseRecord:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    case_number: str | None
    case_status: str | None
    visa_class: str | None
    raw_employer_name: str | None
    normalized_employer_name: str | None
    fiscal_year: int
    naics_code: str | None
    job_title: str | None
    soc_code: str | None
    soc_title: str | None
    worksite_city: str | None
    worksite_county: str | None
    worksite_state: str | None
    worksite_postal_code: str | None
    other_worksite_location: bool | None
    wage_source_requested: str | None
    pwd_wage_rate: float | None
    pwd_unit: str | None
    annualized_pwd_wage: float | None
    pwd_wage_level: str | None
    pwd_wage_source: str | None
    bls_area: str | None
    o_net_code: str | None
    o_net_title: str | None
    required_education_level: str | None
    required_education_major: str | None
    required_training_months: int | None
    required_experience_months: int | None
    required_occupation: str | None
    alternative_requirements: bool | None
    alt_education_level: str | None
    alt_experience_months: int | None
    special_skills: bool | None
    foreign_language_required: bool | None
    travel_required: bool | None
    received_date: str | None
    determination_date: str | None
    expiration_date: str | None
    raw_record_json: dict[str, str | None]


def iter_pwd_case_records(
    path: Path | str,
    *,
    source_file_id: str,
    fiscal_year: int | None = None,
) -> Iterable[NormalizedPwdCaseRecord]:
    for raw_row in read_tabular_rows(path):
        yield normalize_pwd_case_row(
            raw_row,
            source_file_id=source_file_id,
            fallback_fiscal_year=fiscal_year,
        )


def normalize_pwd_case_row(
    raw_row: dict[str, object],
    *,
    source_file_id: str,
    fallback_fiscal_year: int | None = None,
) -> NormalizedPwdCaseRecord:
    cleaned_row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
    sanitized_raw = _sanitize_pwd_case_raw_row(cleaned_row)
    fingerprint = fingerprint_raw_row(sanitized_raw)

    case_number = _get(cleaned_row, FIELD_ALIASES["case_number"])
    employer_name = _get(cleaned_row, FIELD_ALIASES["employer_name"])
    determination_date = parse_date(_get(cleaned_row, FIELD_ALIASES["determination_date"]))
    pwd_unit = normalize_wage_unit(_get(cleaned_row, FIELD_ALIASES["pwd_unit"]))
    pwd_wage_rate = parse_number(_get(cleaned_row, FIELD_ALIASES["pwd_wage_rate"]))

    return NormalizedPwdCaseRecord(
        source_file_id=source_file_id,
        source_record_id=case_number or fingerprint,
        source_record_fingerprint=fingerprint,
        case_number=case_number,
        case_status=_get(cleaned_row, FIELD_ALIASES["case_status"]),
        visa_class=_get(cleaned_row, FIELD_ALIASES["visa_class"]),
        raw_employer_name=employer_name,
        normalized_employer_name=normalize_employer_name(employer_name),
        fiscal_year=resolve_fiscal_year(
            None,
            fallback_fiscal_year=fallback_fiscal_year,
            decision_date=determination_date,
        ),
        naics_code=_get(cleaned_row, FIELD_ALIASES["naics_code"]),
        job_title=_get(cleaned_row, FIELD_ALIASES["job_title"]),
        soc_code=_get(cleaned_row, FIELD_ALIASES["soc_code"]),
        soc_title=_get(cleaned_row, FIELD_ALIASES["soc_title"]),
        worksite_city=normalize_city(_get(cleaned_row, FIELD_ALIASES["worksite_city"])),
        worksite_county=normalize_city(_get(cleaned_row, FIELD_ALIASES["worksite_county"])),
        worksite_state=normalize_state(_get(cleaned_row, FIELD_ALIASES["worksite_state"])),
        worksite_postal_code=_get(cleaned_row, FIELD_ALIASES["worksite_postal_code"]),
        other_worksite_location=parse_bool(
            _get(cleaned_row, FIELD_ALIASES["other_worksite_location"])
        ),
        wage_source_requested=_get(cleaned_row, FIELD_ALIASES["wage_source_requested"]),
        pwd_wage_rate=pwd_wage_rate,
        pwd_unit=pwd_unit,
        annualized_pwd_wage=annualize_wage(pwd_wage_rate, pwd_unit),
        pwd_wage_level=_get(cleaned_row, FIELD_ALIASES["pwd_wage_level"]),
        pwd_wage_source=_get(cleaned_row, FIELD_ALIASES["pwd_wage_source"]),
        bls_area=_get(cleaned_row, FIELD_ALIASES["bls_area"]),
        o_net_code=_get(cleaned_row, FIELD_ALIASES["o_net_code"]),
        o_net_title=_get(cleaned_row, FIELD_ALIASES["o_net_title"]),
        required_education_level=_get(cleaned_row, FIELD_ALIASES["required_education_level"]),
        required_education_major=_get(cleaned_row, FIELD_ALIASES["required_education_major"]),
        required_training_months=_parse_int(
            _get(cleaned_row, FIELD_ALIASES["required_training_months"])
        ),
        required_experience_months=_parse_int(
            _get(cleaned_row, FIELD_ALIASES["required_experience_months"])
        ),
        required_occupation=_get(cleaned_row, FIELD_ALIASES["required_occupation"]),
        alternative_requirements=parse_bool(
            _get(cleaned_row, FIELD_ALIASES["alternative_requirements"])
        ),
        alt_education_level=_get(cleaned_row, FIELD_ALIASES["alt_education_level"]),
        alt_experience_months=_parse_int(
            _get(cleaned_row, FIELD_ALIASES["alt_experience_months"])
        ),
        special_skills=parse_bool(_get(cleaned_row, FIELD_ALIASES["special_skills"])),
        foreign_language_required=parse_bool(
            _get(cleaned_row, FIELD_ALIASES["foreign_language_required"])
        ),
        travel_required=parse_bool(_get(cleaned_row, FIELD_ALIASES["travel_required"])),
        received_date=parse_date(_get(cleaned_row, FIELD_ALIASES["received_date"])),
        determination_date=determination_date,
        expiration_date=parse_date(_get(cleaned_row, FIELD_ALIASES["expiration_date"])),
        raw_record_json=sanitized_raw,
    )


def write_pwd_case_jsonl(
    path: Path | str,
    records: Iterable[NormalizedPwdCaseRecord],
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


def _sanitize_pwd_case_raw_row(row: dict[str, str | None]) -> dict[str, str | None]:
    sanitized = sanitize_raw_row(row)
    return {
        key: value
        for key, value in sanitized.items()
        if not _looks_like_street_address_field(key)
    }


def _looks_like_street_address_field(key: str) -> bool:
    compact = re.sub(r"[^A-Z0-9]+", "", key.upper())
    return "ADDRESS" in compact or compact.endswith("ADDR1") or compact.endswith("ADDR2")


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
