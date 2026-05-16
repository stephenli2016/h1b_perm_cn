from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ALLOWED_FILE_TYPES = {"csv", "html", "json", "pdf", "xlsx", "zip"}
REQUIRED_SOURCE_FIELDS = {
    "id",
    "source_name",
    "official_url",
    "fiscal_year",
    "quarter",
    "expected_file_type",
    "checksum_sha256",
    "downloaded_path",
    "fixture_path",
    "parser_name",
}
CHECKSUM_RE = re.compile(r"^[a-fA-F0-9]{64}$")


class ManifestError(ValueError):
    pass


@dataclass(frozen=True)
class SourceEntry:
    id: str
    source_name: str
    official_url: str
    fiscal_year: int | None
    quarter: str | None
    expected_file_type: str
    checksum_sha256: str | None
    downloaded_path: str
    fixture_path: str | None
    parser_name: str
    required: bool = True

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "SourceEntry":
        missing = sorted(REQUIRED_SOURCE_FIELDS - raw.keys())
        if missing:
            raise ManifestError(f"source entry is missing fields: {', '.join(missing)}")

        expected_file_type = _required_string(raw, "expected_file_type").lower()
        if expected_file_type not in ALLOWED_FILE_TYPES:
            raise ManifestError(
                f"{raw.get('id', '<unknown>')} has unsupported expected_file_type: "
                f"{expected_file_type}"
            )

        official_url = _required_string(raw, "official_url")
        _validate_official_url(official_url)

        checksum = raw.get("checksum_sha256")
        if checksum is not None:
            if not isinstance(checksum, str) or not CHECKSUM_RE.match(checksum):
                raise ManifestError(
                    f"{raw.get('id', '<unknown>')} checksum_sha256 must be a 64-character hex digest"
                )
            checksum = checksum.lower()

        fiscal_year = raw.get("fiscal_year")
        if fiscal_year is not None and not isinstance(fiscal_year, int):
            raise ManifestError(f"{raw.get('id', '<unknown>')} fiscal_year must be an integer or null")

        quarter = raw.get("quarter")
        if quarter is not None and quarter not in {"Q1", "Q2", "Q3", "Q4"}:
            raise ManifestError(f"{raw.get('id', '<unknown>')} quarter must be Q1, Q2, Q3, Q4, or null")

        return cls(
            id=_required_string(raw, "id"),
            source_name=_required_string(raw, "source_name"),
            official_url=official_url,
            fiscal_year=fiscal_year,
            quarter=quarter,
            expected_file_type=expected_file_type,
            checksum_sha256=checksum,
            downloaded_path=_required_string(raw, "downloaded_path"),
            fixture_path=_optional_string(raw, "fixture_path"),
            parser_name=_required_string(raw, "parser_name"),
            required=bool(raw.get("required", True)),
        )

    def resolved_download_path(self, repo_root: Path | str) -> Path:
        return _resolve_repo_path(repo_root, self.downloaded_path)

    def resolved_fixture_path(self, repo_root: Path | str) -> Path | None:
        if self.fixture_path is None:
            return None
        return _resolve_repo_path(repo_root, self.fixture_path)


@dataclass(frozen=True)
class SourceManifest:
    manifest_version: int
    updated_at: str
    description: str
    sources: tuple[SourceEntry, ...]

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "SourceManifest":
        if raw.get("manifest_version") != 1:
            raise ManifestError("manifest_version must be 1")

        sources_raw = raw.get("sources")
        if not isinstance(sources_raw, list) or not sources_raw:
            raise ManifestError("manifest must include a non-empty sources list")

        sources = tuple(SourceEntry.from_dict(source) for source in sources_raw)
        ids = [source.id for source in sources]
        duplicated_ids = sorted({source_id for source_id in ids if ids.count(source_id) > 1})
        if duplicated_ids:
            raise ManifestError(f"duplicate source ids: {', '.join(duplicated_ids)}")

        return cls(
            manifest_version=1,
            updated_at=_required_string(raw, "updated_at"),
            description=_required_string(raw, "description"),
            sources=sources,
        )


def load_manifest(path: Path | str) -> SourceManifest:
    manifest_path = Path(path)
    with manifest_path.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)

    if not isinstance(raw, dict):
        raise ManifestError("manifest root must be a JSON object")

    return SourceManifest.from_dict(raw)


def _required_string(raw: dict[str, Any], key: str) -> str:
    value = raw.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ManifestError(f"{key} must be a non-empty string")
    return value.strip()


def _optional_string(raw: dict[str, Any], key: str) -> str | None:
    value = raw.get(key)
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise ManifestError(f"{key} must be a non-empty string or null")
    return value.strip()


def _validate_official_url(url: str) -> None:
    parsed = urlparse(url)
    host = parsed.hostname or ""

    if parsed.scheme != "https":
        raise ManifestError(f"official_url must use https: {url}")
    if not host.endswith(".gov"):
        raise ManifestError(f"official_url must point to an official .gov host: {url}")


def _resolve_repo_path(repo_root: Path | str, value: str) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    return Path(repo_root) / path
