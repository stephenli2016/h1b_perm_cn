import csv
import tempfile
import unittest
from pathlib import Path

from etl.production_aggregates import prepare_production_aggregate_package


class ProductionAggregatePackageTest(unittest.TestCase):
    def test_prepares_bounded_company_aggregate_csvs(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            csv_dir = root / "postgres_import" / "csv"
            csv_dir.mkdir(parents=True)
            output_dir = root / "postgres_aggregates"

            _write_csv(
                csv_dir / "company_page_metrics.csv",
                [
                    {
                        "id": "metrics-emp-a",
                        "employer_id": "emp-a",
                        "quality_score": "90",
                        "lca_count_5y": "2",
                        "perm_count_5y": "1",
                    },
                    {
                        "id": "metrics-emp-b",
                        "employer_id": "emp-b",
                        "quality_score": "10",
                        "lca_count_5y": "1",
                        "perm_count_5y": "0",
                    },
                ],
            )
            _write_csv(
                csv_dir / "source_files.csv",
                [
                    {
                        "id": "source-h1b",
                        "source_name": "DOL OFLC LCA",
                        "latest_data_date": "2026-03-31",
                    },
                    {
                        "id": "source-perm",
                        "source_name": "DOL OFLC PERM",
                        "latest_data_date": "2026-02-28",
                    },
                    {
                        "id": "source-uscis",
                        "source_name": "USCIS H-1B Employer Data Hub",
                        "latest_data_date": "2025-09-30",
                    },
                ],
            )
            _write_csv(
                csv_dir / "h1b_lca_records.csv",
                [
                    _h1b_row("h1b-1", "emp-a", "CERTIFIED", "2026", "Engineer"),
                    _h1b_row("h1b-2", "emp-a", "DENIED", "2025", "Analyst"),
                    _h1b_row("h1b-3", "emp-b", "CERTIFIED", "2026", "Excluded"),
                ],
            )
            _write_csv(
                csv_dir / "perm_records.csv",
                [
                    _perm_row("perm-1", "emp-a", "Certified", "2026", "Engineer"),
                ],
            )
            _write_csv(
                csv_dir / "uscis_h1b_employer_records.csv",
                [
                    {
                        "id": "uscis-1",
                        "source_file_id": "source-uscis",
                        "employer_id": "emp-a",
                        "fiscal_year": "2026",
                        "initial_approvals": "3",
                        "initial_denials": "1",
                        "continuing_approvals": "5",
                        "continuing_denials": "0",
                    }
                ],
            )

            package = prepare_production_aggregate_package(
                import_dir=csv_dir.parent,
                output_dir=output_dir,
                target_limit=1,
                top_breakdowns_per_company=5,
                recent_samples_per_company=2,
            )

            self.assertEqual(package.table_counts["company_wage_stats"], 1)
            self.assertEqual(package.table_counts["company_recent_h1b_samples"], 2)
            self.assertEqual(package.table_counts["company_recent_perm_samples"], 1)
            yearly_rows = _read_csv(
                output_dir / "csv" / "company_yearly_immigration_stats.csv",
            )
            self.assertEqual({row["employer_id"] for row in yearly_rows}, {"emp-a"})
            self.assertEqual(
                sum(int(row["h1b_total"]) for row in yearly_rows),
                2,
            )
            self.assertIn("\\copy public.company_wage_stats", Path(package.load_order_sql).read_text())


def _write_csv(path: Path, rows: list[dict[str, str]]):
    fieldnames = list(rows[0].keys())
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _read_csv(path: Path):
    with path.open("r", newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def _h1b_row(
    row_id: str,
    employer_id: str,
    case_status: str,
    fiscal_year: str,
    job_title: str,
):
    return {
        "id": row_id,
        "source_file_id": "source-h1b",
        "employer_id": employer_id,
        "location_id": "loc-a",
        "source_record_id": row_id,
        "source_record_fingerprint": f"fp-{row_id}",
        "case_number": f"CASE-{row_id}",
        "case_status": case_status,
        "raw_employer_name": "Employer A",
        "fiscal_year": fiscal_year,
        "soc_code": "15-1252",
        "soc_title": "Software Developers",
        "job_title": job_title,
        "worksite_city": "Seattle",
        "worksite_state": "WA",
        "wage_rate_of_pay_from": "120000",
        "wage_rate_of_pay_to": "",
        "wage_unit": "Year",
        "annualized_wage_from": "120000",
        "annualized_wage_to": "",
        "prevailing_wage": "100000",
        "prevailing_wage_unit": "Year",
        "wage_level": "II",
        "full_time": "true",
        "received_date": "2026-01-01",
        "decision_date": f"{fiscal_year}-02-01",
    }


def _perm_row(
    row_id: str,
    employer_id: str,
    case_status: str,
    fiscal_year: str,
    job_title: str,
):
    return {
        "id": row_id,
        "source_file_id": "source-perm",
        "employer_id": employer_id,
        "location_id": "loc-a",
        "source_record_id": row_id,
        "source_record_fingerprint": f"fp-{row_id}",
        "case_number": f"PERM-{row_id}",
        "case_status": case_status,
        "raw_employer_name": "Employer A",
        "fiscal_year": fiscal_year,
        "job_title": job_title,
        "soc_code": "15-1252",
        "soc_title": "Software Developers",
        "worksite_city": "Seattle",
        "worksite_state": "WA",
        "wage_offer_from": "130000",
        "wage_offer_to": "",
        "wage_unit": "Year",
        "priority_date": "2026-01-01",
        "received_date": "2026-01-01",
        "decision_date": f"{fiscal_year}-03-01",
    }


if __name__ == "__main__":
    unittest.main()
