# OFLC PERM Parser Mapping — M06

Milestone: M06 — OFLC PERM parser

## Official Source

Primary source family:

- DOL OFLC Performance Data: `https://www.dol.gov/agencies/eta/foreign-labor/performance`

Verified for M06:

- The current latest quarterly update lists FY2026 Q2 PERM disclosure files for determinations issued October 1, 2025 through March 31, 2026.
- The historical PERM section lists FY2025 PERM disclosure files and FY2024 original plus New Form disclosure files.
- DOL notes that disclosure datasets are cumulative fiscal-year files and that some PII is excluded from public disclosure files.

The parser supports CSV fixtures and `.xlsx` workbook input through the shared tabular reader introduced in M05.

## Layouts Covered

M06 fixtures cover two practical layouts:

- Current-style PERM fields such as `EMPLOYER_NAME`, `JOB_TITLE`, `SOC_CODE`, `WAGE_OFFER_FROM`, and `WAGE_UNIT`.
- Revised ETA-9089 / New Form style fields such as `EMPLOYER_BUSINESS_NAME`, `SOC_OCCUPATION_CODE`, `JOB_OPPORTUNITY_TITLE`, `PLACE_OF_EMPLOYMENT_CITY`, and `OFFERED_WAGE_FROM`.
- Older/newer PWD and job-requirement fields such as PWD case number, PWD SOC,
  PWD wage/unit/level, minimum education, major field, training/experience
  months, alternate requirements, and foreign-language requirement.

## Raw-to-Normalized Field Mapping

| Normalized field              | OFLC header candidates                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `case_number`                 | `CASE_NUMBER`, `CASE_NO`, `ETA_CASE_NUMBER`, `PERM_CASE_NUMBER`                                        |
| `case_status`                 | `CASE_STATUS`, `STATUS`                                                                                |
| `raw_employer_name`           | `EMPLOYER_NAME`, `EMPLOYER_BUSINESS_NAME`                                                              |
| `normalized_employer_name`    | Derived from employer name using deterministic punctuation/suffix cleanup                              |
| `fiscal_year`                 | `FISCAL_YEAR`, provided CLI fallback, or inferred from `decision_date`                                 |
| `job_title`                   | `JOB_TITLE`, `JOB_INFO_JOB_TITLE`, `JOB_OPPORTUNITY_TITLE`                                             |
| `soc_code`                    | `SOC_CODE`, `SOC_OCCUPATION_CODE`                                                                      |
| `soc_title`                   | `SOC_TITLE`, `SOC_NAME`, `SOC_OCCUPATION_TITLE`                                                        |
| `worksite_city`               | `WORKSITE_CITY`, `PLACE_OF_EMPLOYMENT_CITY`, `JOB_INFO_WORK_CITY`                                      |
| `worksite_state`              | `WORKSITE_STATE`, `PLACE_OF_EMPLOYMENT_STATE`, `JOB_INFO_WORK_STATE`                                   |
| `wage_offer_from`             | `WAGE_OFFER_FROM`, `WAGE_OFFER_FROM_9089`, `OFFERED_WAGE_FROM`                                         |
| `wage_offer_to`               | `WAGE_OFFER_TO`, `WAGE_OFFER_TO_9089`, `OFFERED_WAGE_TO`                                               |
| `wage_unit`                   | `WAGE_UNIT`, `WAGE_UNIT_OF_PAY`, `WAGE_OFFER_UNIT_OF_PAY_9089`, `OFFERED_WAGE_UNIT`                    |
| `priority_date`               | `PRIORITY_DATE`                                                                                        |
| `received_date`               | `RECEIVED_DATE`, `APPLICATION_RECEIVED_DATE`                                                           |
| `decision_date`               | `DECISION_DATE`                                                                                        |
| `pwd_case_number`             | `PWD_CASE_NUMBER`, `PREVAILING_WAGE_TRACKING_NUMBER`                                                   |
| `pwd_soc_code`                | `PWD_SOC_CODE`, `PREVAILING_WAGE_SOC_CODE`                                                             |
| `pwd_soc_title`               | `PWD_SOC_TITLE`, `PREVAILING_WAGE_SOC_TITLE`                                                           |
| `pwd_wage`                    | `PWD_WAGE`, `PREVAILING_WAGE`, `PW_WAGE`                                                               |
| `pwd_unit`                    | `PWD_UNIT`, `PWD_UNIT_OF_PAY`, `PW_UNIT_OF_PAY`                                                        |
| `annualized_pwd_wage`         | Derived from `pwd_wage` and `pwd_unit`                                                                 |
| `pwd_wage_level`              | `PWD_WAGE_LEVEL`, `PW_WAGE_LEVEL`                                                                      |
| `minimum_education`           | `MINIMUM_EDUCATION`, `JOB_INFO_EDUCATION`                                                              |
| `major_field_of_study`        | `MAJOR_FIELD_OF_STUDY`, `JOB_INFO_MAJOR`                                                               |
| `training_months`             | `TRAINING_MONTHS`, `JOB_INFO_TRAINING_NUM_MONTHS`                                                      |
| `experience_months`           | `EXPERIENCE_MONTHS`, `JOB_INFO_EXPERIENCE_NUM_MONTHS`                                                  |
| `alternate_education`         | `ALTERNATE_EDUCATION`, `ALT_EDUCATION`                                                                 |
| `alternate_experience_months` | `ALTERNATE_EXPERIENCE_MONTHS`, `ALT_EXPERIENCE_MONTHS`                                                 |
| `foreign_language_required`   | `FOREIGN_LANGUAGE_REQUIRED`, `SPEC_REQ_FOREIGN_LANG`                                                   |
| `country_of_citizenship`      | `COUNTRY_OF_CITIZENSHIP`, `FOREIGN_WORKER_INFO_CITIZENSHIP_COUNTRY`, `BENEFICIARY_CITIZENSHIP_COUNTRY` |
| `country_of_birth`            | `COUNTRY_OF_BIRTH`, `FOREIGN_WORKER_INFO_BIRTH_COUNTRY`, `BENEFICIARY_BIRTH_COUNTRY`                   |
| `raw_record_json`             | Sanitized source row with obvious PII-like fields removed                                              |

## Wage Normalization

PERM offered wage values are preserved as submitted and annualized when the unit is parseable:

- Year / Annual: multiply by 1.
- Month: multiply by 12.
- Bi-Weekly: multiply by 26.
- Week: multiply by 52.
- Day: multiply by 260.
- Hour: multiply by 2,080.

Annualization is only a comparison convenience. It is not a legal conclusion that an offered wage is sufficient or compliant.

## Employer Summary Helper

`get_perm_summary_by_employer(records, employer_name)` returns:

- total PERM records,
- certified / denied / withdrawn counts,
- fiscal years represented,
- raw employer names seen,
- top job titles,
- latest decision date.

This supports later company pages without implying PERM certification equals I-140, I-485, consular processing, or green-card approval.

## Privacy Handling

The normalized record includes country of citizenship/birth only as country-level fields, which are useful for high-level data analysis. It does not preserve names, personal addresses, emails, phone numbers, FEINs, SSNs, tax identifiers, beneficiary identifiers, attorney/contact fields, or foreign-worker personal fields in `raw_record_json`.

Future public pages must aggregate small cohorts and avoid showing personal identifiers.

## Interpretation Boundary

PERM certification is a labor certification step in employment-based immigration. It is not green-card approval and does not prove that an employer will sponsor future cases.
