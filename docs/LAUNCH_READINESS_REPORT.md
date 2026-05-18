# Launch Readiness Report — P5

Generated: 2026-05-18

## Executive Decision

Public launch is **technically ready** on the current Vercel production domain.

The current gate status is `warn`, not `blocked`: technical readiness and approval
readiness both pass, while two optional improvements remain. Analytics/Search
Console/Bing values are not configured, and the site is still using the Vercel
production domain instead of a custom domain.

Important deployment note: this P5 pass validates the current repository state and
the currently public production site. The latest local P1-P5 changes are not
committed, pushed, or redeployed yet.

## Current Gate Summary

| Area                                                     | Category  | Status | Result                                                                                                  |
| -------------------------------------------------------- | --------- | ------ | ------------------------------------------------------------------------------------------------------- |
| No secrets committed                                     | Technical | Pass   | Local secret scan found no committed OpenAI, Supabase, Postgres, Vercel, or generic token patterns.     |
| Build passes                                             | Technical | Pass   | `format`, `lint`, `typecheck`, `test`, `seo:audit`, and `build` passed locally.                         |
| Sitemap contains only approved indexable pages           | Technical | Pass   | SEO audit passed; production company sitemap returned 2,000 real company URLs and no fixture-only URLs. |
| Low-quality pages noindex                                | Technical | Pass   | Company quality rules and prelaunch/noindex controls remain covered by SEO tests.                       |
| Disclaimers visible                                      | Technical | Pass   | Sitewide short/full disclaimers and source notes are present on smoke-tested pages.                     |
| Terms/privacy/disclaimer/corrections/source pages linked | Technical | Pass   | Required compliance/source routes are present in the route map and footer groups.                       |
| Data source dates visible                                | Technical | Pass   | Manifest updated `2026-05-17`; latest fiscal year `2026`.                                               |
| No competitor-scraped data                               | Technical | Pass   | `data/source_manifest.json` contains 110 approved official sources.                                     |
| No forbidden claims                                      | Technical | Pass   | Public source scan found no unsafe guarantee/bypass claim patterns.                                     |
| Production DB imported and verified                      | Technical | Pass   | Supabase/Postgres smoke passed with 2,000 company metrics and large production aggregate tables.        |
| Legal/compliance approval                                | Approval  | Pass   | No legal draft marker remains in compliance copy.                                                       |
| Production deployment and public indexing approved       | Approval  | Pass   | M32 records public production publication with preview protection and prelaunch noindex removed.        |
| Analytics/search console optional keys                   | Optional  | Warn   | Placeholders exist, but no real GA/Plausible/Search Console/Bing values are configured yet.             |
| Custom domain/DNS                                        | Optional  | Warn   | Production is public on `https://h1b-perm-cn.vercel.app`; custom domain/DNS remains optional.           |

## Current Production Evidence

- Production URL: `https://h1b-perm-cn.vercel.app`
- Production smoke checks passed for:
  - `/`
  - `/robots.txt`
  - `/sitemaps/company-pages.xml`
  - `/h1b/company/amazon`
  - `/perm/company/infoville`
  - `/not-a-real-p5-page`
- Company sitemap returned `200`, included both H-1B and PERM company routes,
  counted 2,000 `<url>` entries, and did not contain local fixture-only company
  slugs.
- Real company pages returned `200`, `index, follow`, data source notes, and the
  required disclaimer.

## Production Data Evidence

- Runtime mode: `postgres`
- Host: `aws-1-us-east-1.pooler.supabase.com`
- `companyPageMetrics`: 2,000
- `employers`: 236,526
- `employer_aliases`: 415,100
- `locations`: 143,022
- `sourceFiles`: 110
- `company_recent_h1b_samples`: 16,000
- `company_recent_perm_samples`: 16,000
- `visaBulletinMonths`: 24
- `visaBulletinDates`: 144

## Validation Commands

- Command: `pnpm format`
- Result: pass.
- Command: `pnpm lint`
- Result: pass.
- Command: `pnpm typecheck`
- Result: pass.
- Command: `pnpm test`
- Result: pass, 21 files / 136 tests.
- Command: `pnpm test tests/launch-readiness.test.ts`
- Result: pass, 1 file / 4 tests.
- Command: `pnpm seo:audit`
- Result: pass, 4 files / 30 tests.
- Command: `pnpm build`
- Result: pass, 79 static pages generated.
- Command: `pnpm db:runtime:smoke --require-postgres`
- Result: pass.
- Command: `pnpm launch:readiness`
- Result: pass as a gate runner; readiness status is `warn`, technical ready
  `yes`, approval ready `yes`, public launch ready `yes`.
- Command: production smoke via HTTPS fetch.
- Result: pass for homepage, robots, company sitemap, real company pages, and
  404 recovery page.

## Required Before Stronger SEO Promotion

1. Add Search Console and Bing verification values if you want webmaster
   monitoring before stronger indexing promotion.
2. Add analytics, if desired, using non-secret public measurement IDs only.
3. Optionally connect a custom domain and update `NEXT_PUBLIC_SITE_URL`, then
   rerun production SEO smoke before submitting sitemaps.
4. Commit, push, and redeploy the current P1-P5 local changes when you are ready
   to publish this polish pass.

## Launch Recommendation

The site can remain public on the Vercel production domain. The next best work is
to publish the local P1-P5 polish changes, then move into post-launch SEO
operations: Search Console/Bing setup, sitemap submission, indexing checks, and
production monitoring.
