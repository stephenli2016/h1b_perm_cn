from __future__ import annotations

import unittest

from etl.parsers.bls_oews import (
    iter_bls_oews_area_records,
    iter_bls_oews_occupation_records,
)


class BlsOewsParserTests(unittest.TestCase):
    def test_parses_occupation_metadata_fixture(self) -> None:
        records = list(
            iter_bls_oews_occupation_records(
                "data/fixtures/raw/bls_oews_occupation_metadata_2025.txt",
                source_file_id="bls_oews_occupation_metadata_2025",
                release_year=2025,
            )
        )

        self.assertEqual(len(records), 2)
        self.assertEqual(records[0].occupation_code, "15-1252")
        self.assertEqual(records[0].occupation_name, "Software Developers")
        self.assertTrue(records[0].selectable)

    def test_parses_area_metadata_fixture(self) -> None:
        records = list(
            iter_bls_oews_area_records(
                "data/fixtures/raw/bls_oews_area_metadata_2025.txt",
                source_file_id="bls_oews_area_metadata_2025",
                release_year=2025,
            )
        )

        self.assertEqual(len(records), 2)
        self.assertEqual(records[0].area_code, "42660")
        self.assertEqual(records[0].area_name, "Seattle-Tacoma-Bellevue, WA")
        self.assertEqual(records[0].area_type_code, "4")


if __name__ == "__main__":
    unittest.main()
