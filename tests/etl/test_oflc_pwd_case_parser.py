from __future__ import annotations

import unittest

from etl.parsers.oflc_pwd_case import iter_pwd_case_records, normalize_pwd_case_row


class OflcPwdCaseParserTests(unittest.TestCase):
    def test_parses_pwd_case_fixture(self) -> None:
        records = list(
            iter_pwd_case_records(
                "data/fixtures/raw/oflc_pwd_case_fy2026_q2.csv",
                source_file_id="oflc_pwd_fy2026_q2",
                fiscal_year=2026,
            )
        )

        self.assertEqual(len(records), 2)
        first = records[0]
        self.assertEqual(first.case_number, "P-100-26001-000001")
        self.assertEqual(first.raw_employer_name, "ACME ANALYTICS LLC")
        self.assertEqual(first.normalized_employer_name, "acme analytics")
        self.assertEqual(first.soc_code, "15-1252")
        self.assertEqual(first.worksite_city, "Seattle")
        self.assertEqual(first.worksite_state, "WA")
        self.assertEqual(first.pwd_wage_rate, 108900)
        self.assertEqual(first.annualized_pwd_wage, 108900)

    def test_parses_current_official_pwd_case_fields(self) -> None:
        record = normalize_pwd_case_row(
            {
                "CASE_NUMBER": "P-100-26001-000001",
                "CASE_STATUS": "Determination Issued",
                "VISA_CLASS": "PERM",
                "EMPLOYER_LEGAL_BUSINESS_NAME": "ACME ANALYTICS LLC",
                "JOB_TITLE": "Software Engineer",
                "EMP_SOC_CODES": "15-1252",
                "EMP_SOC_TITLES": "Software Developers",
                "PRIMARY_WORKSITE_CITY": "Seattle",
                "PRIMARY_WORKSITE_STATE": "WA",
                "PWD_WAGE_RATE": "57.50",
                "PWD_UNIT_OF_PAY": "Hour",
                "PWD_OES_WAGE_LEVEL": "Level II",
                "REQUIRED_EDUCATION_LEVEL": "Bachelor's",
                "REQUIRED_EXPERIENCE_MONTHS": "24",
                "SPEC_REQ_FOREIGN_LANG": "N",
                "DETERMINATION_DATE": "2026-02-15",
            },
            source_file_id="official_fields",
            fallback_fiscal_year=2026,
        )

        self.assertEqual(record.case_status, "Determination Issued")
        self.assertEqual(record.soc_title, "Software Developers")
        self.assertEqual(record.annualized_pwd_wage, 119600)
        self.assertEqual(record.required_experience_months, 24)
        self.assertFalse(record.foreign_language_required)


if __name__ == "__main__":
    unittest.main()
