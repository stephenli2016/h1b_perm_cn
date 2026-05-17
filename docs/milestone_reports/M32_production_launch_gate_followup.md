# Milestone M32 Report — Protected Production Launch Gate Follow-up

## Status
Completed for protected production. Public launch is intentionally pending owner approval.

## Built
- Redeployed Vercel production and verified the production alias `https://h1b-perm-cn.vercel.app`.
- Fixed production canonical/OG URL output so checked pages point to `https://h1b-perm-cn.vercel.app`, not an old preview URL.
- Added direct Supabase/Postgres query paths for company directories, H-1B/PERM record directories, company profile pages, and Visa Bulletin pages to avoid loading the full fixture-shaped repository at request time.
- Cleaned public-facing data copy so protected production pages no longer show internal `fixture` or `生产发布前` wording.
- Left Basic Auth, `noindex,nofollow`, and `robots.txt` `Disallow: /` enabled pending explicit owner approval for public launch.

## Files changed
- `.gitignore`
- `app/companies/page.tsx`
- `app/h1b/page.tsx`
- `app/perm/page.tsx`
- `app/h1b/company/[slug]/page.tsx`
- `app/perm/company/[slug]/page.tsx`
- `app/visa-bulletin/page.tsx`
- `app/visa-bulletin/[year]/[month]/page.tsx`
- `app/tools/company-immigration-score/page.tsx`
- `app/tools/eb2-eb3-china-priority-date-calculator/page.tsx`
- `app/tools/h1b-wage-level-checker/page.tsx`
- `components/company/company-profile.tsx`
- `components/ui/data-table.tsx`
- `lib/company-immigration-signals.ts`
- `lib/content/guide-pages.ts`
- `lib/db/postgres-directory-queries.ts`
- `lib/db/postgres-fixture-data.ts`
- `lib/db/public-query-repository.ts`

## Validation
- Command: `pnpm typecheck`
- Result: pass

- Command: `pnpm lint`
- Result: pass

- Command: `pnpm test tests/vercel-preview.test.ts tests/vercel-deployment.test.ts tests/postgres-runtime.test.ts`
- Result: pass, 17 tests

- Command: `pnpm build`
- Result: pass

- Command: local production server checks on `127.0.0.1:3022`
- Result: `/visa-bulletin` 200 in 0.37s, `/visa-bulletin/2026/06` 200 in 0.05s, company and directory pages 200

- Command: Vercel production deploy inspection
- Result: latest production deployment `dpl_FpxdCnAJTqsQW7iJyV9gKPcmr2SV` ready and aliased to `https://h1b-perm-cn.vercel.app`

- Command: authenticated production launch gate with `curl`
- Result: pass. `/health` returned Postgres mode with Supabase pooler host configured; unauthenticated `/health` returned 401 with Basic Auth challenge and `X-Robots-Tag: noindex, nofollow`.

- Production page checks:
  - `/` 200 in 0.41s
  - `/h1b/company/google` 200 in 3.38s
  - `/perm/company/google` 200 in 0.49s
  - `/h1b/company/microsoft` 200 in 0.47s
  - `/companies` 200 in 1.60s
  - `/h1b` 200 in 1.47s
  - `/perm` 200 in 0.91s
  - `/visa-bulletin` 200 in 0.17s
  - `/visa-bulletin/2026/06` 200 in 0.26s
  - `/sources` 200 in 0.13s
  - `/disclaimer` 200 in 0.14s

- SEO gate:
  - Canonical URLs: pass, all checked pages use `https://h1b-perm-cn.vercel.app`.
  - `og:url`: pass, all checked pages use `https://h1b-perm-cn.vercel.app`.
  - Meta robots: pass for protected production, all checked pages are `noindex, nofollow`.
  - `robots.txt`: pass for protected production, `Disallow: /`.
  - Disclaimer: pass, checked pages include the required Chinese disclaimer.
  - Official-source signal: pass, checked pages mention official data/source context.
  - Old preview URL leakage: pass, none found in checked page bodies.
  - Internal `fixture` / `生产发布前` copy leakage: pass, none found in checked page bodies.

## Screenshots / local URLs
- Production URL checked: `https://h1b-perm-cn.vercel.app`
- No screenshots were captured; validation was HTTP/HTML/SEO based.

## Decisions made without owner input
- Kept canonical URL on the current production Vercel domain because no custom domain has been connected yet.
- Optimized the production query path instead of changing data shape or UI layout.
- Preserved all launch protections because public launch is an owner-approval action under `AGENTS.md`.

## Known limitations
- The site is not public yet: Basic Auth remains enabled.
- Search indexing is intentionally blocked: `PRELAUNCH_NOINDEX=true`, meta robots are `noindex,nofollow`, and `robots.txt` disallows all crawlers.
- A custom domain is not connected yet; canonical URLs currently use the Vercel production domain.
- Some dynamic pages can still show a multi-second cold response, but the launch-gate sample stayed under 4 seconds after the production query optimizations.

## Owner action needed
- Approve whether to remove protection and publicly launch.
- If approved, the public launch change should set `PREVIEW_PROTECTION_ENABLED=false` and `PRELAUNCH_NOINDEX=false` in Vercel production, then redeploy and re-run the gate to confirm `robots.txt` allows crawling and page-level robots tags are indexable where intended.

## Recommended next milestone
Public launch toggle after owner approval, then M33 — Search Console and post-launch indexing/monitoring.
