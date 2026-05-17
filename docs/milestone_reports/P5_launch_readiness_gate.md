# Milestone P5 Report — Launch Readiness Gate

## Status

Completed

## Built

- Updated `pnpm launch:readiness` so it separates technical readiness, approval readiness, and optional launch improvements.
- Changed the production-data gate to pass when current runtime env is Postgres-backed or when durable P4 production evidence exists.
- Changed the production deployment gate to pass when durable M32 public-launch evidence exists.
- Kept `.env.example` safely defaulted to `LOCAL_DATA_MODE=fixture`; the fixture default no longer incorrectly blocks production readiness when production evidence exists.
- Added an optional custom-domain/DNS warning so the current Vercel domain is treated as launch-safe but not confused with a completed custom-domain step.
- Updated `docs/LAUNCH_READINESS_REPORT.md` to the P5 current state.

## Files changed

- `scripts/launch-readiness.ts`
- `tests/launch-readiness.test.ts`
- `docs/LAUNCH_READINESS_REPORT.md`
- `docs/milestone_reports/P5_launch_readiness_gate.md`

## Validation

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm test`
- Result: pass; 21 files / 135 tests.

- Command: `pnpm test tests/launch-readiness.test.ts`
- Result: pass; 1 file / 4 tests.

- Command: `pnpm seo:audit`
- Result: pass; 4 files / 30 tests.

- Command: `pnpm build`
- Result: pass; production build completed with 79 static pages plus dynamic runtime routes.

- Command: `pnpm db:runtime:smoke --require-postgres`
- Result: pass; mode `postgres`, host `aws-1-us-east-1.pooler.supabase.com`, `companyPageMetrics` 2,000, employers 236,526, aliases 415,100, source files 110.

- Command: `pnpm launch:readiness`
- Result: pass as a gate runner; status `warn`, technical ready `yes`, approval ready `yes`, public launch ready `yes`. Warnings are optional analytics/search console keys and optional custom domain/DNS.

- Command: `git diff --check`
- Result: pass.

- Command: Vercel deployment inspection.
- Result: pass; deployment `dpl_9n9iHomfYGt6YZub1zHdjs9EeHpC` for commit `f2a4b48c2f13766e6ebb78e155f03a5bb475c782` reached `READY` with target `production`.

- Command: live production smoke via `curl`.
- Result: pass; `/` returned `200` with `index, follow`, production canonical URL, and disclaimer; `/robots.txt` returned `200` with `Allow: /`; `/sitemaps/company-pages.xml` returned 2,000 real company URLs with H-1B and PERM routes and no fixture URLs.

## Screenshots / local URLs

- Production URL: `https://h1b-perm-cn.vercel.app`
- Company sitemap: `https://h1b-perm-cn.vercel.app/sitemaps/company-pages.xml`
- Production deployment: `https://h1b-perm-clbuseptm-yuchenli2015-6323s-projects.vercel.app`

## Decisions made without owner input

- Treated P4 production-data verification and M32 public-launch verification as durable launch evidence, so the gate can run without printing or reading secrets from `.env.local`.
- Kept optional analytics/search console and custom-domain/DNS as warnings rather than blockers.
- Kept the current Vercel production domain as launch-ready because no custom domain/DNS change was requested.

## Known limitations

- `pnpm launch:readiness` is still a static/local gate plus durable evidence check; it does not itself fetch Vercel or Supabase on every run.
- Search Console, Bing verification, and analytics remain unconfigured.
- Custom domain/DNS remains optional and not connected.

## Owner action needed

- None for the launch readiness gate itself.
- Optional: provide Search Console/Bing/analytics values or approve a custom domain/DNS step later.

## Recommended next milestone

P6 — post-launch SEO operations: Search Console/Bing setup, sitemap submission, indexing checks, and production monitoring.
