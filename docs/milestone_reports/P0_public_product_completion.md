# Milestone P0 Report — Public Product Completion

## Status

Completed locally. Not pushed/deployed in this step because production deployment is owner-gated.

## Built

- Reworked the homepage, company directory, H-1B directory, PERM directory, and Visa Bulletin hub into user-facing Chinese product pages.
- Added four explicit priority tool pages:
  - `/tools/opt-to-h1b-timeline`
  - `/tools/stem-opt-employer-checklist`
  - `/tools/wage-negotiation-with-h1b-data`
  - `/tools/visa-bulletin-alert`
- Removed public-facing internal milestone, draft, stub, fixture, and “待接入” style wording from `app/`, `components/`, and public content helpers.
- Productionized the correction request route so valid requests write to `public.correction_requests` in Postgres mode, with a local fixture fallback and a no-echo confirmation page.
- Promoted qualified data hub routes into sitemap coverage while keeping filtered/search-result pages `noindex`.
- Updated local non-secret `NEXT_PUBLIC_SITE_URL` to `https://h1b-perm-cn.vercel.app` so canonical URLs resolve to the public production host.

## Files changed

- `app/page.tsx`
- `app/about/page.tsx`
- `app/companies/page.tsx`
- `app/h1b/page.tsx`
- `app/perm/page.tsx`
- `app/visa-bulletin/page.tsx`
- `app/corrections/*`
- `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/sources/page.tsx`
- `app/tools/*`
- `components/company/company-profile.tsx`
- `components/compliance/*`
- `components/content/content-article.tsx`
- `lib/compliance/content.ts`
- `lib/content/guide-pages.ts`
- `lib/seo/sitemaps.ts`
- `lib/site.ts`
- `scripts/launch-readiness.ts`
- Related tests under `tests/`
- `.env.local` non-secret canonical URL value only

## Validation

- Command: `pnpm format`
- Result: pass
- Command: `pnpm lint`
- Result: pass
- Command: `pnpm typecheck`
- Result: pass
- Command: `pnpm test`
- Result: pass, 21 files / 131 tests
- Command: `pnpm build`
- Result: pass, 80 static pages generated
- Command: `pnpm seo:audit`
- Result: pass, 4 files / 29 tests
- Command: `pnpm data:freshness`
- Result: pass, 110 sources, latest fiscal year 2026, latest Visa Bulletin fixture 2026-06
- Command: `pnpm db:production:validate`
- Result: pass
- Command: `pnpm etl:test`
- Result: pass, 64 tests
- Command: `pnpm launch:readiness`
- Result: expected `blocked`, with no failures. Remaining blockers are owner-gated production data/deployment checks in the launch script.

## Screenshots / local URLs

- Browser-verified local production server at `http://127.0.0.1:3000`.
- Verified canonical host: `https://h1b-perm-cn.vercel.app`.
- Verified `index, follow` on homepage, `/companies`, and `/tools/visa-bulletin-alert`.
- Verified `noindex, follow` on filtered `/h1b?employer=google`, `/perm?employer=google`, and submitted tool-result pages.
- Verified `/robots.txt`, `/sitemaps/core.xml`, `/sitemaps/tools.xml`, and `/sitemaps/visa-bulletin.xml`.

## Decisions made without owner input

- Treated “P0” as the urgent public-product completion pass: user-facing copy, missing high-priority tool pages, correction request persistence, canonical/sitemap quality, and launch-readiness cleanup.
- Used cautious Chinese wording throughout and kept all personalized immigration/legal decisions out of tools.
- Did not submit a browser correction form against local production env to avoid writing a test request into the real database.

## Known limitations

- Changes are complete locally but not pushed to GitHub or deployed to Vercel in this step.
- Analytics/search console remain optional placeholders unless you later provide real IDs.
- Launch readiness still reports owner-gated blockers for production deployment/data approval by design.

## Owner action needed

- Confirm whether to proceed to P1.
- Separately approve if you want me to commit/push P0 to GitHub and let Vercel deploy it.

## Recommended next milestone

P1 — Complete the next priority bucket after owner confirmation.
