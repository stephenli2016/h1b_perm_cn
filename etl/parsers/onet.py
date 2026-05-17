from __future__ import annotations

import csv
import hashlib
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


SOC_MAJOR_GROUPS: dict[str, str] = {
    "11": "Management Occupations",
    "13": "Business and Financial Operations Occupations",
    "15": "Computer and Mathematical Occupations",
    "17": "Architecture and Engineering Occupations",
    "19": "Life, Physical, and Social Science Occupations",
    "21": "Community and Social Service Occupations",
    "23": "Legal Occupations",
    "25": "Educational Instruction and Library Occupations",
    "27": "Arts, Design, Entertainment, Sports, and Media Occupations",
    "29": "Healthcare Practitioners and Technical Occupations",
    "31": "Healthcare Support Occupations",
    "33": "Protective Service Occupations",
    "35": "Food Preparation and Serving Related Occupations",
    "37": "Building and Grounds Cleaning and Maintenance Occupations",
    "39": "Personal Care and Service Occupations",
    "41": "Sales and Related Occupations",
    "43": "Office and Administrative Support Occupations",
    "45": "Farming, Fishing, and Forestry Occupations",
    "47": "Construction and Extraction Occupations",
    "49": "Installation, Maintenance, and Repair Occupations",
    "51": "Production Occupations",
    "53": "Transportation and Material Moving Occupations",
    "55": "Military Specific Occupations",
}


@dataclass(frozen=True)
class NormalizedOnetOccupation:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    release_version: str
    onet_soc_code: str
    soc_code: str
    occupation_title: str
    description: str | None
    job_family_code: str | None
    job_family_title: str | None
    raw_record_json: dict[str, str | None]


@dataclass(frozen=True)
class NormalizedOnetJobZone:
    source_file_id: str
    source_record_id: str
    source_record_fingerprint: str
    release_version: str
    onet_soc_code: str
    soc_code: str
    occupation_title: str
    job_zone: int
    job_zone_name: str | None
    experience: str | None
    education: str | None
    job_training: str | None
    examples: str | None
    svp_range: str | None
    date_updated: str | None
    domain_source: str | None
    raw_record_json: dict[str, str | None]


def iter_onet_occupation_records(
    path: Path | str,
    *,
    source_file_id: str,
    release_version: str,
) -> Iterable[NormalizedOnetOccupation]:
    for raw_row in _read_tsv_rows(path):
        row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
        onet_soc_code = _require(_get(row, ["O_NET_SOC_CODE", "ONET_SOC_CODE"]), "onet_soc_code")
        title = _require(_get(row, ["TITLE"]), "occupation_title")
        soc_code = _soc_code(onet_soc_code)
        job_family_code = soc_code[:2] if soc_code else None
        sanitized_raw = {
            "O_NET_SOC_CODE": onet_soc_code,
            "TITLE": title,
            "DESCRIPTION": _get(row, ["DESCRIPTION"]),
        }
        yield NormalizedOnetOccupation(
            source_file_id=source_file_id,
            source_record_id=onet_soc_code,
            source_record_fingerprint=_fingerprint(sanitized_raw),
            release_version=release_version,
            onet_soc_code=onet_soc_code,
            soc_code=soc_code,
            occupation_title=title,
            description=_get(row, ["DESCRIPTION"]),
            job_family_code=job_family_code,
            job_family_title=SOC_MAJOR_GROUPS.get(job_family_code or ""),
            raw_record_json=sanitized_raw,
        )


def iter_onet_job_zone_records(
    job_zones_path: Path | str,
    *,
    job_zone_reference_path: Path | str,
    occupation_data_path: Path | str | None = None,
    source_file_id: str,
    release_version: str,
) -> Iterable[NormalizedOnetJobZone]:
    zone_reference = _read_job_zone_reference(job_zone_reference_path)
    occupation_titles = (
        _read_occupation_titles(occupation_data_path) if occupation_data_path else {}
    )

    for raw_row in _read_tsv_rows(job_zones_path):
        row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
        onet_soc_code = _require(_get(row, ["O_NET_SOC_CODE", "ONET_SOC_CODE"]), "onet_soc_code")
        title = _get(row, ["TITLE"]) or occupation_titles.get(onet_soc_code) or onet_soc_code
        job_zone = _parse_int(_require(_get(row, ["JOB_ZONE"]), "job_zone"))
        if job_zone is None:
            raise ValueError(f"invalid job zone for {onet_soc_code}")

        reference = zone_reference.get(job_zone, {})
        soc_code = _soc_code(onet_soc_code)
        sanitized_raw = {
            "O_NET_SOC_CODE": onet_soc_code,
            "TITLE": title,
            "JOB_ZONE": str(job_zone),
            "DATE": _get(row, ["DATE"]),
            "DOMAIN_SOURCE": _get(row, ["DOMAIN_SOURCE"]),
            "JOB_ZONE_REFERENCE": json.dumps(reference, ensure_ascii=False, sort_keys=True)
            if reference
            else None,
        }
        yield NormalizedOnetJobZone(
            source_file_id=source_file_id,
            source_record_id=f"{onet_soc_code}:zone-{job_zone}",
            source_record_fingerprint=_fingerprint(sanitized_raw),
            release_version=release_version,
            onet_soc_code=onet_soc_code,
            soc_code=soc_code,
            occupation_title=title,
            job_zone=job_zone,
            job_zone_name=reference.get("NAME"),
            experience=reference.get("EXPERIENCE"),
            education=reference.get("EDUCATION"),
            job_training=reference.get("JOB_TRAINING"),
            examples=reference.get("EXAMPLES"),
            svp_range=reference.get("SVP_RANGE"),
            date_updated=_get(row, ["DATE"]),
            domain_source=_get(row, ["DOMAIN_SOURCE"]),
            raw_record_json=sanitized_raw,
        )


def write_onet_occupation_jsonl(
    path: Path | str,
    records: Iterable[NormalizedOnetOccupation],
) -> int:
    return _write_dataclass_jsonl(path, records)


def write_onet_job_zone_jsonl(
    path: Path | str,
    records: Iterable[NormalizedOnetJobZone],
) -> int:
    return _write_dataclass_jsonl(path, records)


def _read_job_zone_reference(path: Path | str) -> dict[int, dict[str, str | None]]:
    reference: dict[int, dict[str, str | None]] = {}
    for raw_row in _read_tsv_rows(path):
        row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
        job_zone = _parse_int(_get(row, ["JOB_ZONE"]))
        if job_zone is None:
            continue
        reference[job_zone] = row
    return reference


def _read_occupation_titles(path: Path | str) -> dict[str, str]:
    titles: dict[str, str] = {}
    for raw_row in _read_tsv_rows(path):
        row = {_normalize_header(key): _clean_cell(value) for key, value in raw_row.items()}
        onet_soc_code = _get(row, ["O_NET_SOC_CODE", "ONET_SOC_CODE"])
        title = _get(row, ["TITLE"])
        if onet_soc_code and title:
            titles[onet_soc_code] = title
    return titles


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


def _soc_code(onet_soc_code: str) -> str:
    return re.sub(r"\.\d{2}$", "", onet_soc_code)


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


def _normalize_header(value: object) -> str:
    text = str(value or "").strip().upper()
    text = text.replace("*", "")
    text = re.sub(r"[^A-Z0-9]+", "_", text)
    return text.strip("_")


def _clean_cell(value: object) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    if text == "":
        return None

    return re.sub(r"\s+", " ", text)
