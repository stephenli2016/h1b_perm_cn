from __future__ import annotations

import shutil
import tempfile
from dataclasses import dataclass
from pathlib import Path
from urllib import error, request

from etl.fingerprint import FileFingerprint, fingerprint_file
from etl.manifest import SourceEntry, SourceManifest


USER_AGENT = "VisaRadarCN-ETL/0.1 (+https://example.com; official public data ingestion)"


@dataclass(frozen=True)
class DownloadResult:
    entry_id: str
    source_name: str
    parser_name: str
    status: str
    used_fixture: bool
    path: str | None
    fingerprint: FileFingerprint | None
    message: str


def download_entry(
    entry: SourceEntry,
    repo_root: Path | str,
    *,
    fixtures_only: bool = False,
    timeout_seconds: int = 30,
) -> DownloadResult:
    repo_root_path = Path(repo_root)

    if fixtures_only:
        return _fixture_result(entry, repo_root_path, "fixture mode requested")

    try:
        downloaded_path = entry.resolved_download_path(repo_root_path)
        downloaded_path.parent.mkdir(parents=True, exist_ok=True)
        _download_to_path(entry.official_url, downloaded_path, timeout_seconds)
        fingerprint = fingerprint_file(downloaded_path)

        if entry.checksum_sha256 and fingerprint.sha256 != entry.checksum_sha256:
            return _fixture_result(
                entry,
                repo_root_path,
                "downloaded file checksum did not match manifest checksum",
            )

        return DownloadResult(
            entry_id=entry.id,
            source_name=entry.source_name,
            parser_name=entry.parser_name,
            status="downloaded",
            used_fixture=False,
            path=str(downloaded_path),
            fingerprint=fingerprint,
            message="downloaded official source file",
        )
    except (OSError, error.URLError) as exc:
        return _fixture_result(entry, repo_root_path, f"download failed: {exc}")


def download_manifest(
    manifest: SourceManifest,
    repo_root: Path | str,
    *,
    fixtures_only: bool = False,
    timeout_seconds: int = 30,
) -> list[DownloadResult]:
    return [
        download_entry(
            entry,
            repo_root,
            fixtures_only=fixtures_only,
            timeout_seconds=timeout_seconds,
        )
        for entry in manifest.sources
    ]


def _download_to_path(url: str, target_path: Path, timeout_seconds: int) -> None:
    headers = {"User-Agent": USER_AGENT}
    req = request.Request(url, headers=headers)

    with request.urlopen(req, timeout=timeout_seconds) as response:
        with tempfile.NamedTemporaryFile(delete=False, dir=target_path.parent) as temp_file:
            temp_path = Path(temp_file.name)
            shutil.copyfileobj(response, temp_file)

    temp_path.replace(target_path)


def _fixture_result(entry: SourceEntry, repo_root: Path, message: str) -> DownloadResult:
    fixture_path = entry.resolved_fixture_path(repo_root)

    if fixture_path and fixture_path.exists():
        fingerprint = fingerprint_file(fixture_path)
        return DownloadResult(
            entry_id=entry.id,
            source_name=entry.source_name,
            parser_name=entry.parser_name,
            status="fixture",
            used_fixture=True,
            path=str(fixture_path),
            fingerprint=fingerprint,
            message=message,
        )

    return DownloadResult(
        entry_id=entry.id,
        source_name=entry.source_name,
        parser_name=entry.parser_name,
        status="failed",
        used_fixture=False,
        path=None,
        fingerprint=None,
        message=f"{message}; no fixture fallback found",
    )
