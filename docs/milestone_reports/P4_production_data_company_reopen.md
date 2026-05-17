# Milestone P4 Report — Production Data And Company Page Reopen

## Status

Completed

## Built

- Verified the production Supabase/Postgres runtime is reachable and populated with official-data aggregate tables.
- Reopened production company-page sitemap generation for `LOCAL_DATA_MODE=postgres` by querying `company_page_metrics`, `employers`, and `company_source_stats` directly instead of falling back to fixture-only URLs.
- Kept the safety guard that returns an empty company sitemap if production is configured for Postgres but `DATABASE_URL` is absent.
- Published the change to GitHub `main`, triggering a Vercel production deployment.
- Verified live production company pages are indexable and backed by real company data.

## Files changed

- `lib/seo/sitemaps.ts`
- `tests/seo.test.ts`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `docs/PRODUCTION_AGGREGATES_M31.md`
- `docs/milestone_reports/P4_production_data_company_reopen.md`

## Validation

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm test`
- Result: pass; 21 files / 134 tests.

- Command: `pnpm seo:audit`
- Result: pass; 4 SEO/compliance test files / 30 tests.

- Command: `pnpm build`
- Result: pass; Next.js production build completed and generated 79 static pages plus dynamic runtime routes.

- Command: `pnpm db:runtime:smoke --require-postgres`
- Result: pass; runtime mode `postgres`, host `aws-1-us-east-1.pooler.supabase.com`.

- Command: Supabase/Postgres read-only production counts.
- Result: pass; key counts verified: `company_page_metrics` 2,000, `company_yearly_immigration_stats` 13,620, `company_breakdown_stats` 111,857, `company_wage_stats` 2,000, `company_source_stats` 2,000, `company_recent_h1b_samples` 16,000, `company_recent_perm_samples` 16,000, `employers` 236,526, `employer_aliases` 415,100, `locations` 143,022, `source_files` 110, `visa_bulletin_months` 24.

- Command: `pnpm launch:readiness`
- Result: gate runner executed successfully; report still says `blocked` because the historical launch gate retains conservative manual launch/deployment blockers and treats `.env.example` fixture mode as the documented default. This was not used as the pass/fail gate for reopening real production company pages.

- Command: Vercel deployment inspection.
- Result: pass; deployment `dpl_HJqHohx3k7egYFGGECuXTzBvcZDj` for commit `235ca27f7e54ae5b35025629e749cc2aa3c1381a` reached `READY` with target `production`.

- Command: live production smoke via `curl`.
- Result: pass; `https://h1b-perm-cn.vercel.app/sitemaps/company-pages.xml` returned 2,000 real company URLs, includes both `/h1b/company/` and `/perm/company/`, and contains no localhost or fixture-only company URLs.

- Command: live company page smoke via `curl`.
- Result: pass; `/h1b/company/adobe`, `/perm/company/adobe`, `/h1b/company/amazon`, and `/perm/company/infoville` returned `200` with canonical URLs, `robots: index, follow`, source notes, and the required disclaimer.

- Command: live SEO smoke via `curl`.
- Result: pass; `/robots.txt`, `/sitemap.xml`, and `/companies` returned `200`; `robots.txt` allows crawling and points to the production sitemap.

## Screenshots / local URLs

- Production sitemap: `https://h1b-perm-cn.vercel.app/sitemaps/company-pages.xml`
- Production H-1B sample: `https://h1b-perm-cn.vercel.app/h1b/company/adobe`
- Production PERM sample: `https://h1b-perm-cn.vercel.app/perm/company/adobe`
- Production deployment: `https://h1b-perm-490cv5gpi-yuchenli2015-6323s-projects.vercel.app`

## Decisions made without owner input

- Used a lightweight runtime SQL query for sitemap generation instead of loading the full company profile per URL, to keep the dynamic sitemap safe on Vercel.
- Ranked sitemap candidates by quality score, recent record count, job-title count, location count, latest fiscal year, company name, and mode.
- Kept the current public URL base as `https://h1b-perm-cn.vercel.app` because no custom domain/DNS change was requested in this step.

## Known limitations

- The production runtime currently exposes the first 2,000 highest-quality H-1B/PERM company routes in the company sitemap.
- `launch:readiness` still contains a conservative full-site launch blocker that should be updated separately before treating it as the final public-launch approval report.
- USCIS H-1B Employer Data Hub detail rows are not stored as raw runtime rows; their aggregate counts are preserved in production company metrics/yearly stats.

## Owner action needed

- None for the production-data/company-page reopen itself.
- Later: approve any custom domain/DNS changes if you want to move away from the `vercel.app` URL.

## Recommended next milestone

P5 — update the full launch readiness gate so it reflects the now-live Supabase production data state and separates technical readiness from owner/legal/DNS approvals.
