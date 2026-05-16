from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import URLError

from etl.downloader import download_entry
from etl.manifest import SourceEntry


class DownloaderTests(unittest.TestCase):
    def test_fixture_mode_uses_fixture_without_network(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            fixture_path = root / "fixtures" / "sample.csv"
            fixture_path.parent.mkdir(parents=True)
            fixture_path.write_text("id,value\n1,fixture\n", encoding="utf-8")

            entry = _source_entry(
                downloaded_path="raw/sample.csv",
                fixture_path="fixtures/sample.csv",
            )

            result = download_entry(entry, root, fixtures_only=True)

            self.assertEqual(result.status, "fixture")
            self.assertTrue(result.used_fixture)
            self.assertEqual(result.path, str(fixture_path))
            self.assertIsNotNone(result.fingerprint)

    def test_download_failure_falls_back_to_fixture(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            fixture_path = root / "fixtures" / "sample.csv"
            fixture_path.parent.mkdir(parents=True)
            fixture_path.write_text("id,value\n1,fallback\n", encoding="utf-8")

            entry = _source_entry(
                downloaded_path="raw/sample.csv",
                fixture_path="fixtures/sample.csv",
            )

            with patch("etl.downloader.request.urlopen", side_effect=URLError("network blocked")):
                result = download_entry(entry, root, fixtures_only=False, timeout_seconds=1)

            self.assertEqual(result.status, "fixture")
            self.assertTrue(result.used_fixture)
            self.assertIn("download failed", result.message)

    def test_download_failure_reports_failed_when_no_fixture_exists(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            entry = _source_entry(
                downloaded_path="raw/sample.csv",
                fixture_path="fixtures/missing.csv",
            )

            with patch("etl.downloader.request.urlopen", side_effect=URLError("network blocked")):
                result = download_entry(entry, root, fixtures_only=False, timeout_seconds=1)

            self.assertEqual(result.status, "failed")
            self.assertFalse(result.used_fixture)
            self.assertIsNone(result.path)


def _source_entry(downloaded_path: str, fixture_path: str) -> SourceEntry:
    return SourceEntry(
        id="fixture_source",
        source_name="Fixture Source",
        official_url="https://www.dol.gov/example.csv",
        fiscal_year=2026,
        quarter="Q2",
        expected_file_type="csv",
        checksum_sha256=None,
        downloaded_path=downloaded_path,
        fixture_path=fixture_path,
        parser_name="fixture_parser",
        required=True,
    )


if __name__ == "__main__":
    unittest.main()
