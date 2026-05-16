from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from etl.downloader import DownloadResult
from etl.fingerprint import FileFingerprint
from etl.run_log import append_run_log, record_from_download_result


class RunLogTests(unittest.TestCase):
    def test_appends_jsonl_run_records(self) -> None:
        result = DownloadResult(
            entry_id="source_a",
            source_name="Source A",
            parser_name="parser_a",
            status="fixture",
            used_fixture=True,
            path="data/fixtures/raw/source_a.csv",
            fingerprint=FileFingerprint(
                path="data/fixtures/raw/source_a.csv",
                size_bytes=10,
                sha256="a" * 64,
            ),
            message="fixture mode requested",
        )
        record = record_from_download_result(
            result,
            run_id="run-1",
            logged_at="2026-05-16T00:00:00+00:00",
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            log_path = Path(tmp_dir) / "etl.jsonl"
            append_run_log(log_path, [record])

            lines = log_path.read_text(encoding="utf-8").splitlines()

        self.assertEqual(len(lines), 1)
        payload = json.loads(lines[0])
        self.assertEqual(payload["run_id"], "run-1")
        self.assertEqual(payload["status"], "fixture")
        self.assertEqual(payload["sha256"], "a" * 64)


if __name__ == "__main__":
    unittest.main()
