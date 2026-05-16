from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from etl.manifest import ManifestError, SourceEntry, load_manifest


class ManifestTests(unittest.TestCase):
    def test_loads_project_source_manifest(self) -> None:
        manifest = load_manifest("data/source_manifest.json")

        self.assertEqual(manifest.manifest_version, 1)
        self.assertGreaterEqual(len(manifest.sources), 5)
        self.assertIn(
            "oflc_lca_fy2026_q2",
            [source.id for source in manifest.sources],
        )

    def test_validates_required_source_fields(self) -> None:
        raw = {
            "id": "broken",
            "source_name": "Broken Source",
            "official_url": "https://www.dol.gov/example",
        }

        with self.assertRaisesRegex(ManifestError, "missing fields"):
            SourceEntry.from_dict(raw)

    def test_rejects_non_official_urls(self) -> None:
        raw = _valid_source_entry()
        raw["official_url"] = "https://example.com/not-official.csv"

        with self.assertRaisesRegex(ManifestError, "official .gov"):
            SourceEntry.from_dict(raw)

    def test_rejects_duplicate_source_ids(self) -> None:
        raw_manifest = {
            "manifest_version": 1,
            "updated_at": "2026-05-16",
            "description": "test",
            "sources": [_valid_source_entry(), _valid_source_entry()],
        }

        with tempfile.TemporaryDirectory() as tmp_dir:
            manifest_path = Path(tmp_dir) / "manifest.json"
            manifest_path.write_text(json.dumps(raw_manifest), encoding="utf-8")

            with self.assertRaisesRegex(ManifestError, "duplicate source ids"):
                load_manifest(manifest_path)


def _valid_source_entry() -> dict[str, object]:
    return {
        "id": "fixture_source",
        "source_name": "Fixture Source",
        "official_url": "https://www.dol.gov/example.csv",
        "fiscal_year": 2026,
        "quarter": "Q2",
        "expected_file_type": "csv",
        "checksum_sha256": None,
        "downloaded_path": "data/raw/example.csv",
        "fixture_path": "data/fixtures/raw/example.csv",
        "parser_name": "fixture_parser",
        "required": True,
    }


if __name__ == "__main__":
    unittest.main()
