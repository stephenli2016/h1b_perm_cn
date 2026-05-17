# Launch Readiness Report — M28

Generated: 2026-05-17

## Executive Decision

Public launch is **not approved**.

The technical readiness checks passed, but the site must stay in prelaunch /
private-test mode because three launch blockers remain:

1. Production official-data import has not run.
2. Legal/compliance copy is still marked as owner/legal-review draft.
3. Owner has not explicitly approved Vercel production deployment, domain/DNS,
   or public indexing.

Recommended setting for any Vercel Preview or private test deployment:

```bash
PRELAUNCH_NOINDEX=true
LOCAL_DATA_MODE=fixture
```

Do not set `PRELAUNCH_NOINDEX=false` in production until this report is updated
and the owner explicitly approves public launch.

## Checklist

| Area                                                     | Status  | Result                                                                                                  |
| -------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| No secrets committed                                     | Pass    | Local secret scan found no committed OpenAI, Supabase, Postgres, Vercel, or generic token patterns.     |
| Build passes                                             | Pass    | `pnpm build` completed successfully and generated 84 static pages.                                      |
| Sitemap contains only approved indexable pages           | Pass    | `pnpm seo:audit` passed; no search-param URLs or noindex route URLs are in sitemaps.                    |
| Low-quality pages noindex                                | Pass    | Company quality rules and SEO tests keep low-data company pages out of indexable sitemap output.        |
| Disclaimers visible                                      | Pass    | Sitewide disclaimer, short disclaimer, and legal draft notice are present.                              |
| Terms/privacy/disclaimer/corrections/source pages linked | Pass    | Required compliance/source routes exist in route map/footer groups and tests pass.                      |
| Data source dates visible                                | Pass    | Manifest updated `2026-05-16`; latest fixture fiscal year is `2026`.                                    |
| No competitor-scraped data                               | Pass    | `data/source_manifest.json` uses approved official hosts only.                                          |
| No forbidden claims                                      | Pass    | Public source scan and content tests found no unsafe guarantee/bypass claims.                           |
| Analytics/search console optional keys                   | Warning | Placeholders exist, but no real GA/Plausible/Search Console/Bing tokens are configured.                 |
| Production DB imported or fixture launch disabled        | Blocked | Production official-data import has not run; local fixture mode remains the documented default.         |
| Legal/compliance approval                                | Blocked | Legal pages still include the draft notice requiring owner and qualified legal review.                  |
| Production deploy/DNS/public indexing approval           | Blocked | No Vercel production deploy, domain connection, DNS change, or public indexing approval has been given. |

## Validation Commands

- Command: `pnpm launch:readiness`
- Result: pass as a gate runner; readiness status is `blocked`, public launch
  ready is `no`.

- Command: `pnpm test tests/launch-readiness.test.ts`
- Result: pass; 1 file / 3 tests.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm format`
- Result: pass after formatting new M28 files.

- Command: `pnpm test`
- Result: pass; 18 files / 114 tests.

- Command: `pnpm build`
- Result: pass; production build generated 84 static pages.

- Command: `pnpm seo:audit`
- Result: pass; 4 SEO/compliance test files / 28 tests.

- Command: `pnpm deploy:validate`
- Result: pass.

- Command: `pnpm data:freshness`
- Result: pass; 13/13 required fixtures present. Warning: 15 downloaded
  production files are absent in local fixture mode.

- Command: `pnpm db:validate`
- Result: pass; 2 files / 18 tests.

- Command: `pnpm db:production:validate`
- Result: pass.

- Command: `pnpm etl:test`
- Result: pass; 46 Python ETL tests.

- Command: `pnpm etl:validate`
- Result: pass; 15 source manifest entries validated.

- Command: `git diff --check`
- Result: pass.

- Command: targeted local secret scan for OpenAI, Supabase, Postgres, Vercel,
  and generic token patterns.
- Result: pass.

## Required Before Public Launch

1. Import official production data into Supabase/Postgres or explicitly disable
   fixture-mode launch.
2. Run production source downloads and parser/import validation against official
   files, not only local fixtures.
3. Complete owner and qualified legal review for disclaimer, terms, privacy,
   methodology, correction, and source pages.
4. Configure production Vercel environment variables in Project Settings.
5. Keep `PRELAUNCH_NOINDEX=true` during preview/private tests.
6. Re-run this report with production data and final env settings.
7. Obtain explicit owner approval for:
   - production deployment/promotion
   - custom domain connection
   - DNS changes
   - Search Console/Bing verification if used
   - changing `PRELAUNCH_NOINDEX=false`
   - public indexing

## Launch Recommendation

Do not publicly launch yet.

Safe next work: continue to M29 scheduled data update automation in dry-run mode
or perform a private Vercel Preview with `PRELAUNCH_NOINDEX=true`.
