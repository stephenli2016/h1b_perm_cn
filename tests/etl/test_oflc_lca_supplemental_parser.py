from __future__ import annotations

import unittest

from etl.parsers.oflc_lca_supplemental import (
    iter_lca_appendix_a_records,
    iter_lca_worksite_records,
    normalize_lca_worksite_row,
)


class OflcLcaSupplementalParserTests(unittest.TestCase):
    def test_parses_lca_worksite_fixture(self) -> None:
        records = list(
            iter_lca_worksite_records(
                "data/fixtures/raw/oflc_lca_worksites_fy2026_q2.csv",
                source_file_id="oflc_lca_worksites_fy2026_q2",
                fiscal_year=2026,
            )
        )

        self.assertEqual(len(records), 2)
        self.assertEqual(records[0].case_number, "I-200-26001-000001")
        self.assertEqual(records[0].workers, 1)
        self.assertEqual(records[0].worksite_city, "Seattle")
        self.assertEqual(records[0].worksite_state, "WA")
        self.assertEqual(records[1].secondary_entity, True)
        self.assertEqual(records[1].secondary_entity_name, "CLIENT PLATFORM INC")

    def test_parses_lca_appendix_a_fixture(self) -> None:
        records = list(
            iter_lca_appendix_a_records(
                "data/fixtures/raw/oflc_lca_appendix_a_fy2026_q2.csv",
                source_file_id="oflc_lca_appendix_a_fy2026_q2",
                fiscal_year=2026,
            )
        )

        self.assertEqual(len(records), 2)
        self.assertEqual(records[1].case_number, "I-200-26001-000002")
        self.assertEqual(records[1].exempt_worker_count, 1)

    def test_supplemental_raw_json_drops_street_addresses(self) -> None:
        record = normalize_lca_worksite_row(
            {
                "CASE_NUMBER": "I-200-26001-000001",
                "WORKSITE_ADDRESS1": "1 Worksite Street",
                "WORKSITE_CITY": "Seattle",
                "WORKSITE_STATE": "WA",
            },
            source_file_id="privacy_source",
            fiscal_year=2026,
        )

        self.assertNotIn("WORKSITE_ADDRESS1", record.raw_record_json)
        self.assertEqual(record.raw_record_json["WORKSITE_CITY"], "Seattle")


if __name__ == "__main__":
    unittest.main()
