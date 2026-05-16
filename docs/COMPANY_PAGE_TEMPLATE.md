# Company Page Template — M14

Milestone: M14 — Company page template v1

## Scope

M14 replaces the placeholder company pages with one shared Chinese company-page template for:

- `/h1b/company/[slug]`
- `/perm/company/[slug]`

Both routes read the same `getCompanyProfileBySlug` payload, then apply route-specific metadata, breadcrumbs, and canonical URLs.

## Page Sections

Each company page includes:

- Employer summary and mapped public-record aliases.
- H-1B/LCA recent-year cards.
- PERM recent-year cards.
- H-1B wage distribution table when wage samples exist.
- Recent H-1B LCA records.
- Job title breakdown.
- Worksite location breakdown.
- PERM timeline and status table.
- Official data-source box.
- Caution/disclaimer box.
- Related companies, jobs, and locations.
- Visible FAQ section.
- JSON-LD for `BreadcrumbList` and visible `FAQPage` content.

## Fixture Coverage

The local fixture now has five companies with different shapes:

- `acme-analytics` — mixed H-1B, PERM, USCIS, multiple jobs and locations.
- `northstar-cloud` — small mixed H-1B/PERM sample with a denied PERM row.
- `lakeside-robotics` — H-1B denied row plus certified PERM row, no USCIS row.
- `brightline-health` — PERM-only sample, no H-1B wage distribution.
- `cedar-fintech-labs` — H-1B-only sample with USCIS row, no PERM timeline.

This is enough to validate missing-section behavior before production data is connected.

## SEO Status

M15 replaced the temporary M14 blanket `noindex, follow` behavior with route-specific quality decisions.

Current behavior:

- `/h1b/company/[slug]` is indexable only when the company has enough recent H-1B LCA or USCIS Employer Data Hub signal plus visible page quality signals.
- `/perm/company/[slug]` is indexable only when the company has enough recent PERM signal plus visible page quality signals.
- Low-data route pages remain `noindex, follow`.
- Only selected indexable company routes enter `/sitemaps/company-pages.xml`; M16 caps the first launch set at 500 route pages.

See `docs/SEO_INDEXABILITY_AND_SITEMAPS.md` for the M15 quality thresholds and sitemap split behavior. See `docs/COMPANY_PAGE_SCALE_SELECTION.md` for the M16 first-500 route selection and local scale-validation strategy.

## Compliance Notes

The template avoids approval-odds and guaranteed-sponsor language.

Public copy states:

- LCA is not H-1B petition approval.
- PERM certification is not I-140/I-485 or green-card approval.
- USCIS Employer Data Hub rows use a different official-data scope from DOL LCA/PERM.
- Wage fields are public-record signals and cannot decide individual compliance.

## Known Fixture Limits

- All records are local fixtures.
- Tables are intentionally small.
- No production Supabase-backed pagination exists yet.
- `brightline-health` is the current high-data fixture for the PERM route only; it validates quality logic but is not a production data sample.
