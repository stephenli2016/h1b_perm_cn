from __future__ import annotations

import csv
import gzip
import json
import tempfile
import unittest
from pathlib import Path

from etl.production_import import prepare_postgres_import_package


class ProductionImportPackageTests(unittest.TestCase):
    def test_prepares_postgres_csv_package_from_normalized_jsonl(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            normalized_dir = Path(temp_dir) / "normalized"
            _write_minimal_normalized_inputs(normalized_dir)

            package = prepare_postgres_import_package(
                manifest_path="data/source_manifest.json",
                normalized_dir=normalized_dir,
                output_dir=Path(temp_dir) / "postgres_import",
            )

            output_dir = Path(package.output_dir)
            self.assertTrue((output_dir / "load_order.sql").exists())
            self.assertTrue((output_dir / "production_import_report.md").exists())
            self.assertGreater(package.table_counts["employers"], 0)
            self.assertGreater(package.table_counts["h1b_lca_records"], 0)
            self.assertGreater(package.table_counts["h1b_lca_worksite_records"], 0)
            self.assertGreater(package.table_counts["h1b_lca_appendix_a_records"], 0)
            self.assertGreater(package.table_counts["perm_records"], 0)
            self.assertGreater(package.table_counts["pwd_case_records"], 0)
            self.assertGreater(package.table_counts["visa_bulletin_months"], 0)
            self.assertGreater(package.table_counts["bls_oews_occupations"], 0)
            self.assertGreater(package.table_counts["bls_oews_areas"], 0)
            self.assertGreater(package.table_counts["naics_industries"], 0)
            self.assertGreater(package.table_counts["onet_occupations"], 0)
            self.assertGreater(package.table_counts["onet_job_zones"], 0)

            with (output_dir / "csv" / "h1b_lca_records.csv").open(
                "r",
                encoding="utf-8",
                newline="",
            ) as handle:
                rows = list(csv.DictReader(handle))

            self.assertGreater(len(rows), 0)
            self.assertEqual(rows[0]["case_status"], "CERTIFIED")
            self.assertNotIn("FOREIGN_WORKER", rows[0]["raw_record_json"])

            load_sql = (output_dir / "load_order.sql").read_text(encoding="utf-8")
            self.assertIn("\\copy public.locations", load_sql)
            self.assertIn("\\copy public.pwd_case_records", load_sql)
            self.assertIn("\\copy public.bls_oews_areas", load_sql)
            self.assertIn("\\copy public.naics_industries", load_sql)
            self.assertIn("\\copy public.onet_job_zones", load_sql)
            self.assertIn("\\copy public.company_page_metrics", load_sql)


def _write_minimal_normalized_inputs(normalized_dir: Path) -> None:
    employer_id = "emp-acme-analytics"
    _write_jsonl(
        normalized_dir / "employers.jsonl",
        [
            {
                "id": employer_id,
                "canonical_name": "ACME ANALYTICS LLC",
                "display_name": "ACME Analytics",
                "slug": "acme-analytics",
                "normalized_name": "acme analytics",
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "employer_aliases.jsonl",
        [
            {
                "id": "alias-acme",
                "employer_id": employer_id,
                "raw_name": "ACME ANALYTICS LLC",
                "normalized_name": "acme analytics",
                "source_system": "oflc_lca",
                "confidence_score": 1.0,
                "review_status": "auto",
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "company_page_candidates.jsonl",
        [
            {
                "employer_id": employer_id,
                "lca_count_5y": 1,
                "perm_count_5y": 1,
                "uscis_record_count_5y": 1,
                "job_title_count": 1,
                "location_count": 1,
                "latest_fiscal_year": 2026,
                "quality_score": 80,
                "indexable": True,
                "noindex_reason": None,
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "h1b_lca_records.jsonl.gz",
        [
            {
                "source_file_id": "oflc_lca_fy2026_q2",
                "source_record_id": "I-200-26001-000001",
                "source_record_fingerprint": "lca-fingerprint",
                "case_number": "I-200-26001-000001",
                "case_status": "Certified",
                "visa_class": "H-1B",
                "raw_employer_name": "ACME ANALYTICS LLC",
                "normalized_employer_name": "acme analytics",
                "fiscal_year": 2026,
                "soc_code": "15-1252",
                "soc_title": "Software Developers",
                "job_title": "Software Engineer",
                "worksite_city": "Seattle",
                "worksite_state": "WA",
                "worksite_postal_code": "98101",
                "wage_rate_of_pay_from": 120000,
                "wage_rate_of_pay_to": None,
                "wage_unit": "Year",
                "annualized_wage_from": 120000,
                "annualized_wage_to": None,
                "prevailing_wage": 100000,
                "prevailing_wage_unit": "Year",
                "wage_level": "II",
                "full_time": True,
                "received_date": "2026-01-01",
                "decision_date": "2026-01-05",
                "raw_record_json": {"WORKSITE_CITY": "Seattle"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "h1b_lca_worksite_records.jsonl.gz",
        [
            {
                "source_file_id": "oflc_lca_worksites_fy2026_q2",
                "source_record_id": "I-200-26001-000001:1",
                "source_record_fingerprint": "lca-worksite-fingerprint",
                "case_number": "I-200-26001-000001",
                "fiscal_year": 2026,
                "worksite_sequence": 1,
                "workers": 1,
                "secondary_entity": False,
                "secondary_entity_name": None,
                "worksite_city": "Seattle",
                "worksite_county": "King",
                "worksite_state": "WA",
                "worksite_postal_code": "98101",
                "raw_record_json": {"WORKSITE_CITY": "Seattle"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "h1b_lca_appendix_a_records.jsonl.gz",
        [
            {
                "source_file_id": "oflc_lca_appendix_a_fy2026_q2",
                "source_record_id": "I-200-26001-000001:a",
                "source_record_fingerprint": "lca-appendix-fingerprint",
                "case_number": "I-200-26001-000001",
                "fiscal_year": 2026,
                "exempt_worker_count": 0,
                "h1b_dependent": False,
                "willful_violator": False,
                "raw_record_json": {"H1B_DEPENDENT": "N"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "perm_records.jsonl.gz",
        [
            {
                "source_file_id": "oflc_perm_fy2026_q2",
                "source_record_id": "G-100-26001-000001",
                "source_record_fingerprint": "perm-fingerprint",
                "case_number": "G-100-26001-000001",
                "case_status": "Certified",
                "raw_employer_name": "ACME ANALYTICS LLC",
                "normalized_employer_name": "acme analytics",
                "fiscal_year": 2026,
                "job_title": "Software Engineer",
                "soc_code": "15-1252",
                "soc_title": "Software Developers",
                "worksite_city": "Seattle",
                "worksite_state": "WA",
                "wage_offer_from": 120000,
                "wage_offer_to": None,
                "wage_unit": "Year",
                "priority_date": None,
                "received_date": "2026-01-01",
                "decision_date": "2026-01-05",
                "raw_record_json": {"WORKSITE_CITY": "Seattle"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "pwd_records.jsonl.gz",
        [
            {
                "source_file_id": "flag_oews_wage_2025_2026",
                "source_record_id": "pwd-1",
                "source_record_fingerprint": "pwd-fingerprint",
                "data_series": "FLAG wage fixture",
                "effective_year": 2026,
                "soc_code": "15-1252",
                "soc_title": "Software Developers",
                "area_name": "Seattle-Tacoma-Bellevue WA",
                "city": "Seattle",
                "state": "WA",
                "wage_level_1": 90000,
                "wage_level_2": 110000,
                "wage_level_3": 130000,
                "wage_level_4": 150000,
                "wage_unit": "Year",
                "raw_record_json": {"AREA_NAME": "Seattle-Tacoma-Bellevue WA"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "pwd_case_records.jsonl.gz",
        [
            {
                "source_file_id": "oflc_pwd_fy2026_q2",
                "source_record_id": "P-100-26001-000001",
                "source_record_fingerprint": "pwd-case-fingerprint",
                "case_number": "P-100-26001-000001",
                "case_status": "Determination Issued",
                "visa_class": "PERM",
                "raw_employer_name": "ACME ANALYTICS LLC",
                "normalized_employer_name": "acme analytics",
                "fiscal_year": 2026,
                "naics_code": "541511",
                "job_title": "Software Engineer",
                "soc_code": "15-1252",
                "soc_title": "Software Developers",
                "worksite_city": "Seattle",
                "worksite_county": "King",
                "worksite_state": "WA",
                "worksite_postal_code": "98101",
                "pwd_wage_rate": 100000,
                "pwd_unit": "Year",
                "annualized_pwd_wage": 100000,
                "pwd_wage_level": "II",
                "pwd_wage_source": "OES",
                "bls_area": "Seattle-Tacoma-Bellevue WA",
                "required_education_level": "Bachelor's",
                "required_experience_months": 24,
                "received_date": "2026-01-01",
                "determination_date": "2026-01-05",
                "expiration_date": "2026-06-30",
                "raw_record_json": {"WORKSITE_CITY": "Seattle"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "uscis_h1b_employer_records.jsonl.gz",
        [
            {
                "source_file_id": "uscis_h1b_employer_data_fy2023",
                "source_record_id": "uscis-1",
                "source_record_fingerprint": "uscis-fingerprint",
                "fiscal_year": 2023,
                "raw_employer_name": "ACME ANALYTICS LLC",
                "normalized_employer_name": "acme analytics",
                "city": "Seattle",
                "state": "WA",
                "postal_code": "98101",
                "naics_code": "541511",
                "initial_approvals": 1,
                "initial_denials": 0,
                "continuing_approvals": 1,
                "continuing_denials": 0,
                "raw_record_json": {"CITY": "Seattle"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "visa_bulletin_dates.jsonl",
        [
            {
                "record_type": "month",
                "source_file_id": "dos_visa_bulletin_2026_06",
                "month_key": "2026-06",
                "bulletin_year": 2026,
                "bulletin_month": 6,
                "source_url": "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/2026/visa-bulletin-for-june-2026.html",
                "published_at": "2026-05-01",
            },
            {
                "record_type": "date",
                "source_file_id": "dos_visa_bulletin_2026_06",
                "month_key": "2026-06",
                "category": "EB-2",
                "chargeability_area": "china-mainland",
                "chart_type": "final_action",
                "cutoff_status": "date",
                "cutoff_date": "2021-09-01",
                "raw_value": "01SEP21",
            },
        ],
    )
    _write_jsonl(
        normalized_dir / "uscis_filing_charts.jsonl",
        [
            {
                "source_file_id": "uscis_filing_chart_2026_06",
                "month_key": "2026-06",
                "employment_based_chart": "final_action",
                "raw_text": "For employment-based filings use Final Action Dates.",
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "bls_oews_occupations.jsonl.gz",
        [
            {
                "source_file_id": "bls_oews_occupation_metadata_2025",
                "source_record_id": "15-1252",
                "source_record_fingerprint": "bls-occ-fingerprint",
                "release_year": 2025,
                "occupation_code": "15-1252",
                "occupation_name": "Software Developers",
                "display_level": 1,
                "selectable": True,
                "sort_sequence": 1,
                "raw_record_json": {"OCCUPATION_CODE": "15-1252"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "bls_oews_areas.jsonl.gz",
        [
            {
                "source_file_id": "bls_oews_area_metadata_2025",
                "source_record_id": "42660",
                "source_record_fingerprint": "bls-area-fingerprint",
                "release_year": 2025,
                "area_code": "42660",
                "area_name": "Seattle-Tacoma-Bellevue WA",
                "area_type_code": "M",
                "display_level": 1,
                "selectable": True,
                "sort_sequence": 1,
                "raw_record_json": {"AREA_CODE": "42660"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "naics_industries.jsonl.gz",
        [
            {
                "source_file_id": "census_naics_2022_structure",
                "source_record_id": "541511",
                "source_record_fingerprint": "naics-fingerprint",
                "release_year": 2022,
                "naics_code": "541511",
                "industry_title": "Custom Computer Programming Services",
                "classification_level": "national_industry",
                "sector_code": "54",
                "sector_title": "Professional, Scientific, and Technical Services",
                "change_indicator": None,
                "trilateral": None,
                "raw_record_json": {"NAICS_CODE": "541511"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "onet_occupations.jsonl.gz",
        [
            {
                "source_file_id": "onet_occupation_data_30_2",
                "source_record_id": "15-1252.00",
                "source_record_fingerprint": "onet-occ-fingerprint",
                "release_version": "30.2",
                "onet_soc_code": "15-1252.00",
                "soc_code": "15-1252",
                "occupation_title": "Software Developers",
                "description": "Research, design, and develop software.",
                "job_family_code": "15",
                "job_family_title": "Computer and Mathematical Occupations",
                "raw_record_json": {"O_NET_SOC_CODE": "15-1252.00"},
            }
        ],
    )
    _write_jsonl(
        normalized_dir / "onet_job_zones.jsonl.gz",
        [
            {
                "source_file_id": "onet_job_zones_30_2",
                "source_record_id": "15-1252.00:zone-4",
                "source_record_fingerprint": "onet-zone-fingerprint",
                "release_version": "30.2",
                "onet_soc_code": "15-1252.00",
                "soc_code": "15-1252",
                "occupation_title": "Software Developers",
                "job_zone": 4,
                "job_zone_name": "Job Zone 4: Considerable Preparation Needed",
                "experience": "A considerable amount of work-related skill is needed.",
                "education": "Most occupations require a bachelor's degree.",
                "job_training": "Several years of work-related experience may be needed.",
                "examples": "Software developers and systems analysts.",
                "svp_range": "7.0 to < 8.0",
                "date_updated": "02/2026",
                "domain_source": "Analyst",
                "raw_record_json": {"JOB_ZONE": "4"},
            }
        ],
    )


def _write_jsonl(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = "".join(json.dumps(row, sort_keys=True) + "\n" for row in rows)
    if path.suffix == ".gz":
        with gzip.open(path, "wt", encoding="utf-8") as handle:
            handle.write(payload)
        return

    path.write_text(payload, encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
