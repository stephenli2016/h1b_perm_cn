# Launch Readiness Report — P5

Generated: 2026-05-17

## Executive Decision

Public launch is **technically ready** on the current Vercel production domain.

The launch gate now separates:

- Technical readiness: build, SEO, official-source policy, disclaimers, and
  production data.
- Approval readiness: legal/compliance copy and owner-approved public production
  publication.
- Optional improvements: analytics/search console tokens and custom domain/DNS.

Current gate status is `warn`, not `blocked`, because two optional items remain:
analytics/search console tokens are not configured, and the site is still on the
Vercel production domain rather than a custom domain.

## Current Gate Summary

| Area                                                     | Category  | Status | Result                                                                                                       |
| -------------------------------------------------------- | --------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| No secrets committed                                     | Technical | Pass   | Local secret scan found no committed OpenAI, Supabase, Postgres, Vercel, or generic token patterns.          |
| Build passes                                             | Technical | Pass   | Required `lint`, `typecheck`, `test`, and `build` scripts exist and have current passing validation.         |
| Sitemap contains only approved indexable pages           | Technical | Pass   | Sitemap helpers and SEO audit tests are present; company sitemap now uses verified production data.          |
| Low-quality pages noindex                                | Technical | Pass   | Company quality rules and prelaunch/noindex controls remain covered by SEO tests.                            |
| Disclaimers visible                                      | Technical | Pass   | Sitewide short/full disclaimers and public compliance notices are present.                                   |
| Terms/privacy/disclaimer/corrections/source pages linked | Technical | Pass   | Required compliance/source routes are present in the route map and footer groups.                            |
| Data source dates visible                                | Technical | Pass   | Manifest updated `2026-05-17`; latest fiscal year `2026`.                                                    |
| No competitor-scraped data                               | Technical | Pass   | `data/source_manifest.json` contains 110 approved official sources.                                          |
| No forbidden claims                                      | Technical | Pass   | Public source scan found no unsafe guarantee/bypass claim patterns.                                          |
| Production DB imported and verified                      | Technical | Pass   | P4 records Supabase/Postgres runtime smoke plus live company sitemap/page smoke against production data.     |
| Legal/compliance approval                                | Approval  | Pass   | No legal draft marker remains in compliance copy.                                                            |
| Production deployment and public indexing approved       | Approval  | Pass   | M32 records public production publication with preview protection and prelaunch noindex removed.             |
| Analytics/search console optional keys                   | Optional  | Warn   | Placeholders exist, but no real GA/Plausible/Search Console/Bing values are configured yet.                  |
| Custom domain/DNS                                        | Optional  | Warn   | Production is public on `https://h1b-perm-cn.vercel.app`; custom domain/DNS remains optional owner approval. |

## Current Production Evidence

- Production data gate: P4 verified Supabase/Postgres runtime mode with
  `company_page_metrics` 2,000, employers 236,526, aliases 415,100, source files
  110, and live company sitemap/page smoke.
- Public launch gate: M32 verified production Basic Auth removed,
  `PRELAUNCH_NOINDEX=false`, `robots.txt` allows crawling, and production pages
  use `index, follow` where intended.
- Latest P4/P5 production domain:
  `https://h1b-perm-cn.vercel.app`.

## Validation Commands

- Command: `pnpm launch:readiness`
- Result: pass as a gate runner; readiness status is `warn`, technical ready
  `yes`, approval ready `yes`, public launch ready `yes`.

- Command: `pnpm test tests/launch-readiness.test.ts`
- Result: pass; validates current ready-with-warnings state and the fallback
  blocked state when production evidence is absent.

## Required Before Stronger SEO Promotion

1. Add Search Console and Bing verification values if you want webmaster
   monitoring before stronger indexing promotion.
2. Add analytics, if desired, using non-secret public measurement IDs only.
3. Optionally connect a custom domain and update `NEXT_PUBLIC_SITE_URL`, then
   rerun production SEO smoke before submitting sitemaps.

## Launch Recommendation

The site can remain public on the Vercel production domain. The next best work
is post-launch SEO operations: Search Console/Bing setup, sitemap submission,
indexing checks, and production monitoring.
