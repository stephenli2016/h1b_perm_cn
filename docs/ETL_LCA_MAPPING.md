# OFLC LCA / H-1B Parser Mapping — M05

Milestone: M05 — OFLC LCA/H-1B parser

## Official Source

Primary source family:

- DOL OFLC Performance Data: `https://www.dol.gov/agencies/eta/foreign-labor/performance`

Verified for M05:

- The page describes OFLC disclosure datasets as cumulative fiscal-year files that contain unique records identified by OFLC case number and explains that some PII is excluded from public files.
- The current latest quarterly update lists FY2026 Q2 LCA disclosure files for determinations issued October 1, 2025 through March 31, 2026.
- The historical section lists FY2025 Q1-Q4 LCA disclosure files and FY2025 Q4 record layout files.

The parser supports CSV fixtures and `.xlsx` files so the same code path can parse local samples and downloaded OFLC workbooks.

## Raw-to-Normalized Field Mapping

| Normalized field           | OFLC header candidates                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| `case_number`              | `CASE_NUMBER`, `CASE_NO`, `CASE NO`                                       |
| `case_status`              | `CASE_STATUS`, `CASE STATUS`, `STATUS`                                    |
| `visa_class`               | `VISA_CLASS`, `VISA CLASS`, `CLASS_OF_ADMISSION`                          |
| `raw_employer_name`        | `EMPLOYER_NAME`, `EMPLOYER NAME`, `EMPLOYER_BUSINESS_NAME`                |
| `normalized_employer_name` | Derived from employer name using deterministic punctuation/suffix cleanup |
| `fiscal_year`              | `FISCAL_YEAR`, provided CLI fallback, or inferred from `decision_date`    |
| `soc_code`                 | `SOC_CODE`, `SOC CODE`, `SOC`                                             |
| `soc_title`                | `SOC_TITLE`, `SOC TITLE`, `SOC_NAME`                                      |
| `job_title`                | `JOB_TITLE`, `JOB TITLE`                                                  |
| `worksite_city`            | `WORKSITE_CITY`, `WORKSITE CITY`, `PLACE_OF_EMPLOYMENT_CITY`              |
| `worksite_state`           | `WORKSITE_STATE`, `WORKSITE STATE`, `PLACE_OF_EMPLOYMENT_STATE`           |
| `worksite_postal_code`     | `WORKSITE_POSTAL_CODE`, `WORKSITE_ZIP`, `PLACE_OF_EMPLOYMENT_POSTAL_CODE` |
| `wage_rate_of_pay_from`    | `WAGE_RATE_OF_PAY_FROM`, `WAGE RATE OF PAY FROM`, `WAGE_RATE_OF_PAY`      |
| `wage_rate_of_pay_to`      | `WAGE_RATE_OF_PAY_TO`, `WAGE RATE OF PAY TO`                              |
| `wage_unit`                | `WAGE_UNIT_OF_PAY`, `WAGE UNIT OF PAY`, `WAGE_UNIT`                       |
| `prevailing_wage`          | `PREVAILING_WAGE`, `PREVAILING WAGE`, `PW_WAGE`                           |
| `prevailing_wage_unit`     | `PW_UNIT_OF_PAY`, `PREVAILING_WAGE_UNIT`, `PW_UNIT`                       |
| `wage_level`               | `WAGE_LEVEL`, `PW_WAGE_LEVEL`, `PREVAILING_WAGE_LEVEL`                    |
| `full_time`                | `FULL_TIME_POSITION`, `FULL_TIME`                                         |
| `received_date`            | `RECEIVED_DATE`, `RECEIVED DATE`                                          |
| `decision_date`            | `DECISION_DATE`, `DECISION DATE`                                          |
| `raw_record_json`          | Sanitized source row with obvious PII-like fields removed                 |

## Wage Annualization

Annualized wages are derived only when the wage value and unit are both parseable:

| Unit          | Factor |
| ------------- | -----: |
| Year / Annual |      1 |
| Month         |     12 |
| Bi-Weekly     |     26 |
| Week          |     52 |
| Day           |    260 |
| Hour          |  2,080 |

The annualized value is a normalization convenience for comparisons. It is not a legal conclusion that a wage is sufficient or compliant.

## Duplicate Detection

Each raw row is converted into a sanitized, sorted JSON payload and hashed with SHA-256. The parser treats repeated fingerprints within one parse run as duplicates and keeps the first record.

`source_record_id` is the OFLC case number when present. If a case number is missing, the row fingerprint is used.

## Privacy Handling

The normalized record keeps employer, worksite, wage, SOC, case status, and date fields needed for company-level analysis. `raw_record_json` drops fields with obvious PII-sensitive labels such as worker, alien, beneficiary, attorney, contact, phone, email, FEIN, SSN, and tax identifiers.

No public UI was added in M05. Future company pages must continue to aggregate low-sample data and avoid displaying foreign worker names, personal addresses, or unnecessary personal identifiers.

## Interpretation Boundary

LCA records are DOL labor condition application records. They are useful employer sponsorship signals, but they are not H-1B petition approvals, proof of hiring, or guarantees of future sponsorship.
