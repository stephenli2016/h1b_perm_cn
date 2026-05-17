# NAICS and O\*NET Metadata Mapping

Latest local preparation run: 2026-05-17.

## Official sources

- U.S. Census Bureau NAICS:
  `https://www.census.gov/naics/2022NAICS/2022_NAICS_Structure.xlsx`
- O\*NET Resource Center 30.2 Occupation Data:
  `https://www.onetcenter.org/dl_files/database/db_30_2_text/Occupation%20Data.txt`
- O\*NET Resource Center 30.2 Job Zones:
  `https://www.onetcenter.org/dl_files/database/db_30_2_text/Job%20Zones.txt`
- O\*NET Resource Center 30.2 Job Zone Reference:
  `https://www.onetcenter.org/dl_files/database/db_30_2_text/Job%20Zone%20Reference.txt`

O*NET Resource Center is an official DOL/ETA O*NET publication channel. The
manifest validator keeps the general `.gov` rule and narrowly allowlists only
`www.onetcenter.org` as a non-.gov official partner host.

## Normalized tables

### `naics_industries`

Rows from Census 2022 NAICS Structure with Change Indicator.

- `naics_code`: 2-6 digit NAICS code or sector range such as `31-33`.
- `industry_title`: Census title with the trailing trilateral `T` marker
  removed.
- `classification_level`: `sector`, `subsector`, `industry_group`,
  `naics_industry`, or `national_industry`.
- `sector_code` / `sector_title`: derived from the two-digit sector, including
  range sectors `31-33`, `44-45`, and `48-49`.
- `change_indicator`: official Census change marker, if present.
- `trilateral`: whether the Census title had the official `T` marker.

Latest real parse count: 2,125 rows.

### `onet_occupations`

Rows from O\*NET 30.2 Occupation Data.

- `onet_soc_code`: O\*NET-SOC code, such as `15-1252.00`.
- `soc_code`: base SOC code, such as `15-1252`.
- `occupation_title` and `description`: official O\*NET occupation text.
- `job_family_code` / `job_family_title`: SOC major group derived from the
  first two digits.

Latest real parse count: 1,016 rows.

### `onet_job_zones`

Rows from O\*NET 30.2 Job Zones joined to Job Zone Reference and Occupation Data.

- `job_zone`: O\*NET Job Zone number.
- `job_zone_name`, `experience`, `education`, `job_training`, `examples`, and
  `svp_range`: official Job Zone Reference context.
- `occupation_title`: filled from Occupation Data because the current official
  Job Zones text file does not include a title column.
- `date_updated` and `domain_source`: official Job Zones update metadata.

Latest real parse count: 923 rows.

## Product-use limits

- NAICS is an industry classification signal, not proof of an employer's actual
  business mix or immigration behavior.
- O\*NET Job Zone context is general occupational metadata, not a legal finding
  that any specific job meets or fails PERM/H-1B requirements.
- Public pages should present these rows as explanatory labels and context,
  alongside the standard disclaimer: “本站内容仅供信息参考，不构成法律、移民、税务或职业建议。”
