from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from etl.parsers.uscis_h1b_employer import (
    get_uscis_h1b_summaries_by_employer,
    get_uscis_h1b_summary_by_employer_fiscal_year,
    normalize_uscis_h1b_employer_row,
    parse_uscis_h1b_employer_file,
    read_uscis_h1b_employer_rows,
    write_uscis_h1b_employer_jsonl,
)


class UscisH1BEmployerParserTests(unittest.TestCase):
    def test_parses_uscis_h1b_csv_fixture(self) -> None:
        result = parse_uscis_h1b_employer_file(
            "data/fixtures/raw/uscis_h1b_employer_data_fy2023.csv",
            source_file_id="uscis_h1b_employer_data_fy2023",
            fiscal_year=2023,
        )

        self.assertEqual(result.records_seen, 3)
        self.assertEqual(result.records_inserted, 3)
        self.assertEqual(result.duplicate_records, 0)

        first = result.records[0]
        self.assertEqual(first.fiscal_year, 2023)
        self.assertEqual(first.raw_employer_name, "ACME ANALYTICS LLC")
        self.assertEqual(first.normalized_employer_name, "acme analytics")
        self.assertEqual(first.city, "Seattle")
        self.assertEqual(first.state, "WA")
        self.assertEqual(first.postal_code, "98101")
        self.assertEqual(first.naics_code, "541511")
        self.assertEqual(first.initial_approvals, 4)
        self.assertEqual(first.initial_denials, 0)
        self.assertEqual(first.continuing_approvals, 6)
        self.assertEqual(first.continuing_denials, 1)
        self.assertNotIn("TAX_ID", first.raw_record_json)

    def test_parses_existing_html_table_fixture_as_local_fallback(self) -> None:
        rows = list(
            read_uscis_h1b_employer_rows(
                "data/fixtures/raw/uscis_h1b_employer_data_hub.html"
            )
        )
        result = parse_uscis_h1b_employer_file(
            "data/fixtures/raw/uscis_h1b_employer_data_hub.html",
            source_file_id="uscis_h1b_employer_data_hub_index",
        )

        self.assertEqual(rows[0]["Fiscal Year"], "2026")
        self.assertEqual(result.records_inserted, 2)
        self.assertEqual(result.records[0].raw_employer_name, "ACME ANALYTICS LLC")
        self.assertEqual(result.records[0].initial_approvals, 2)
        self.assertEqual(result.records[0].continuing_approvals, None)

    def test_sanitizes_tax_fields_from_raw_json(self) -> None:
        record = normalize_uscis_h1b_employer_row(
            {
                "Fiscal Year": "2023",
                "Employer (Petitioner) Name": "ACME ANALYTICS LLC",
                "Tax ID": "1234",
                "Employer Tax Identification Number": "99-9999999",
                "City": "Seattle",
                "State": "WA",
                "Initial Approval": "4",
            },
            source_file_id="privacy_source",
        )

        self.assertEqual(record.initial_approvals, 4)
        self.assertNotIn("TAX_ID", record.raw_record_json)
        self.assertNotIn(
            "EMPLOYER_TAX_IDENTIFICATION_NUMBER",
            record.raw_record_json,
        )
        self.assertEqual(record.raw_record_json["CITY"], "Seattle")

    def test_deduplicates_by_source_record_fingerprint(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            csv_path = Path(tmp_dir) / "dupes.csv"
            csv_path.write_text(
                "Fiscal Year,Employer,City,State,Initial Approval,Initial Denial,"
                "Continuing Approval,Continuing Denial\n"
                "2023,ACME ANALYTICS LLC,Seattle,WA,4,0,6,1\n"
                "2023,ACME ANALYTICS LLC,Seattle,WA,4,0,6,1\n",
                encoding="utf-8",
            )

            result = parse_uscis_h1b_employer_file(
                csv_path,
                source_file_id="dupe_source",
            )

        self.assertEqual(result.records_seen, 2)
        self.assertEqual(result.records_inserted, 1)
        self.assertEqual(result.duplicate_records, 1)

    def test_summarizes_by_employer_and_fiscal_year_without_rate_claims(self) -> None:
        records = parse_uscis_h1b_employer_file(
            "data/fixtures/raw/uscis_h1b_employer_data_fy2023.csv",
            source_file_id="uscis_h1b_employer_data_fy2023",
            fiscal_year=2023,
        ).records

        summaries = get_uscis_h1b_summaries_by_employer(records, "Acme Analytics, LLC")
        summary_2023 = get_uscis_h1b_summary_by_employer_fiscal_year(
            records,
            "Acme Analytics, LLC",
            2023,
        )

        self.assertEqual([summary.fiscal_year for summary in summaries], [2023, 2022])
        self.assertIsNotNone(summary_2023)
        assert summary_2023 is not None
        self.assertEqual(summary_2023.total_records, 1)
        self.assertEqual(summary_2023.initial_approvals, 4)
        self.assertEqual(summary_2023.initial_denials, 0)
        self.assertEqual(summary_2023.continuing_approvals, 6)
        self.assertEqual(summary_2023.continuing_denials, 1)
        self.assertEqual(summary_2023.first_decisions, 11)
        self.assertEqual(summary_2023.cities, ("Seattle",))
        self.assertEqual(summary_2023.naics_codes, ("541511",))

    def test_writes_jsonl_output(self) -> None:
        result = parse_uscis_h1b_employer_file(
            "data/fixtures/raw/uscis_h1b_employer_data_fy2023.csv",
            source_file_id="uscis_h1b_employer_data_fy2023",
            fiscal_year=2023,
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            output_path = Path(tmp_dir) / "uscis-h1b.jsonl"
            count = write_uscis_h1b_employer_jsonl(output_path, result.records)
            payloads = [
                json.loads(line)
                for line in output_path.read_text(encoding="utf-8").splitlines()
            ]

        self.assertEqual(count, 3)
        self.assertEqual(payloads[0]["raw_employer_name"], "ACME ANALYTICS LLC")
        self.assertEqual(payloads[1]["continuing_approvals"], 3)


if __name__ == "__main__":
    unittest.main()
