# Visa Bulletin / USCIS Filing Chart ETL Mapping — M09

Milestone: M09 — Visa Bulletin and USCIS filing chart parser

## Official Sources

- Department of State Visa Bulletin index: `https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html`
- Department of State June 2026 Visa Bulletin: `https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/2026/visa-bulletin-for-june-2026.html`
- USCIS Adjustment of Status Filing Charts from the Visa Bulletin: `https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin`

The Department of State index confirmed on May 16, 2026 that the current
bulletin is May 2026 and the upcoming bulletin is June 2026. The index also
states that Final Action Dates and Dates for Filing are listed in
DAY-MONTH-YEAR format.

The production manifest now backfills 24 official months from 2024-07 through
2026-06 for both Department of State Visa Bulletin pages and USCIS monthly
adjustment-of-status filing chart pages. The parser supports direct USCIS page
text and manual monthly fixture fallback for local development.

## Parser Inputs

The M09 parser supports:

- Department of State Visa Bulletin HTML pages with employment-based final action and dates-for-filing tables.
- Local HTML fixtures for April, May, and June 2026.
- Production raw HTML downloads for 2024-07 through 2026-06.
- USCIS filing-chart HTML text, plus a manual fallback chart value when a page is unavailable.

Commands:

```bash
pnpm etl:visa:bulletin:fixtures
pnpm etl:uscis:filing-chart:fixtures
python3 -m etl.cli parse-visa-bulletin --input <file> --source-id <id> --source-url <url> --output data/normalized/visa_bulletin_dates.jsonl
python3 -m etl.cli parse-uscis-filing-chart --input <file> --source-id <id> --output data/normalized/uscis_filing_charts.jsonl
python3 -m etl.cli parse-visa-bulletin-manifest --manifest data/source_manifest.json --output data/normalized/visa_bulletin_dates.jsonl
python3 -m etl.cli parse-uscis-filing-chart-manifest --manifest data/source_manifest.json --output data/normalized/uscis_filing_charts.jsonl
```

## Normalized Visa Bulletin Fields

| Normalized field                   | Source                                           | Notes                                        |
| ---------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| `month_key`                        | page title such as `Visa Bulletin For June 2026` | Stored as `YYYY-MM`.                         |
| `bulletin_year` / `bulletin_month` | derived                                          | Numeric month dimensions.                    |
| `source_url`                       | manifest official URL                            | Keeps audit trail to DOS page.               |
| `published_at`                     | `CA/VO: Month D, YYYY`                           | Optional, normalized to ISO date.            |
| `category`                         | `1st`, `2nd`, `3rd`, `EB-1`, `EB-2`, `EB-3`      | Stored as `EB-1`, `EB-2`, `EB-3`.            |
| `chargeability_area`               | `China-mainland born` column                     | M09 stores `china-mainland`.                 |
| `chart_type`                       | heading                                          | `final_action` or `dates_for_filing`.        |
| `cutoff_status`                    | row value                                        | `date`, `current`, or `unavailable`.         |
| `cutoff_date`                      | row value                                        | ISO date for `date` rows; blank for `C`/`U`. |
| `raw_value`                        | row value                                        | Preserves original `01SEP21`, `C`, or `U`.   |

## Priority Date Helper

Python:

- `parse_visa_bulletin_cutoff(value, bulletin_year)`
- `priority_date_is_before_cutoff(priority_date, cutoff)`

TypeScript:

- `checkVisaBulletinPriorityDate({ monthKey, category, chargeabilityArea, chartType, priorityDate })`

Rule: for date cutoffs, the priority date must be earlier than the listed date. A priority date equal to the cutoff date is not treated as current. `C` is treated as current; `U` is treated as unavailable.

## USCIS Filing Chart Selection

USCIS selection output stores:

- `month_key`
- `employment_based_chart`: `final_action` or `dates_for_filing`
- source text for audit/debugging

The latest production parse produced 24 monthly USCIS chart rows. The
employment-based chart selection varies by month; for example, 2024-10 through
2025-01 use `dates_for_filing`, 2025-02 through 2025-09 use `final_action`,
2025-10 through 2026-04 use `dates_for_filing`, and 2026-05 through 2026-06 use
`final_action`.

## Public Product Limitations

- Visa Bulletin dates are public date signals, not personalized legal advice.
- Whether a person can file or receive approval depends on USCIS monthly chart selection, visa category, chargeability, priority date, case posture, and individual eligibility.
- The site must not say an I-485 or immigrant visa action is guaranteed.
- Public pages must include the disclaimer: “本站内容仅供信息参考，不构成法律、移民、税务或职业建议。”
