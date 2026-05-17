# Milestone M27 Report — Vercel Deployment Preparation

## Status

Completed

## Built

- Added `vercel.json` with the Next.js framework preset, locked pnpm install
  command, package build command, baseline security headers, and sitemap/robots
  cache headers.
- Added `PRELAUNCH_NOINDEX` deployment safety mode. When enabled, metadata uses
  `noindex,nofollow`, `/robots.txt` disallows all crawlers, and sitemap outputs
  no URLs.
- Added Vercel deployment documentation with environment variable checklist,
  deployment checklist, domain/DNS checklist, and owner-approval gates.
- Added `pnpm deploy:validate` and tests for Vercel config, environment
  placeholders, no committed env values, DNS gating, and prelaunch noindex
  behavior.
- Updated README files with the new deployment validation and private preview
  guidance.

Official Vercel docs checked:

- <https://vercel.com/docs/frameworks/full-stack/nextjs>
- <https://vercel.com/docs/project-configuration>
- <https://vercel.com/docs/project-configuration/vercel-json>
- <https://vercel.com/docs/environment-variables>
- <https://vercel.com/docs/domains/working-with-domains/add-a-domain>

## Files changed

- `.env.example`
- `README.md`
- `README_OWNER.md`
- `app/robots.ts`
- `docs/VERCEL_DEPLOYMENT_M27.md`
- `docs/milestone_reports/M27_vercel_deployment_preparation.md`
- `lib/observability/root-metadata.ts`
- `lib/seo/metadata.ts`
- `lib/seo/prelaunch.ts`
- `lib/seo/sitemaps.ts`
- `package.json`
- `scripts/validate-vercel-prep.ts`
- `tests/vercel-deployment.test.ts`
- `vercel.json`

## Validation

- Command: `pnpm deploy:validate`
- Result: pass; Vercel config, headers, package scripts, env safety, and docs
  checks passed.

- Command: `pnpm test tests/vercel-deployment.test.ts`
- Result: pass; 1 file / 5 tests.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm format`
- Result: pass after `pnpm format:write` formatted new M27 files.

- Command: `pnpm test`
- Result: pass; 17 files / 111 tests.

- Command: `pnpm build`
- Result: pass; Next.js production build generated 84 static pages.

- Command: `PRELAUNCH_NOINDEX=true pnpm build`
- Result: pass; private-test noindex mode also builds successfully.

- Command: `pnpm seo:audit`
- Result: pass; 4 SEO/compliance test files / 28 tests.

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

- Not applicable. M27 prepared deployment configuration and documentation only.

## Decisions made without owner input

- Used `pnpm install --frozen-lockfile` and `pnpm build` as Vercel project
  commands to align with the existing lockfile and package script.
- Kept Vercel environment variables out of `vercel.json`; they belong in Vercel
  Project Settings.
- Added conservative security headers without adding CSP yet, because analytics
  and monitoring providers are still optional and may change the CSP allowlist.
- Made `PRELAUNCH_NOINDEX` server-side only, not `NEXT_PUBLIC_`, because the
  browser does not need this value.

## Known limitations

- No Vercel project was created or linked because that requires owner account
  access.
- No Preview or Production deployment was run.
- No custom domain, DNS record, or Search Console/Bing verification changes were
  made.
- `PRELAUNCH_NOINDEX=false` should not be used in production until the M28
  launch gate explicitly approves public indexing.

## Owner action needed

None for M27. For actual deployment, the owner must approve Vercel project
connection, environment variable entry, production deploy/promotion, and any
domain or DNS changes.

## Recommended next milestone

M28 — Production launch gate
