# USCIS H-1B Employer Data Hub ETL Mapping — M08

Milestone: M08 — USCIS H-1B Employer Data Hub ingestion

## Official Sources

- USCIS H-1B Employer Data Hub: `https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub`
- USCIS H-1B Employer Data Hub Files archive: `https://www.uscis.gov/archive/h-1b-employer-data-hub-files`
- USCIS Immigration and Citizenship Data: `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data`

The official archived Data Hub Files page states that yearly CSV files are available for FY2009-FY2023 and was last reviewed/updated on July 1, 2025. During M08, direct page access from the local environment was unreliable, so production download URLs should be refreshed before a real-data backfill. Local fixture mode remains the default for repeatable development.

## Parser Inputs

The M08 parser supports:

- USCIS H-1B Employer Data Hub CSV-style files.
- Local HTML table fixtures for development fallback.
- Manifest-driven fixture parsing through `data/source_manifest.json`.

Commands:

```bash
pnpm etl:uscis:h1b:fixture
pnpm etl:uscis:h1b:fixtures
python3 -m etl.cli parse-uscis-h1b --input <file> --source-id <id> --fiscal-year <year> --output data/normalized/uscis_h1b_employer_records.jsonl
python3 -m etl.cli parse-uscis-h1b-manifest --manifest data/source_manifest.json --output data/normalized/uscis_h1b_employer_records.jsonl --fixtures-only
```

## Normalized Fields

| Normalized field            | Example source headers                                      | Notes                                                             |
| --------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| `source_file_id`            | manifest id                                                 | Identifies the USCIS source entry.                                |
| `source_record_id`          | `SOURCE_RECORD_ID`, `RECORD_ID`                             | Synthesized when the source row has no durable id.                |
| `source_record_fingerprint` | sanitized row                                               | SHA-256 fingerprint used for duplicate detection.                 |
| `fiscal_year`               | `Fiscal Year`, `FY`, `Year`                                 | Required, with manifest fallback.                                 |
| `raw_employer_name`         | `Employer`, `Employer (Petitioner) Name`, `Petitioner Name` | Preserves the official row name.                                  |
| `normalized_employer_name`  | derived                                                     | Lowercase deterministic normalization for matching and summaries. |
| `city`                      | `City`, `Petitioner City`                                   | Petitioner/employer city, not DOL worksite.                       |
| `state`                     | `State`, `Petitioner State`                                 | Normalized to uppercase.                                          |
| `postal_code`               | `ZIP`, `ZIP Code`, `Postal Code`                            | Kept as a string.                                                 |
| `naics_code`                | `NAICS`, `NAICS Code`                                       | Kept as a string.                                                 |
| `initial_approvals`         | `Initial Approval`, `Initial Approvals`                     | USCIS first-decision count for initial employment.                |
| `initial_denials`           | `Initial Denial`, `Initial Denials`                         | USCIS first-decision count for initial employment.                |
| `continuing_approvals`      | `Continuing Approval`, `Continuing Approvals`               | USCIS first-decision count for continuing employment.             |
| `continuing_denials`        | `Continuing Denial`, `Continuing Denials`                   | USCIS first-decision count for continuing employment.             |
| `raw_record_json`           | sanitized source row                                        | Tax ID / FEIN / TIN-like fields are removed before JSONL output.  |

## Query Helpers

- Python:
  - `get_uscis_h1b_summaries_by_employer(records, employer_name)`
  - `get_uscis_h1b_summary_by_employer_fiscal_year(records, employer_name, fiscal_year)`
- TypeScript:
  - `summarizeUscisH1BEmployerData({ employerId, employerName, fiscalYear })`

These helpers return decision counts by fiscal year:

- initial approvals
- initial denials
- continuing approvals
- continuing denials
- total first decisions
- cities/states/NAICS codes represented in the rows

They intentionally do not label the result as an H-1B success rate. If a later UI displays ratios, the denominator and source limitation must be visible in Chinese.

## Public Product Limitations

- USCIS Employer Data Hub records are petition decision data from USCIS, not DOL LCA records.
- Data Hub counts reflect first decisions for petitions that were included in USCIS data generation; later appeals, revocations, or other subsequent actions may not be represented.
- Petitioner city/state/ZIP is not necessarily the worker worksite.
- Tax ID fields are not stored in normalized output for MVP privacy and disambiguation safety.
- Public copy must say that Employer Data Hub records are signals, not guarantees of approval, hiring, or future sponsorship.
- Public pages must include the disclaimer: “本站内容仅供信息参考，不构成法律、移民、税务或职业建议。”
