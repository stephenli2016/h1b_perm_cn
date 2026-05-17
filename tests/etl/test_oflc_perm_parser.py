from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from etl.parsers.oflc_perm import (
    get_perm_summary_by_employer,
    normalize_perm_row,
    parse_perm_file,
    write_perm_jsonl,
)


class OflcPermParserTests(unittest.TestCase):
    def test_parses_current_perm_fixture(self) -> None:
        result = parse_perm_file(
            "data/fixtures/raw/oflc_perm_fy2026_q2.csv",
            source_file_id="oflc_perm_fy2026_q2",
            fiscal_year=2026,
        )

        self.assertEqual(result.records_seen, 2)
        self.assertEqual(result.records_inserted, 2)
        self.assertEqual(result.duplicate_records, 0)

        first = result.records[0]
        self.assertEqual(first.case_number, "A-26001-000001")
        self.assertEqual(first.case_status, "Certified")
        self.assertEqual(first.raw_employer_name, "ACME ANALYTICS LLC")
        self.assertEqual(first.normalized_employer_name, "acme analytics")
        self.assertEqual(first.fiscal_year, 2026)
        self.assertEqual(first.job_title, "Software Engineer")
        self.assertEqual(first.soc_code, "15-1252")
        self.assertEqual(first.worksite_city, "Seattle")
        self.assertEqual(first.worksite_state, "WA")
        self.assertEqual(first.wage_offer_from, 138000)
        self.assertEqual(first.annualized_wage_offer_from, 138000)
        self.assertEqual(first.annualized_wage_offer_to, 148000)
        self.assertEqual(first.priority_date, "2025-11-15")
        self.assertEqual(first.received_date, "2025-11-20")
        self.assertEqual(first.decision_date, "2026-02-15")
        self.assertEqual(first.country_of_citizenship, "China")
        self.assertEqual(first.country_of_birth, "China")

    def test_parses_revised_eta_9089_new_form_fixture(self) -> None:
        result = parse_perm_file(
            "data/fixtures/raw/oflc_perm_fy2024_new_form.csv",
            source_file_id="oflc_perm_fy2024_new_form",
            fiscal_year=2024,
        )

        self.assertEqual(result.records_seen, 2)
        first = result.records[0]

        self.assertEqual(first.case_status, "Certified-Expired")
        self.assertEqual(first.raw_employer_name, "ACME ANALYTICS LLC")
        self.assertEqual(first.job_title, "Platform Engineer")
        self.assertEqual(first.soc_code, "15-1252")
        self.assertEqual(first.worksite_city, "Seattle")
        self.assertEqual(first.wage_unit, "Hour")
        self.assertEqual(first.annualized_wage_offer_from, 130000)
        self.assertEqual(first.received_date, "2024-05-08")
        self.assertEqual(first.country_of_citizenship, "China")
        self.assertEqual(first.raw_record_json["EMPLOYER_BUSINESS_NAME"], "ACME ANALYTICS LLC")

    def test_sanitizes_obvious_pii_but_keeps_safe_country_fields(self) -> None:
        record = normalize_perm_row(
            {
                "CASE_NUMBER": "A-26001-000001",
                "EMPLOYER_NAME": "ACME ANALYTICS LLC",
                "COUNTRY_OF_CITIZENSHIP": "China",
                "FOREIGN_WORKER_INFO_BIRTH_COUNTRY": "China",
                "FOREIGN_WORKER_NAME": "Private Person",
                "BENEFICIARY_EMAIL": "private@example.com",
                "EMPLOYER_FEIN": "12-3456789",
                "EMPLOYER_ADDRESS1": "1 Private Street",
                "EMP_ADDR1": "2 Private Street",
                "EMP_POC_FIRST_NAME": "Jane",
                "ATTY_AG_LAST_NAME": "Smith",
                "DECL_PREP_FIRST_NAME": "Alex",
                "WORKSITE_CITY": "Seattle",
                "DECISION_DATE": "2026-02-15",
            },
            source_file_id="privacy_source",
            fallback_fiscal_year=2026,
        )

        self.assertEqual(record.country_of_citizenship, "China")
        self.assertEqual(record.country_of_birth, "China")
        self.assertNotIn("FOREIGN_WORKER_NAME", record.raw_record_json)
        self.assertNotIn("BENEFICIARY_EMAIL", record.raw_record_json)
        self.assertNotIn("EMPLOYER_FEIN", record.raw_record_json)
        self.assertNotIn("EMPLOYER_ADDRESS1", record.raw_record_json)
        self.assertNotIn("EMP_ADDR1", record.raw_record_json)
        self.assertNotIn("EMP_POC_FIRST_NAME", record.raw_record_json)
        self.assertNotIn("ATTY_AG_LAST_NAME", record.raw_record_json)
        self.assertNotIn("DECL_PREP_FIRST_NAME", record.raw_record_json)
        self.assertNotIn("FOREIGN_WORKER_INFO_BIRTH_COUNTRY", record.raw_record_json)
        self.assertEqual(record.raw_record_json["COUNTRY_OF_CITIZENSHIP"], "China")
        self.assertEqual(record.raw_record_json["WORKSITE_CITY"], "Seattle")

    def test_parses_current_eta_9089_official_field_names(self) -> None:
        record = normalize_perm_row(
            {
                "CASE_NUMBER": "G-100-24330-498863",
                "CASE_STATUS": "Certified",
                "EMP_BUSINESS_NAME": "Cargill, Incorporated",
                "PWD_SOC_CODE": "11-1021.00",
                "PWD_SOC_TITLE": "General and Operations Managers",
                "JOB_TITLE": "Operations Supervisor",
                "PRIMARY_WORKSITE_CITY": "Gainesville",
                "PRIMARY_WORKSITE_STATE": "GA",
                "JOB_OPP_PWD_NUMBER": "P-100-24330-000001",
                "PWD_WAGE_RATE": "53123",
                "PWD_UNIT_OF_PAY": "Year",
                "PWD_OES_WAGE_LEVEL": "Level II",
                "REQUIRED_EDUCATION_LEVEL": "Bachelor's",
                "REQUIRED_EXPERIENCE_MONTHS": "24",
                "ALT_EDUCATION_LEVEL": "Master's",
                "ALT_EXPERIENCE_MONTHS": "12",
                "OTHER_REQ_JOB_FOREIGN_LANGUAGE": "N",
                "JOB_OPP_WAGE_FROM": "72578",
                "JOB_OPP_WAGE_TO": "90954",
                "JOB_OPP_WAGE_PER": "Year",
                "RECEIVED_DATE": "45621",
                "DECISION_DATE": "46112",
            },
            source_file_id="real_new_form",
            fallback_fiscal_year=2026,
        )

        self.assertEqual(record.raw_employer_name, "Cargill, Incorporated")
        self.assertEqual(record.normalized_employer_name, "cargill")
        self.assertEqual(record.soc_code, "11-1021.00")
        self.assertEqual(record.soc_title, "General and Operations Managers")
        self.assertEqual(record.worksite_city, "Gainesville")
        self.assertEqual(record.worksite_state, "GA")
        self.assertEqual(record.wage_offer_from, 72578)
        self.assertEqual(record.annualized_wage_offer_to, 90954)
        self.assertEqual(record.pwd_case_number, "P-100-24330-000001")
        self.assertEqual(record.pwd_wage, 53123)
        self.assertEqual(record.annualized_pwd_wage, 53123)
        self.assertEqual(record.pwd_wage_level, "Level II")
        self.assertEqual(record.minimum_education, "Bachelor's")
        self.assertEqual(record.experience_months, 24)
        self.assertEqual(record.alternate_experience_months, 12)
        self.assertFalse(record.foreign_language_required)

    def test_deduplicates_by_source_record_fingerprint(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            csv_path = Path(tmp_dir) / "dupes.csv"
            csv_path.write_text(
                "CASE_NUMBER,CASE_STATUS,EMPLOYER_NAME,WAGE_OFFER_FROM,WAGE_UNIT,DECISION_DATE\n"
                "A-26001-000001,Certified,ACME ANALYTICS LLC,138000,Year,2026-02-15\n"
                "A-26001-000001,Certified,ACME ANALYTICS LLC,138000,Year,2026-02-15\n",
                encoding="utf-8",
            )

            result = parse_perm_file(csv_path, source_file_id="dupe_source", fiscal_year=2026)

        self.assertEqual(result.records_seen, 2)
        self.assertEqual(result.records_inserted, 1)
        self.assertEqual(result.duplicate_records, 1)

    def test_queries_perm_summary_by_employer(self) -> None:
        records = (
            parse_perm_file(
                "data/fixtures/raw/oflc_perm_fy2026_q2.csv",
                source_file_id="oflc_perm_fy2026_q2",
                fiscal_year=2026,
            ).records
            + parse_perm_file(
                "data/fixtures/raw/oflc_perm_fy2024_new_form.csv",
                source_file_id="oflc_perm_fy2024_new_form",
                fiscal_year=2024,
            ).records
        )

        summary = get_perm_summary_by_employer(records, "Acme Analytics, LLC")

        self.assertIsNotNone(summary)
        assert summary is not None
        self.assertEqual(summary.normalized_employer_name, "acme analytics")
        self.assertEqual(summary.total_records, 2)
        self.assertEqual(summary.certified, 2)
        self.assertEqual(summary.denied, 0)
        self.assertEqual(summary.fiscal_years, (2024, 2026))
        self.assertEqual(summary.latest_decision_date, "2026-02-15")
        self.assertIn(("Software Engineer", 1), summary.top_job_titles)

    def test_writes_jsonl_output(self) -> None:
        result = parse_perm_file(
            "data/fixtures/raw/oflc_perm_fy2024_new_form.csv",
            source_file_id="oflc_perm_fy2024_new_form",
            fiscal_year=2024,
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            output_path = Path(tmp_dir) / "perm.jsonl"
            count = write_perm_jsonl(output_path, result.records)
            payloads = [
                json.loads(line)
                for line in output_path.read_text(encoding="utf-8").splitlines()
            ]

        self.assertEqual(count, 2)
        self.assertEqual(payloads[0]["annualized_wage_offer_from"], 130000)
        self.assertEqual(payloads[1]["annualized_wage_offer_from"], 129600)


if __name__ == "__main__":
    unittest.main()
