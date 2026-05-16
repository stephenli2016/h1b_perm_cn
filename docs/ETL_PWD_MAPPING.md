# PWD / FLAG Wage ETL Mapping — M07

Milestone: M07 — PWD / prevailing wage parser and wage lookup

## Official Sources

- DOL OFLC performance disclosure data: `https://www.dol.gov/agencies/eta/foreign-labor/performance`
- FLAG wage search: `https://flag.dol.gov/wage-data/wage-search`
- FLAG wage data downloads: `https://flag.dol.gov/wage-data/wage-data-downloads`
- Current manifest wage ZIP target: `https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_2025-26.zip`

Only official DOL/FLAG data is allowed as an input. Competitor databases, forums, attorney blogs, and user-submitted spreadsheets must not be used as data sources.

## Parser Inputs

The M07 parser supports:

- OFLC PWD disclosure fixtures/downloads in CSV or XLSX-compatible tabular layouts.
- FLAG OFLC wage ZIP downloads when the archive contains at least one CSV member.
- Local fixture fallback through `data/source_manifest.json` when network access is unavailable.

Commands:

```bash
pnpm etl:pwd:fixture
pnpm etl:pwd:fixtures
python3 -m etl.cli parse-pwd --input <file> --source-id <id> --effective-year <year> --output data/normalized/pwd_records.jsonl
python3 -m etl.cli parse-pwd-manifest --manifest data/source_manifest.json --output data/normalized/pwd_records.jsonl --fixtures-only
```

## Normalized Fields

| Normalized field                      | Example source headers                               | Notes                                                                              |
| ------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `source_file_id`                      | manifest id                                          | Identifies the official source file entry.                                         |
| `source_record_id`                    | `SOURCE_RECORD_ID`, `PWD_NUMBER`, `CASE_NUMBER`      | Synthesized from source, SOC, year, and fingerprint when no durable row id exists. |
| `source_record_fingerprint`           | entire sanitized row                                 | SHA-256 fingerprint after privacy-oriented row sanitization.                       |
| `data_series`                         | `DATA_SERIES`, `WAGE_SOURCE`                         | Falls back to manifest source name when absent.                                    |
| `effective_year`                      | `EFFECTIVE_YEAR`, `WAGE_YEAR`, `YEAR`, `FISCAL_YEAR` | For ranges such as `2025-2026`, the parser uses the ending year.                   |
| `soc_code`                            | `SOC_CODE`, `OCC_CODE`                               | Required for lookup.                                                               |
| `soc_title`                           | `SOC_TITLE`, `OCCUPATION_TITLE`                      | Optional descriptive title.                                                        |
| `area_name`                           | `AREA_NAME`, `OES_AREA_NAME`                         | Used for metro-area fallback matching.                                             |
| `city`                                | `CITY`, `AREA_CITY`, `PRIMARY_CITY`                  | Optional; blank city can represent statewide rows.                                 |
| `state`                               | `STATE`, `STATE_ABBREVIATION`, `AREA_STATE`          | Normalized to uppercase.                                                           |
| `wage_level_1` through `wage_level_4` | `WAGE_LEVEL_1`, `LEVEL_1_WAGE`, `LEVEL1`, etc.       | Numeric values with currency formatting removed.                                   |
| `wage_unit`                           | `WAGE_UNIT`, `RATE_TYPE`                             | Normalized to `Year` or `Hour` when possible.                                      |

## Lookup Rules

The Python parser exposes `lookup_prevailing_wage`; the TypeScript local repository exposes `lookupPrevailingWage`. Both use the same fixture-ready matching order:

1. Filter by SOC code, state, and optional effective year.
2. Prefer exact city + state matches.
3. If no exact city match exists, match rows whose `area_name` contains the requested city name, such as Bellevue within the Seattle-Tacoma-Bellevue area.
4. If no city/area row matches, return a state-level row when the row has no city or has a statewide area name.
5. Return `not_found` when no official row is available.

`match_wage_level` and `matchWageAmountToLevels` compare a wage amount against levels 1-4 in the same unit as the record. A yearly record expects a yearly amount; an hourly record expects an hourly amount.

## Public Product Limitations

- Prevailing wage data is an official wage signal, not an H-1B approval prediction.
- A wage level comparison does not determine whether a specific job qualifies, whether a petition will be approved, or whether a salary offer is legally sufficient.
- Missing city-level data should be shown as a fallback with clear source notes, not hidden as a precise local match.
- Public pages must include source names, years covered, and the disclaimer: “本站内容仅供信息参考，不构成法律、移民、税务或职业建议。”
