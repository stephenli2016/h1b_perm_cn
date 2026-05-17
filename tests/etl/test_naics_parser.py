from __future__ import annotations

import unittest

from etl.parsers.naics import iter_naics_industry_records


class NaicsParserTests(unittest.TestCase):
    def test_parses_census_naics_structure_fixture(self) -> None:
        records = list(
            iter_naics_industry_records(
                "data/fixtures/raw/census_naics_2022_structure.csv",
                source_file_id="census_naics_2022_structure",
                release_year=2022,
            )
        )

        by_code = {record.naics_code: record for record in records}

        self.assertIn("541511", by_code)
        self.assertEqual(
            by_code["541511"].industry_title,
            "Custom Computer Programming Services",
        )
        self.assertEqual(by_code["541511"].classification_level, "national_industry")
        self.assertEqual(by_code["541511"].sector_code, "54")
        self.assertEqual(
            by_code["541511"].sector_title,
            "Professional, Scientific, and Technical Services",
        )
        self.assertEqual(by_code["518210"].change_indicator, "**")
        self.assertTrue(by_code["54"].trilateral)
        self.assertNotIn("T", by_code["54"].industry_title[-1:])


if __name__ == "__main__":
    unittest.main()
