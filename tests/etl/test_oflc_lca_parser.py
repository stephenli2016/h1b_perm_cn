from __future__ import annotations

import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from etl.parsers.oflc_lca import (
    annualize_wage,
    normalize_lca_row,
    parse_lca_file,
    parse_number,
    read_tabular_rows,
    write_lca_jsonl,
)


class OflcLcaParserTests(unittest.TestCase):
    def test_parses_project_lca_fixture(self) -> None:
        result = parse_lca_file(
            "data/fixtures/raw/oflc_lca_fy2026_q2.csv",
            source_file_id="oflc_lca_fy2026_q2",
            fiscal_year=2026,
        )

        self.assertEqual(result.records_seen, 3)
        self.assertEqual(result.records_inserted, 3)
        self.assertEqual(result.duplicate_records, 0)

        first = result.records[0]
        self.assertEqual(first.case_number, "I-200-26001-000001")
        self.assertEqual(first.case_status, "Certified")
        self.assertEqual(first.visa_class, "H-1B")
        self.assertEqual(first.raw_employer_name, "ACME ANALYTICS LLC")
        self.assertEqual(first.normalized_employer_name, "acme analytics")
        self.assertEqual(first.fiscal_year, 2026)
        self.assertEqual(first.soc_code, "15-1252")
        self.assertEqual(first.worksite_city, "Seattle")
        self.assertEqual(first.worksite_state, "WA")
        self.assertEqual(first.worksite_postal_code, "98101")
        self.assertEqual(first.wage_rate_of_pay_from, 135000)
        self.assertEqual(first.annualized_wage_from, 135000)
        self.assertEqual(first.annualized_wage_to, 145000)
        self.assertEqual(first.annualized_prevailing_wage, 108900)
        self.assertTrue(first.full_time)
        self.assertEqual(first.decision_date, "2025-10-20")

    def test_annualizes_hourly_and_monthly_wages(self) -> None:
        self.assertEqual(annualize_wage(57.5, "Hour"), 119600)
        self.assertEqual(annualize_wage(9800, "Month"), 117600)
        self.assertEqual(annualize_wage(2500, "Bi-Weekly"), 65000)
        self.assertEqual(annualize_wage(1800, "Week"), 93600)
        self.assertEqual(annualize_wage(450, "Day"), 117000)
        self.assertIsNone(annualize_wage(100, "Piece"))
        self.assertIsNone(annualize_wage(None, "Year"))

    def test_parses_numbers_with_currency_formatting(self) -> None:
        self.assertEqual(parse_number("$135,000.50"), 135000.5)
        self.assertIsNone(parse_number("--"))
        self.assertIsNone(parse_number("not a number"))

    def test_deduplicates_by_source_record_fingerprint(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            csv_path = Path(tmp_dir) / "dupes.csv"
            csv_path.write_text(
                "CASE_NUMBER,CASE_STATUS,EMPLOYER_NAME,WAGE_RATE_OF_PAY_FROM,WAGE_UNIT_OF_PAY,DECISION_DATE\n"
                "I-200-26001-000001,Certified,ACME ANALYTICS LLC,100000,Year,2025-10-20\n"
                "I-200-26001-000001,Certified,ACME ANALYTICS LLC,100000,Year,2025-10-20\n",
                encoding="utf-8",
            )

            result = parse_lca_file(csv_path, source_file_id="dupe_source", fiscal_year=2026)

        self.assertEqual(result.records_seen, 2)
        self.assertEqual(result.records_inserted, 1)
        self.assertEqual(result.duplicate_records, 1)

    def test_sanitizes_obvious_pii_from_raw_record_json(self) -> None:
        record = normalize_lca_row(
            {
                "CASE_NUMBER": "I-200-26001-000001",
                "EMPLOYER_NAME": "ACME ANALYTICS LLC",
                "FOREIGN_WORKER_NAME": "Private Person",
                "EMPLOYER_FEIN": "12-3456789",
                "ATTORNEY_EMAIL": "lawyer@example.com",
                "EMPLOYER_ADDRESS1": "1 Private Street",
                "WORKSITE_CITY": "Seattle",
                "DECISION_DATE": "2025-10-20",
            },
            source_file_id="privacy_source",
            fallback_fiscal_year=2026,
        )

        self.assertNotIn("FOREIGN_WORKER_NAME", record.raw_record_json)
        self.assertNotIn("EMPLOYER_FEIN", record.raw_record_json)
        self.assertNotIn("ATTORNEY_EMAIL", record.raw_record_json)
        self.assertNotIn("EMPLOYER_ADDRESS1", record.raw_record_json)
        self.assertEqual(record.raw_record_json["WORKSITE_CITY"], "Seattle")

    def test_reads_minimal_xlsx_layout(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            xlsx_path = Path(tmp_dir) / "sample.xlsx"
            _write_minimal_xlsx(
                xlsx_path,
                [
                    ["CASE_NUMBER", "EMPLOYER_NAME", "WAGE_RATE_OF_PAY_FROM", "WAGE_UNIT_OF_PAY", "DECISION_DATE"],
                    ["I-200-26001-000001", "ACME ANALYTICS LLC", "100000", "Year", "2025-10-20"],
                ],
            )

            rows = list(read_tabular_rows(xlsx_path))
            result = parse_lca_file(xlsx_path, source_file_id="xlsx_source", fiscal_year=2026)

        self.assertEqual(rows[0]["CASE_NUMBER"], "I-200-26001-000001")
        self.assertEqual(result.records_inserted, 1)
        self.assertEqual(result.records[0].annualized_wage_from, 100000)

    def test_writes_jsonl_output(self) -> None:
        result = parse_lca_file(
            "data/fixtures/raw/oflc_lca_fy2025_q4.csv",
            source_file_id="oflc_lca_fy2025_q4",
            fiscal_year=2025,
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            output_path = Path(tmp_dir) / "records.jsonl"
            count = write_lca_jsonl(output_path, result.records)
            payloads = [
                json.loads(line)
                for line in output_path.read_text(encoding="utf-8").splitlines()
            ]

        self.assertEqual(count, 3)
        self.assertEqual(payloads[1]["annualized_wage_from"], 117600)
        self.assertEqual(payloads[1]["wage_unit"], "Month")


def _write_minimal_xlsx(path: Path, rows: list[list[str]]) -> None:
    shared_strings: list[str] = []
    shared_index: dict[str, int] = {}

    def string_index(value: str) -> int:
        if value not in shared_index:
            shared_index[value] = len(shared_strings)
            shared_strings.append(value)
        return shared_index[value]

    row_xml = []
    for row_number, row in enumerate(rows, start=1):
        cells = []
        for column_number, value in enumerate(row, start=1):
            ref = f"{_column_name(column_number)}{row_number}"
            cells.append(f'<c r="{ref}" t="s"><v>{string_index(value)}</v></c>')
        row_xml.append(f'<row r="{row_number}">{"".join(cells)}</row>')

    shared_xml = "".join(f"<si><t>{value}</t></si>" for value in shared_strings)

    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr(
            "[Content_Types].xml",
            '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
        )
        archive.writestr(
            "xl/workbook.xml",
            '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="LCA" sheetId="1" r:id="rId1"/></sheets></workbook>',
        )
        archive.writestr(
            "xl/worksheets/sheet1.xml",
            '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
            + "".join(row_xml)
            + "</sheetData></worksheet>",
        )
        archive.writestr(
            "xl/sharedStrings.xml",
            '<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            + shared_xml
            + "</sst>",
        )


def _column_name(index: int) -> str:
    letters = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        letters = chr(ord("A") + remainder) + letters
    return letters


if __name__ == "__main__":
    unittest.main()
