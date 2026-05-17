from __future__ import annotations

import unittest

from etl.parsers.onet import iter_onet_job_zone_records, iter_onet_occupation_records


class OnetParserTests(unittest.TestCase):
    def test_parses_onet_occupation_fixture(self) -> None:
        records = list(
            iter_onet_occupation_records(
                "data/fixtures/raw/onet_occupation_data_30_2.txt",
                source_file_id="onet_occupation_data_30_2",
                release_version="30.2",
            )
        )

        software_developer = next(
            record for record in records if record.onet_soc_code == "15-1252.00"
        )
        self.assertEqual(software_developer.soc_code, "15-1252")
        self.assertEqual(software_developer.job_family_code, "15")
        self.assertEqual(
            software_developer.job_family_title,
            "Computer and Mathematical Occupations",
        )
        self.assertIn("develop", software_developer.description or "")

    def test_parses_onet_job_zone_with_reference_fixture(self) -> None:
        records = list(
            iter_onet_job_zone_records(
                "data/fixtures/raw/onet_job_zones_30_2.txt",
                job_zone_reference_path="data/fixtures/raw/onet_job_zone_reference_30_2.txt",
                source_file_id="onet_job_zones_30_2",
                release_version="30.2",
            )
        )

        software_developer = next(
            record for record in records if record.onet_soc_code == "15-1252.00"
        )
        self.assertEqual(software_developer.job_zone, 4)
        self.assertEqual(
            software_developer.job_zone_name,
            "Job Zone 4: Considerable Preparation Needed",
        )
        self.assertIn("bachelor", software_developer.education or "")
        self.assertEqual(software_developer.domain_source, "Analyst")


if __name__ == "__main__":
    unittest.main()
