# Milestone M32 Report — Public Production Launch

## Status

Completed.

## Built

- Removed production Basic Auth by setting `PREVIEW_PROTECTION_ENABLED=false` in Vercel Production.
- Removed production prelaunch noindex by setting `PRELAUNCH_NOINDEX=false` in Vercel Production.
- Redeployed production so the new environment variables took effect.
- Synced local `.env.local` non-secret launch toggles to `false` for local visibility.
- Verified public, unauthenticated access to the production site.

## Files changed

- `.env.local` local-only, gitignored: `PREVIEW_PROTECTION_ENABLED=false`, `PRELAUNCH_NOINDEX=false`
- `docs/milestone_reports/M32_public_launch.md`

## Validation

- Command: `pnpm dlx vercel env ls production --scope yuchenli2015-6323s-projects`
- Result: production launch toggles exist as Production-scoped variables; Vercel CLI masks values as encrypted.

- Command: `pnpm dlx vercel redeploy h1b-perm-cn.vercel.app --target production --scope yuchenli2015-6323s-projects`
- Result: production redeploy completed and aliased to `https://h1b-perm-cn.vercel.app`.

- Deployment:
  - ID: `dpl_AtAWgTdgGuVH88xRnjDVZzv8pXHR`
  - URL: `https://h1b-perm-bwi33sgpd-yuchenli2015-6323s-projects.vercel.app`
  - Alias: `https://h1b-perm-cn.vercel.app`
  - Status: Ready

- Public launch gate:
  - `/health`: 200 unauthenticated, no Basic Auth challenge, no `X-Robots-Tag: noindex`, `dataMode=postgres`
  - `/robots.txt`: 200, `Allow: /`, sitemap points to `https://h1b-perm-cn.vercel.app/sitemap.xml`
  - `/sitemap.xml`: 200, contains production URLs
  - `/`: 200, `index, follow`, canonical production URL
  - `/h1b/company/google`: 200, `index, follow`, canonical production URL
  - `/perm/company/google`: 200, `index, follow`, canonical production URL
  - `/h1b/company/microsoft`: 200, `index, follow`, canonical production URL
  - `/visa-bulletin/2026/06`: 200, `index, follow`, canonical production URL
  - `/sources`: 200, `index, follow`, canonical production URL
  - `/disclaimer`: 200, `index, follow`, canonical production URL

- Deliberate noindex pages still verified:
  - `/companies`: 200, `noindex, follow`
  - `/h1b`: 200, `noindex, follow`
  - `/perm`: 200, `noindex, follow`
  - `/visa-bulletin`: 200, `noindex, follow`

- Content checks:
  - Required Chinese disclaimer found on checked pages.
  - Official source/data context found on checked pages.
  - No old preview URL leakage found.
  - No public-facing `fixture` or `生产发布前` copy found.

## Screenshots / local URLs

- Production URL: `https://h1b-perm-cn.vercel.app`
- No screenshots were captured; validation was HTTP/HTML/SEO based.

## Decisions made without owner input

- Kept Preview environment protected while opening Production.
- Kept directory and top-level aggregate data entry pages `noindex, follow` because current code intentionally reserves indexing for company pages, tools, guides, compliance pages, and monthly Visa Bulletin pages.
- Kept canonical URLs on the Vercel production domain because no custom domain has been connected.

## Known limitations

- Production is public on the Vercel domain, not a custom domain.
- Vercel CLI masks even non-secret launch toggles as encrypted in `env ls`, so behavior was verified by public HTTP checks instead of reading values back.
- Some directory hub pages are still `noindex, follow`; this is conservative SEO behavior and can be relaxed in a follow-up once we choose which hub pages should be indexable.

## Owner action needed

- Optional: connect a custom domain before stronger SEO promotion.
- Optional: decide whether `/companies`, `/h1b`, `/perm`, and `/visa-bulletin` should become indexable hub pages.

## Recommended next milestone

M33 — Search Console submission, sitemap monitoring, and post-launch indexing/SEO cleanup.
