# Observability and Webmaster Setup — M25

Milestone: M25 — Analytics, monitoring, and webmaster setup

## Goal

Prepare SEO learning and maintenance without blocking local development on third-party keys.

The site works with every M25 variable blank. Optional scripts and meta tags render only when valid public values are provided.

## Optional Environment Variables

Analytics:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — GA4 measurement ID, for example `G-ABC12345`.
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — bare Plausible domain, for example `visaradar.example`.
- `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC` — optional Plausible script URL; defaults to `https://plausible.io/js/script.js` when Plausible is enabled.

Webmaster verification:

- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — Google Search Console HTML meta verification token.
- `NEXT_PUBLIC_BING_SITE_VERIFICATION` — optional Bing Webmaster Tools token.

Error monitoring placeholder:

- `NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT` — HTTPS endpoint that receives sanitized browser error beacons.
- `NEXT_PUBLIC_ERROR_MONITORING_ENVIRONMENT` — `development`, `preview`, or `production`.
- `NEXT_PUBLIC_RELEASE_SHA` — public release identifier.

Do not put private API keys or server secrets in `NEXT_PUBLIC_*` variables.

## Runtime Behavior

`lib/observability/config.ts` validates public environment values before they can render.

`components/observability/observability-scripts.tsx` renders:

- GA4 script only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is valid.
- Plausible script only when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is valid.

`app/layout.tsx` renders:

- Search Console/Bing verification metadata only when tokens are valid.
- `ErrorMonitoringListener` only sends beacons when a monitoring endpoint is configured.

The error monitoring placeholder sends only:

- event type
- short sanitized error name/message
- pathname without query string
- environment
- release
- timestamp

It does not send stack traces, form values, full URLs with query strings, cookies, or user identifiers.

## CLI Reports

Run:

```bash
pnpm seo:audit
```

This wraps the SEO-related Vitest coverage for route maps, sitemaps, noindex safeguards, internal links, structured data, and compliance pages.

Run:

```bash
pnpm data:freshness
```

This reads `data/source_manifest.json` and reports:

- source count
- required fixture coverage
- latest fiscal year
- latest Visa Bulletin fixture month
- missing required fixtures
- local fixture-mode warnings

JSON output is available:

```bash
pnpm data:freshness -- --json
```

## Owner Actions Before Production

- Choose GA4 or Plausible, then provide only the public measurement ID/domain.
- Add the production domain to Search Console, then provide the verification token.
- Decide whether to use Sentry, a custom endpoint, or no error collection in MVP.
- Confirm privacy copy before enabling analytics or error monitoring on production.
