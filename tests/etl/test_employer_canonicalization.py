from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from etl.employer_canonicalization import (
    ManualAliasSeed,
    SourceEmployerRecord,
    build_company_canonicalization,
    decide_indexability,
    load_manual_alias_seeds,
    load_source_records_from_jsonl,
    normalize_employer_name,
    score_company_candidate,
    write_jsonl,
)


class EmployerCanonicalizationTest(unittest.TestCase):
    def test_normalizes_employer_names_with_legal_suffixes(self) -> None:
        self.assertEqual(
            normalize_employer_name("The Acme Analytics, L.L.C."),
            "acme analytics",
        )
        self.assertEqual(
            normalize_employer_name("AT&T Services Incorporated"),
            "at and t services",
        )

    def test_builds_auditable_aliases_without_fuzzy_merges(self) -> None:
        records = (
            SourceEmployerRecord(
                source_system="oflc_lca",
                raw_employer_name="ACME ANALYTICS LLC",
                normalized_employer_name=normalize_employer_name("ACME ANALYTICS LLC"),
                fiscal_year=2026,
                job_title="Software Engineer",
                city="Seattle",
                state="WA",
                soc_code="15-1252",
            ),
            SourceEmployerRecord(
                source_system="oflc_perm",
                raw_employer_name="ACME ANALYTICS, L.L.C.",
                normalized_employer_name=normalize_employer_name(
                    "ACME ANALYTICS, L.L.C."
                ),
                fiscal_year=2026,
                job_title="Data Engineer",
                city="Seattle",
                state="WA",
                soc_code="15-1252",
            ),
            SourceEmployerRecord(
                source_system="oflc_lca",
                raw_employer_name="ACME ANALYTICS HOLDINGS LLC",
                normalized_employer_name=normalize_employer_name(
                    "ACME ANALYTICS HOLDINGS LLC"
                ),
                fiscal_year=2026,
                job_title="Product Manager",
                city="Austin",
                state="TX",
                soc_code="11-2021",
            ),
        )

        result = build_company_canonicalization(records)

        self.assertEqual(len(result.employers), 2)
        self.assertEqual(
            sorted(employer.normalized_name for employer in result.employers),
            ["acme analytics", "acme analytics holdings"],
        )
        self.assertEqual(
            {alias.review_status for alias in result.aliases},
            {"auto"},
        )
        self.assertTrue(
            all(alias.confidence_score == 0.96 for alias in result.aliases)
        )

    def test_manual_seed_applies_only_to_exact_seed_aliases(self) -> None:
        records = (
            SourceEmployerRecord(
                source_system="oflc_lca",
                raw_employer_name="MICROSOFT CORP.",
                normalized_employer_name=normalize_employer_name("MICROSOFT CORP."),
                fiscal_year=2026,
                job_title="Software Engineer",
                city="Redmond",
                state="WA",
                soc_code="15-1252",
            ),
            SourceEmployerRecord(
                source_system="oflc_lca",
                raw_employer_name="MICROSOFT RESEARCH LLC",
                normalized_employer_name=normalize_employer_name(
                    "MICROSOFT RESEARCH LLC"
                ),
                fiscal_year=2026,
                job_title="Research Scientist",
                city="Redmond",
                state="WA",
                soc_code="19-1029",
            ),
        )
        seed = ManualAliasSeed(
            canonical_name="Microsoft Corporation",
            display_name="Microsoft",
            slug="microsoft",
            aliases=("MICROSOFT CORP.", "MICROSOFT CORPORATION"),
        )

        result = build_company_canonicalization(records, manual_alias_seeds=(seed,))
        microsoft = next(
            employer for employer in result.employers if employer.slug == "microsoft"
        )
        research = next(
            employer
            for employer in result.employers
            if employer.normalized_name == "microsoft research"
        )

        self.assertEqual(microsoft.match_source, "manual_seed")
        self.assertEqual(research.match_source, "exact_normalized")
        self.assertEqual(
            {
                (alias.raw_name, alias.match_method, alias.review_status)
                for alias in result.aliases
            },
            {
                ("MICROSOFT CORP.", "manual_seed", "manual"),
                ("MICROSOFT RESEARCH LLC", "exact_normalized", "auto"),
            },
        )

    def test_scores_and_indexability_thresholds(self) -> None:
        noindex = decide_indexability(
            lca_count_5y=3,
            perm_count_5y=1,
            uscis_record_count_5y=1,
            job_title_count=3,
            location_count=2,
        )
        indexable = decide_indexability(
            lca_count_5y=10,
            perm_count_5y=1,
            uscis_record_count_5y=1,
            job_title_count=3,
            location_count=2,
        )

        self.assertFalse(noindex[0])
        self.assertIn("initial data threshold", noindex[1] or "")
        self.assertEqual(indexable, (True, None, ("recent_lca_count_10",)))
        self.assertGreater(
            score_company_candidate(
                lca_count_5y=10,
                perm_count_5y=3,
                uscis_record_count_5y=3,
                job_title_count=5,
                location_count=4,
                professional_soc_record_count=12,
            ),
            score_company_candidate(
                lca_count_5y=2,
                perm_count_5y=0,
                uscis_record_count_5y=0,
                job_title_count=1,
                location_count=1,
                professional_soc_record_count=1,
            ),
        )

    def test_loads_jsonl_inputs_and_writes_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            lca_path = root / "lca.jsonl"
            seed_path = root / "seeds.json"
            employers_path = root / "employers.jsonl"
            aliases_path = root / "aliases.jsonl"
            candidates_path = root / "candidates.jsonl"

            lca_path.write_text(
                json.dumps(
                    {
                        "raw_employer_name": "ACME ANALYTICS LLC",
                        "normalized_employer_name": "acme analytics",
                        "fiscal_year": 2026,
                        "job_title": "Software Engineer",
                        "worksite_city": "Seattle",
                        "worksite_state": "WA",
                        "soc_code": "15-1252",
                    }
                )
                + "\n",
                encoding="utf-8",
            )
            seed_path.write_text(
                json.dumps(
                    {
                        "seeds": [
                            {
                                "canonical_name": "Acme Analytics LLC",
                                "display_name": "Acme Analytics",
                                "slug": "acme-analytics",
                                "aliases": ["ACME ANALYTICS LLC"],
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            records = load_source_records_from_jsonl(lca_path, source_system="oflc_lca")
            seeds = load_manual_alias_seeds(seed_path)
            result = build_company_canonicalization(records, manual_alias_seeds=seeds)

            self.assertEqual(records[0].normalized_employer_name, "acme analytics")
            self.assertEqual(seeds[0].slug, "acme-analytics")
            self.assertEqual(write_jsonl(employers_path, result.employers), 1)
            self.assertEqual(write_jsonl(aliases_path, result.aliases), 1)
            self.assertEqual(write_jsonl(candidates_path, result.candidates), 1)

            candidate = json.loads(candidates_path.read_text(encoding="utf-8"))
            self.assertEqual(candidate["slug"], "acme-analytics")


if __name__ == "__main__":
    unittest.main()
