from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class FileFingerprint:
    path: str
    size_bytes: int
    sha256: str


def sha256_file(path: Path | str, chunk_size: int = 1024 * 1024) -> str:
    file_path = Path(path)
    digest = hashlib.sha256()

    with file_path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)

    return digest.hexdigest()


def fingerprint_file(path: Path | str) -> FileFingerprint:
    file_path = Path(path)
    stat = file_path.stat()

    return FileFingerprint(
        path=str(file_path),
        size_bytes=stat.st_size,
        sha256=sha256_file(file_path),
    )
