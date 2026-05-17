# Milestone M32 Report — Vercel Supabase Preview

## Status

Partially completed / Blocked by Vercel environment-variable write access

## Built

- Located the existing Vercel project:
  - Team: `team_Oson62bGqFKyAmhvdipDQptX`
  - Project: `h1b-perm-cn`
  - Project ID: `prj_LOxCRuMFtt0oCcN7IaBFQWcNxkzR`
- Inspected the latest Vercel deployment logs. The current `main` deployment is
  failing because `LOCAL_DATA_MODE=postgres` is enabled in Vercel but
  `DATABASE_URL` is missing.
- Added M32 private-preview documentation with the exact Preview environment
  variables needed for Supabase Session Pooler, prelaunch noindex, and preview
  protection.
- Added an optional app-level Basic Auth `proxy.ts` gate for private preview
  deployments:
  - `PREVIEW_PROTECTION_ENABLED`
  - `PREVIEW_PROTECTION_USERNAME`
  - `PREVIEW_PROTECTION_PASSWORD`
  - `PREVIEW_PROTECTION_REALM`
- Added `pnpm deploy:preview:validate`.
- Added tests for preview protection, environment placeholders, and preview
  validation.
- Fixed the Supabase-backed Vercel build strategy: company pages remain dynamic
  in database mode unless `PRERENDER_COMPANY_PAGES=true` is explicitly set.
  This avoids Vercel trying to pre-render thousands of company routes during
  build.

## Files changed

- `.env.example`
- `app/h1b/company/[slug]/page.tsx`
- `app/perm/company/[slug]/page.tsx`
- `docs/VERCEL_PREVIEW_M32.md`
- `docs/milestone_reports/M32_vercel_supabase_preview.md`
- `lib/security/preview-protection.ts`
- `lib/seo/company-static-generation.ts`
- `package.json`
- `proxy.ts`
- `scripts/validate-vercel-preview.ts`
- `tests/vercel-preview.test.ts`

## Validation

- Command: Vercel connector `list_projects`
- Result: pass; found existing `h1b-perm-cn` project.

- Command: Vercel connector `get_deployment_build_logs`
- Result: pass; confirmed latest deployment failure is missing
  `DATABASE_URL`.

- Command: Vercel docs search for environment variables and protected
  deployments
- Result: pass; confirmed env vars belong in Project Settings/REST API and
  protected deployment access can use Vercel protection/bypass mechanisms.

- Command: `pnpm deploy:preview:validate`
- Result: pass.

- Command: `pnpm deploy:validate`
- Result: pass.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm test`
- Result: pass; 21 test files and 128 tests.

- Command: `pnpm db:production:validate`
- Result: pass.

- Command: `pnpm build`
- Result: pass; fixture-mode local build generated 84 static pages.

- Command: Supabase-backed runtime smoke with Session Pooler
- Result: pass; loaded 236,526 employers, 415,100 aliases, 143,022 locations,
  2,000 company metrics, 16,000 H-1B samples, and 16,000 PERM samples.

- Command: Supabase-backed preview build with `LOCAL_DATA_MODE=postgres`,
  `PRELAUNCH_NOINDEX=true`, `PREVIEW_PROTECTION_ENABLED=true`, and
  `PRERENDER_COMPANY_PAGES=false`
- Result: pass; generated 104 static pages and kept company pages dynamic.

- Command: targeted secret scan on changed files
- Result: pass; no real secrets found.

## Screenshots / local URLs

- No public preview URL was created in this milestone because the available
  Vercel connector cannot write the required Project Settings environment
  variables.

## Decisions made without owner input

- Used Next.js 16 `proxy.ts` instead of deprecated `middleware.ts`.
- Made preview protection fail closed when enabled without a password.
- Disabled company-page static parameter generation by default in database mode
  so Vercel does not pre-render 4,000+ company routes.
- Kept `PRELAUNCH_NOINDEX=true` as the required M32 preview setting.
- Did not promote, connect domains, change DNS, or set
  `PRELAUNCH_NOINDEX=false`.

## Known limitations

- The Vercel connector available in this session can inspect projects,
  deployments, logs, protected URLs, and deploy, but it does not expose a tool
  for writing Project Settings environment variables.
- `vercel` CLI and `VERCEL_TOKEN` are not available in the local environment.
- Therefore the Supabase-backed protected Vercel Preview cannot be completed
  from Codex alone until the required Vercel env vars are added.

## Owner action needed

Add these variables in Vercel Project Settings for the Preview environment:

```text
LOCAL_DATA_MODE=postgres
DATABASE_POOL_MAX=1
DATABASE_URL=<Supabase Session Pooler Postgres connection string>
PRELAUNCH_NOINDEX=true
PREVIEW_PROTECTION_ENABLED=true
PREVIEW_PROTECTION_USERNAME=preview
PREVIEW_PROTECTION_PASSWORD=<strong random password>
PRERENDER_COMPANY_PAGES=false
NEXT_PUBLIC_SITE_URL=<preview deployment URL after deploy>
NEXT_PUBLIC_CONTACT_EMAIL=<owner contact email>
```

After those are set, trigger a new Preview deployment. Do not promote to
Production, connect a custom domain, change DNS, or set
`PRELAUNCH_NOINDEX=false`.

## Recommended next milestone

M33 — After Vercel Preview env vars are set, trigger and verify a protected
Supabase-backed Preview deployment, then rerun the production launch gate.
