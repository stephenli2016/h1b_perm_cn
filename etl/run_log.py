from __future__ import annotations

import json
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

from etl.downloader import DownloadResult


@dataclass(frozen=True)
class EtlRunLogRecord:
    run_id: str
    entry_id: str
    source_name: str
    parser_name: str
    status: str
    used_fixture: bool
    path: str | None
    size_bytes: int | None
    sha256: str | None
    message: str
    logged_at: str


def create_run_id() -> str:
    return uuid.uuid4().hex


def record_from_download_result(
    result: DownloadResult,
    *,
    run_id: str,
    logged_at: str | None = None,
) -> EtlRunLogRecord:
    fingerprint = result.fingerprint

    return EtlRunLogRecord(
        run_id=run_id,
        entry_id=result.entry_id,
        source_name=result.source_name,
        parser_name=result.parser_name,
        status=result.status,
        used_fixture=result.used_fixture,
        path=result.path,
        size_bytes=fingerprint.size_bytes if fingerprint else None,
        sha256=fingerprint.sha256 if fingerprint else None,
        message=result.message,
        logged_at=logged_at or now_iso(),
    )


def append_run_log(path: Path | str, records: list[EtlRunLogRecord]) -> None:
    log_path = Path(path)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    with log_path.open("a", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(asdict(record), ensure_ascii=False, sort_keys=True))
            handle.write("\n")


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
