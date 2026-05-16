# EB Priority Date Calculator — M19

Route: `/tools/eb2-eb3-china-priority-date-calculator`

## Purpose

This tool helps Chinese-speaking users compare a priority date against official Visa Bulletin fixture data for China mainland-born employment-based categories.

It is a public-data interpretation tool only. It must never say a person can definitely file I-485, receive a green card, or rely on a specific month for a legal decision.

## Inputs

- Category: `EB-1`, `EB-2`, or `EB-3`.
- Chargeability area: `china-mainland` in the MVP fixture.
- Priority date in `YYYY-MM-DD` format.
- Chart type: `final_action` or `dates_for_filing`.
- Visa Bulletin month in `YYYY-MM` format.

## Matching Rules

The repository method is `checkVisaBulletinPriorityDate` in `lib/db/public-query-repository.ts`.

1. Use the latest local Visa Bulletin fixture month when no month is supplied.
2. Validate category, chargeability area, chart type, month key, and priority date.
3. Look up the selected `VisaBulletinDate` row for month/category/chargeability/chart.
4. If the row is `C`, return `current_all`.
5. If the row is `U`, return `unavailable`.
6. If the row has a date, treat the priority date as current only when it is earlier than the cut-off date. Equal to the cut-off date is not current.
7. Compare the selected chart against the USCIS employment-based filing chart selected for that month.

## Output

- Current-month result label in Chinese.
- Selected cut-off date, including `C` and `U` states.
- Month key, source publication date, and Department of State source URL.
- USCIS filing chart note explaining whether the user-selected chart matches the USCIS adjustment-of-status chart for that month.
- Full EB-1/EB-2/EB-3 table for the selected month.
- Explicit Chinese caveats and the site disclaimer.

## Monthly Pages

M19 also adds indexable fixture-backed monthly pages:

- `/visa-bulletin/[year]/[month]`

Only months present in local official-source fixture data are generated and included in `/sitemaps/visa-bulletin.xml`.

## SEO and Compliance

The calculator page is indexable after M19 because it has a real form, official-source fixture data, a worked example, source notes, related internal links, and cautious Chinese explanations.

Monthly Visa Bulletin pages are indexable only when fixture data exists for that month.

Forbidden claims remain forbidden:

- Do not say a person can definitely file I-485.
- Do not say a category will definitely become current in a future month.
- Do not frame chart comparison as approval odds.
- Do not treat Dates for Filing as usable for adjustment of status unless USCIS selected it for that month, and even then do not imply personal eligibility.

## Fixture Coverage

The default local fixture includes April, May, and June 2026 China mainland-born EB-1, EB-2, and EB-3 rows for both Final Action Dates and Dates for Filing. Tests also cover `C` and `U` states with synthetic fixture rows.
