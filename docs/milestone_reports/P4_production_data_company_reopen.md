# Milestone P4 Report — Production Data And Company Page Reopen

## Status

Completed locally. P4 changes are not committed, pushed, or deployed in this pass.

## Built

- Revalidated the production Supabase/Postgres runtime after the P1-P3 user-facing polish work.
- Confirmed the production database connection is in `postgres` mode and populated with official-data aggregate tables.
- Confirmed company page reopening logic still works:
  - runtime company sitemap queries production `company_page_metrics`, `employers`, and `company_source_stats`
  - sitemap output uses real production company slugs such as `amazon`, `jpmorgan-chase`, `mathworks`, `infoville`
  - fixture-only sample slugs are not used as the Postgres sitemap source
- Confirmed real company pages still render with:
  - `200` response
  - `index, follow`
  - data source notes
  - required disclaimer
  - P2 “可以直接问雇主的问题” section
- Kept the existing safety guard: if runtime mode is Postgres but `DATABASE_URL` is absent, the company sitemap returns no company URLs rather than leaking fixture URLs.

## Files changed

- `docs/milestone_reports/P4_production_data_company_reopen.md`

## Validation

- Command: `pnpm format`
- Result: pass.
- Command: `pnpm lint`
- Result: pass.
- Command: `pnpm typecheck`
- Result: pass.
- Command: `pnpm test`
- Result: pass, 21 files / 136 tests.
- Command: `pnpm seo:audit`
- Result: pass, 4 files / 30 tests.
- Command: `pnpm build`
- Result: pass, 79 static pages generated.
- Command: `set -a; source .env.local; set +a; pnpm db:runtime:smoke --require-postgres`
- Result: pass; runtime mode `postgres`, host `aws-1-us-east-1.pooler.supabase.com`.
- Verified key production counts:
  - `company_page_metrics`: 2,000
  - `employers`: 236,526
  - `employer_aliases`: 415,100
  - `locations`: 143,022
  - `source_files`: 110
  - `company_recent_h1b_samples`: 16,000
  - `company_recent_perm_samples`: 16,000
  - `visa_bulletin_months`: 24
  - `visa_bulletin_dates`: 144
- Command: local Postgres-mode request to `http://localhost:3001/sitemaps/company-pages.xml`
- Result: pass; returned real production company URLs under `https://h1b-perm-cn.vercel.app/...`.
- Command: local Postgres-mode company page smoke for `/h1b/company/amazon` and `/perm/company/infoville`
- Result: pass; both returned `200`, `index, follow`, source notes, disclaimer, and company-question section.
- Command: `pnpm launch:readiness`
- Result: pass with optional warnings only; technical ready, approval ready, and public launch ready all reported `yes`.

## Screenshots / local URLs

- Local Postgres-mode sitemap verified at `http://localhost:3001/sitemaps/company-pages.xml`.
- Local Postgres-mode H-1B sample verified at `http://localhost:3001/h1b/company/amazon`.
- Local Postgres-mode PERM sample verified at `http://localhost:3001/perm/company/infoville`.

## Decisions made without owner input

- Treated P4 as a revalidation pass rather than a redeploy, because the production-data/company-page reopening code already exists and the current request did not explicitly ask for deployment.
- Used local Next.js in Postgres mode to verify the same runtime paths Vercel uses, while avoiding a production deployment change.
- Kept the public URL base as `https://h1b-perm-cn.vercel.app`; custom domain/DNS remains a separate owner-approved action.

## Known limitations

- P4 was verified locally against production Supabase/Postgres data, but this pass did not push or redeploy the current P1-P4 local changes.
- The public site still uses the last deployed commit until you approve commit/push/deploy.
- `pwdRecords`, `uscisH1BEmployerRecords`, `guidePages`, and `recentEtlRuns` are not loaded as runtime row arrays in the current smoke output; their relevant aggregate signals remain present through production aggregate tables and page payloads.

## Owner action needed

- Confirm whether P4 is accepted.
- Separately approve commit/push/deploy when you want these P1-P4 local changes published.

## Recommended next milestone

P5 — update and run the final launch-readiness/user-facing gate after owner confirmation.
