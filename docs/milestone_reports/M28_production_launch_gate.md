# Milestone M28 Report — Production Launch Gate

## Status

Completed — public launch blocked

## Built

- Added a repeatable launch readiness checker: `pnpm launch:readiness`.
- Added tests for the launch gate, sitemap constraints, and required compliance
  footer links.
- Created `docs/LAUNCH_READINESS_REPORT.md`.
- Confirmed the technical checks are passing while public launch remains blocked
  by missing production data import, legal approval, and owner deployment/DNS
  approval.

## Files changed

- `docs/LAUNCH_READINESS_REPORT.md`
- `docs/milestone_reports/M28_production_launch_gate.md`
- `package.json`
- `scripts/launch-readiness.ts`
- `tests/launch-readiness.test.ts`

## Validation

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
- Result: pass after `pnpm format:write` formatted new M28 files.

- Command: `pnpm test`
- Result: pass; 18 files / 114 tests.

- Command: `pnpm build`
- Result: pass; Next.js production build generated 84 static pages.

- Command: `pnpm seo:audit`
- Result: pass; 4 SEO/compliance test files / 28 tests.

- Command: `pnpm deploy:validate`
- Result: pass.

- Command: `pnpm data:freshness`
- Result: pass; 13/13 required fixtures present. Warning: 15 downloaded
  production files are absent in local fixture mode, expected before production
  import.

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
- Result: pass; no committed secrets found.

## Screenshots / local URLs

- Not applicable. M28 is a release gate and report milestone.

## Decisions made without owner input

- Treated missing production data import as a blocker, not a warning.
- Treated legal/compliance draft status as a blocker for public launch.
- Treated owner approval for production deploy, domain/DNS, and public indexing
  as mandatory before launch.
- Kept `PRELAUNCH_NOINDEX=true` as the recommended setting for private preview
  testing.

## Known limitations

- No production Vercel deployment was created.
- No domain or DNS changes were made.
- No production Supabase/Postgres import was run.
- No Search Console/Bing verification tokens are configured.

## Owner action needed

Explicit owner decision is required:

- Do not approve public launch yet, and continue to M29 dry-run maintenance
  automation; or
- Approve a private Vercel Preview only, with `PRELAUNCH_NOINDEX=true`; or
- Provide production data/secrets/legal approval and explicitly approve a
  future public launch flow.

## Recommended next milestone

M29 — Scheduled data update automation
