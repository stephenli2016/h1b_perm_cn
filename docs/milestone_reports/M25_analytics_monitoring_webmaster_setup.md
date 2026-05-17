# Milestone M25 Report — Analytics, Monitoring, and Webmaster Setup

## Status

Completed.

## Built

- Added environment-based observability configuration in `lib/observability/config.ts`.
- Added optional GA4 and Plausible script rendering through `components/observability/observability-scripts.tsx`.
- Added Google Search Console and Bing webmaster verification metadata support through root metadata.
- Added a basic browser error monitoring placeholder through `ErrorMonitoringListener`.
- Added optional observability variables to `.env.example`; all can stay blank.
- Added `pnpm seo:audit` for route, sitemap, noindex, structured-data, internal-link, and compliance checks.
- Added `pnpm data:freshness` for source manifest freshness and fixture coverage reporting.
- Added `docs/OBSERVABILITY_M25.md` and updated SEO/ETL docs.
- Added tests for default-disabled observability, valid/invalid public env values, package scripts, and data freshness reporting.

## Files changed

- `.env.example`
- `app/layout.tsx`
- `components/observability/error-monitoring-listener.tsx`
- `components/observability/observability-scripts.tsx`
- `lib/observability/config.ts`
- `lib/observability/root-metadata.ts`
- `scripts/seo-audit.ts`
- `scripts/data-freshness.ts`
- `tests/observability.test.tsx`
- `tests/data-freshness.test.ts`
- `docs/OBSERVABILITY_M25.md`
- `docs/ETL.md`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `package.json`

## Validation

- Command: `pnpm lint`
  - Result: pass
- Command: `pnpm typecheck`
  - Result: pass
- Command: `pnpm test`
  - Result: pass, 15 test files / 100 tests
- Command: `pnpm etl:test`
  - Result: pass, 46 ETL tests
- Command: `pnpm etl:validate`
  - Result: pass, 15 manifest sources
- Command: `pnpm seo:audit`
  - Result: pass, 4 SEO test files / 28 tests
- Command: `pnpm data:freshness`
  - Result: pass; 15 sources, 13/13 required fixtures present, latest Visa Bulletin fixture `2026-06`
- Command: `pnpm build`
  - Result: pass, 84 app routes generated
- Command: `pnpm format`
  - Result: pass
- Command: `git diff --check`
  - Result: pass
- Command: secret scan with `rg --pcre2`
  - Result: pass, no matches

## Screenshots / local URLs

- No new visual page was required for M25.
- Internal CLI report:
  - `pnpm data:freshness`
  - `pnpm seo:audit`

## Decisions made without owner input

- Used GA4 and Plausible as optional public analytics providers.
- Did not add analytics SDK dependencies.
- Rendered analytics scripts only when public env values pass validation.
- Added Search Console verification via metadata rather than a static HTML file.
- Implemented error monitoring as a privacy-minimal beacon placeholder instead of Sentry SDK integration.
- Made `data:freshness` an internal CLI report rather than an admin page.

## Known limitations

- No analytics runs until the owner provides GA4 or Plausible values.
- Search Console verification does nothing until the owner adds the production domain in Google Search Console and supplies the token.
- Error monitoring sends nowhere until `NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT` is configured.
- `data:freshness` warns that downloaded production files are absent in local fixture mode; this is expected before production data import.

## Owner action needed

- Optional now: choose GA4 or Plausible and provide the public measurement ID/domain.
- Optional now: add the production domain to Search Console and provide the verification token.
- Optional now: choose Sentry/custom endpoint/no browser error collection for MVP.
- No owner action is required to continue local development milestones.

## Recommended next milestone

M26 — Production database setup preparation.
