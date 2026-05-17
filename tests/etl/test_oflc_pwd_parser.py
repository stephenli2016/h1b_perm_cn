from __future__ import annotations

import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from etl.parsers.oflc_pwd import (
    lookup_prevailing_wage,
    match_wage_level,
    parse_pwd_file,
    read_pwd_rows,
    write_pwd_jsonl,
)


class OflcPwdParserTests(unittest.TestCase):
    def test_parses_pwd_disclosure_fixture(self) -> None:
        result = parse_pwd_file(
            "data/fixtures/raw/oflc_pwd_fy2026_q2.csv",
            source_file_id="oflc_pwd_fy2026_q2",
            effective_year=2026,
            data_series="DOL OFLC Prevailing Wage Disclosure Data",
        )

        self.assertEqual(result.records_seen, 3)
        self.assertEqual(result.records_inserted, 3)
        self.assertEqual(result.duplicate_records, 0)

        first = result.records[0]
        self.assertEqual(first.source_record_id, "PWD-2026-000001")
        self.assertEqual(first.data_series, "OFLC PWD")
        self.assertEqual(first.effective_year, 2026)
        self.assertEqual(first.soc_code, "15-1252")
        self.assertEqual(first.soc_title, "Software Developers")
        self.assertEqual(first.area_name, "Seattle-Tacoma-Bellevue WA")
        self.assertEqual(first.city, "Seattle")
        self.assertEqual(first.state, "WA")
        self.assertEqual(first.wage_level_2, 108900)
        self.assertEqual(first.wage_unit, "Year")

    def test_parses_flag_oews_wage_fixture(self) -> None:
        result = parse_pwd_file(
            "data/fixtures/raw/flag_oews_wage_2025_2026.csv",
            source_file_id="flag_oews_wage_2025_2026",
            data_series="DOL FLAG OFLC Wage Data Downloads",
        )

        self.assertEqual(result.records_seen, 3)
        self.assertEqual(result.records_inserted, 3)

        seattle = result.records[0]
        worcester = result.records[2]
        self.assertEqual(seattle.effective_year, 2026)
        self.assertEqual(seattle.area_name, "Seattle-Tacoma-Bellevue WA")
        self.assertEqual(seattle.wage_level_4, 153900)
        self.assertEqual(worcester.soc_code, "15-2051")
        self.assertEqual(worcester.wage_unit, "Hour")
        self.assertEqual(worcester.wage_level_1, 43.25)

    def test_lookup_prefers_exact_city_then_area_then_state_fallback(self) -> None:
        records = parse_pwd_file(
            "data/fixtures/raw/oflc_pwd_fy2026_q2.csv",
            source_file_id="oflc_pwd_fy2026_q2",
            effective_year=2026,
        ).records

        exact = lookup_prevailing_wage(
            records,
            soc_code="15-1252",
            city="Seattle",
            state="WA",
            effective_year=2026,
        )
        area = lookup_prevailing_wage(
            records,
            soc_code="15-1252",
            city="Bellevue",
            state="WA",
            effective_year=2026,
        )
        state = lookup_prevailing_wage(
            records,
            soc_code="15-1252",
            city="Spokane",
            state="WA",
            effective_year=2026,
        )
        missing = lookup_prevailing_wage(
            records,
            soc_code="99-9999",
            city="Seattle",
            state="WA",
            effective_year=2026,
        )

        self.assertEqual(exact.status, "matched")
        self.assertEqual(exact.match_scope, "city_state")
        self.assertEqual(exact.record.wage_level_2 if exact.record else None, 108900)
        self.assertEqual(area.status, "matched")
        self.assertEqual(area.match_scope, "area_name")
        self.assertEqual(state.status, "fallback")
        self.assertEqual(state.match_scope, "state")
        self.assertEqual(state.record.area_name if state.record else None, "Washington Statewide")
        self.assertEqual(missing.status, "not_found")

    def test_matches_wage_amount_to_available_levels(self) -> None:
        record = parse_pwd_file(
            "data/fixtures/raw/oflc_pwd_fy2026_q2.csv",
            source_file_id="oflc_pwd_fy2026_q2",
            effective_year=2026,
        ).records[0]

        middle = match_wage_level(record, 119600)
        below = match_wage_level(record, 70000)
        high = match_wage_level(record, 160000)

        self.assertEqual(middle.band, "level_2_to_3")
        self.assertEqual(middle.lower_level, 2)
        self.assertEqual(middle.next_level, 3)
        self.assertEqual(below.band, "below_level_1")
        self.assertEqual(below.next_level, 1)
        self.assertEqual(high.band, "level_4_or_above")

    def test_reads_zip_wage_downloads_with_csv_member(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            zip_path = Path(tmp_dir) / "wages.zip"
            with zipfile.ZipFile(zip_path, "w") as archive:
                archive.writestr(
                    "nested/OFLC_Wages.csv",
                    "AREA_NAME,STATE,SOC_CODE,OCCUPATION_TITLE,LEVEL_1_WAGE,"
                    "LEVEL_2_WAGE,LEVEL_3_WAGE,LEVEL_4_WAGE,WAGE_UNIT,WAGE_YEAR\n"
                    "Seattle-Tacoma-Bellevue WA,WA,15-1252,Software Developers,"
                    "86400,108900,131400,153900,Year,2025-2026\n",
                )

            rows = list(read_pwd_rows(zip_path))
            result = parse_pwd_file(
                zip_path,
                source_file_id="zip_source",
                data_series="FLAG zip fixture",
            )

        self.assertEqual(rows[0]["SOC_CODE"], "15-1252")
        self.assertEqual(result.records_inserted, 1)
        self.assertEqual(result.records[0].effective_year, 2026)
        self.assertEqual(result.records[0].wage_level_2, 108900)

    def test_reads_official_flag_wage_zip_layout(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            zip_path = Path(tmp_dir) / "flag-wages.zip"
            with zipfile.ZipFile(zip_path, "w") as archive:
                archive.writestr(
                    "OFLC_Wages_2025-26/Geography.csv",
                    "Area,AreaName,StateAb,State,CountyTownName\n"
                    "42660,Seattle-Tacoma-Bellevue WA,WA,Washington,King County\n",
                )
                archive.writestr(
                    "OFLC_Wages_2025-26/oes_soc_occs.csv",
                    "soccode,Title,Description\n"
                    "15-1252,Software Developers,Build software\n",
                )
                archive.writestr(
                    "OFLC_Wages_2025-26/ALC_Export.csv",
                    "Area,SocCode,GeoLvl,Level1,Level2,Level3,Level4,Average,Label\n"
                    "42660,15-1252,1,41.54,52.36,63.17,73.99,63.02,\n",
                )

            rows = list(read_pwd_rows(zip_path))
            result = parse_pwd_file(
                zip_path,
                source_file_id="flag_zip_source",
                effective_year=2026,
                data_series="DOL FLAG OFLC Wage Data Downloads",
            )

        self.assertEqual(rows[0]["SOC_CODE"], "15-1252")
        self.assertEqual(rows[0]["SOC_TITLE"], "Software Developers")
        self.assertEqual(rows[0]["AREA_NAME"], "Seattle-Tacoma-Bellevue WA")
        self.assertEqual(rows[0]["STATE"], "WA")
        self.assertEqual(result.records_inserted, 1)
        self.assertEqual(result.records[0].wage_unit, "Hour")
        self.assertEqual(result.records[0].wage_level_4, 73.99)

    def test_writes_jsonl_output(self) -> None:
        result = parse_pwd_file(
            "data/fixtures/raw/flag_oews_wage_2025_2026.csv",
            source_file_id="flag_oews_wage_2025_2026",
            data_series="DOL FLAG OFLC Wage Data Downloads",
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            output_path = Path(tmp_dir) / "pwd.jsonl"
            count = write_pwd_jsonl(output_path, result.records)
            payloads = [
                json.loads(line)
                for line in output_path.read_text(encoding="utf-8").splitlines()
            ]

        self.assertEqual(count, 3)
        self.assertEqual(payloads[0]["soc_code"], "15-1252")
        self.assertEqual(payloads[2]["wage_unit"], "Hour")


if __name__ == "__main__":
    unittest.main()
