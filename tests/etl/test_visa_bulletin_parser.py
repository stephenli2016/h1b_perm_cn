from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from etl.parsers.visa_bulletin import (
    parse_uscis_filing_chart_file,
    parse_visa_bulletin_cutoff,
    parse_visa_bulletin_file,
    priority_date_is_before_cutoff,
    write_uscis_filing_chart_jsonl,
    write_visa_bulletin_jsonl,
)


class VisaBulletinParserTests(unittest.TestCase):
    def test_parses_three_fixture_months_for_china_employment_categories(self) -> None:
        paths = [
            "data/fixtures/raw/dos_visa_bulletin_2026_04.html",
            "data/fixtures/raw/dos_visa_bulletin_2026_05.html",
            "data/fixtures/raw/dos_visa_bulletin_2026_06.html",
        ]
        results = [
            parse_visa_bulletin_file(
                path,
                source_file_id=Path(path).stem,
                source_url="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html",
            )
            for path in paths
        ]

        self.assertEqual([result.month.month_key for result in results], ["2026-04", "2026-05", "2026-06"])
        self.assertEqual([result.records_inserted for result in results], [6, 6, 6])
        june_records = {(record.category, record.chart_type): record for record in results[2].records}
        self.assertEqual(june_records[("EB-1", "final_action")].cutoff_date, "2023-04-01")
        self.assertEqual(june_records[("EB-2", "final_action")].cutoff_date, "2021-09-01")
        self.assertEqual(june_records[("EB-3", "final_action")].cutoff_date, "2021-08-01")
        self.assertEqual(june_records[("EB-3", "dates_for_filing")].cutoff_date, "2022-01-01")

    def test_parses_day_month_year_cutoffs_and_c_u_values(self) -> None:
        date_cutoff = parse_visa_bulletin_cutoff("01-JAN-22", 2026)
        current_cutoff = parse_visa_bulletin_cutoff("C", 2026)
        unavailable_cutoff = parse_visa_bulletin_cutoff("U", 2026)

        self.assertEqual(date_cutoff.cutoff_status, "date")
        self.assertEqual(date_cutoff.cutoff_date, "2022-01-01")
        self.assertEqual(current_cutoff.cutoff_status, "current")
        self.assertIsNone(current_cutoff.cutoff_date)
        self.assertEqual(unavailable_cutoff.cutoff_status, "unavailable")
        self.assertIsNone(unavailable_cutoff.cutoff_date)

    def test_priority_date_must_be_earlier_than_cutoff(self) -> None:
        cutoff = parse_visa_bulletin_cutoff("01AUG21", 2026)

        self.assertTrue(priority_date_is_before_cutoff("2021-07-31", cutoff))
        self.assertFalse(priority_date_is_before_cutoff("2021-08-01", cutoff))
        self.assertTrue(
            priority_date_is_before_cutoff(
                "2030-01-01",
                parse_visa_bulletin_cutoff("C", 2026),
            )
        )
        self.assertFalse(
            priority_date_is_before_cutoff(
                "2020-01-01",
                parse_visa_bulletin_cutoff("U", 2026),
            )
        )

    def test_parses_uscis_filing_chart_selection(self) -> None:
        result = parse_uscis_filing_chart_file(
            "data/fixtures/raw/uscis_filing_chart_2026_06.html",
            source_file_id="uscis_filing_chart_2026_06",
        )

        self.assertEqual(result.selection.month_key, "2026-06")
        self.assertEqual(result.selection.employment_based_chart, "final_action")

    def test_uscis_filing_chart_supports_manual_fallback(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / "manual.html"
            path.write_text(
                "<h1>July 2026 Adjustment of Status Filing Charts</h1>"
                "<p>Manual placeholder pending USCIS page access.</p>",
                encoding="utf-8",
            )

            result = parse_uscis_filing_chart_file(
                path,
                source_file_id="manual",
                fallback_employment_based_chart="dates_for_filing",
            )

        self.assertEqual(result.selection.month_key, "2026-07")
        self.assertEqual(result.selection.employment_based_chart, "dates_for_filing")

    def test_uscis_filing_chart_reads_realistic_table_caption(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / "caption.html"
            path.write_text(
                "<h1>When to File: May 2026</h1>"
                "<table><caption>Final Action Dates for Employment-Based Adjustment of Status Applications</caption>"
                "<tr><th>Employment- Based</th><th>CHINA-mainland born</th></tr>"
                "<tr><th>1st</th><td>01APR23</td></tr></table>",
                encoding="utf-8",
            )

            result = parse_uscis_filing_chart_file(
                path,
                source_file_id="caption",
            )

        self.assertEqual(result.selection.month_key, "2026-05")
        self.assertEqual(result.selection.employment_based_chart, "final_action")

    def test_writes_jsonl_outputs(self) -> None:
        visa_result = parse_visa_bulletin_file(
            "data/fixtures/raw/dos_visa_bulletin_2026_06.html",
            source_file_id="dos_visa_bulletin_2026_06",
            source_url="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/2026/visa-bulletin-for-june-2026.html",
        )
        uscis_result = parse_uscis_filing_chart_file(
            "data/fixtures/raw/uscis_filing_chart_2026_06.html",
            source_file_id="uscis_filing_chart_2026_06",
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            visa_output = Path(tmp_dir) / "visa.jsonl"
            uscis_output = Path(tmp_dir) / "uscis.jsonl"
            visa_count = write_visa_bulletin_jsonl(visa_output, [visa_result])
            uscis_count = write_uscis_filing_chart_jsonl(uscis_output, [uscis_result])
            visa_payloads = [
                json.loads(line)
                for line in visa_output.read_text(encoding="utf-8").splitlines()
            ]
            uscis_payloads = [
                json.loads(line)
                for line in uscis_output.read_text(encoding="utf-8").splitlines()
            ]

        self.assertEqual(visa_count, 7)
        self.assertEqual(visa_payloads[0]["record_type"], "month")
        self.assertEqual(visa_payloads[1]["record_type"], "date")
        self.assertEqual(uscis_count, 1)
        self.assertEqual(uscis_payloads[0]["employment_based_chart"], "final_action")


if __name__ == "__main__":
    unittest.main()
