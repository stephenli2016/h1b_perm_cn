# H-1B Wage-Level Checker — M18

Route: `/tools/h1b-wage-level-checker`

## Purpose

This tool gives Chinese-speaking users a cautious way to compare an offered wage against DOL/FLAG prevailing wage level rows.

It is a public-data interpretation tool only. It must never say a wage is legally compliant, that a petition will be approved, or that an employer is safe.

## Inputs

- SOC code or English job title keyword.
- Worksite city.
- Worksite state.
- Offered wage.
- Wage unit: `Year` or `Hour`.
- Wage year.

## Matching Rules

The repository method is `checkH1BWageLevel` in `lib/db/public-query-repository.ts`.

1. If the input is a SOC code like `15-1252`, use it directly.
2. Otherwise resolve the keyword against PWD SOC titles and H-1B LCA job/SOC titles.
3. Look up PWD rows by SOC, state, and wage year.
4. Prefer exact city, then metro-area name, then statewide fallback.
5. Compare the offered wage with Level 1-4 amounts from the matched official-source wage row.
6. If the input unit differs from the wage row unit, convert with 2,080 hours/year and show the conversion caveat.

## Output

- Matched SOC code/title.
- Match scope: city, metro area, or state fallback.
- Wage year and source coverage.
- Level 1-4 table.
- Approximate band, such as `介于 Level 2 和 Level 3`.
- Related same-SOC H-1B company/job/location samples when available.
- Explicit Chinese caveats and the site disclaimer.

## SEO and Compliance

The page is indexable after M18 because it has a real tool, worked example, official-source context, related links, source notes, and non-generic Chinese explanation.

The tool page is included in `/sitemaps/tools.xml`.

Forbidden claims remain forbidden:

- Do not say the wage is compliant.
- Do not claim approval odds.
- Do not turn H-1B LCA wage samples into a promise about hiring or sponsorship.

## Fixture Coverage

The default local fixture includes annual wage rows for Seattle, Austin, San Jose, New York, and Washington statewide examples.

Tests also cover an hourly wage row so Year/Hour conversion stays explicit and bounded.
