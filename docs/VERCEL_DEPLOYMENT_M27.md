# Vercel Deployment Preparation — M27

Milestone: M27 — Vercel deployment preparation

This milestone prepares deployment settings and checklists only. It does not
create a Vercel project, connect a production domain, change DNS, or deploy to
production.

## Official Vercel Docs Checked

- Next.js on Vercel:
  <https://vercel.com/docs/frameworks/full-stack/nextjs>
- Project configuration:
  <https://vercel.com/docs/project-configuration>
- `vercel.json` static configuration:
  <https://vercel.com/docs/project-configuration/vercel-json>
- Environment variables:
  <https://vercel.com/docs/environment-variables>
- Domains and DNS setup:
  <https://vercel.com/docs/domains/working-with-domains/add-a-domain>

## Repository Configuration

`vercel.json` is intentionally small:

- `framework`: `nextjs`
- `installCommand`: `pnpm install --frozen-lockfile`
- `buildCommand`: `pnpm build`
- baseline response headers:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: SAMEORIGIN`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- short CDN caching for sitemap and robots outputs

No environment variables or secrets are stored in `vercel.json`. Vercel's docs
recommend defining project environment variables in Project Settings instead of
using `env` / `build.env` in `vercel.json`.

## Environment Variable Checklist

Configure these in Vercel Project Settings by environment.

Required for all environments:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_CONTACT_EMAIL`
- `LOCAL_DATA_MODE`
- `PRELAUNCH_NOINDEX`

Required later when production database reads are enabled:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional analytics, webmaster, and monitoring variables:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
- `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_BING_SITE_VERIFICATION`
- `NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT`
- `NEXT_PUBLIC_ERROR_MONITORING_ENVIRONMENT`
- `NEXT_PUBLIC_RELEASE_SHA`

Suggested environment values before public launch:

| Variable                    | Preview                           | Production private test   | Production public launch      |
| --------------------------- | --------------------------------- | ------------------------- | ----------------------------- |
| `NEXT_PUBLIC_SITE_URL`      | Vercel preview URL or staging URL | Production URL            | Production URL                |
| `LOCAL_DATA_MODE`           | `fixture`                         | `fixture` until DB import | `fixture` until DB import     |
| `PRELAUNCH_NOINDEX`         | `true`                            | `true`                    | `false` after launch approval |
| `SUPABASE_SERVICE_ROLE_KEY` | unset unless needed               | server-side secret only   | server-side secret only       |

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_` variable.

## Prelaunch Noindex Mode

Set:

```bash
PRELAUNCH_NOINDEX=true
```

Effects:

- all generated metadata uses `noindex,nofollow`
- `/robots.txt` disallows all crawlers
- sitemap indexes and sitemap files emit no URLs

Use this for Preview deployments and any private production test before the
owner approves public indexing. Set it back to `false` only during the M28
production launch gate.

## Deployment Checklist

Before importing the GitHub repo into Vercel:

1. Confirm `main` is pushed to GitHub.
2. Confirm `pnpm build` passes locally.
3. Confirm `pnpm deploy:validate` passes.
4. In Vercel, import `stephenli2016/h1b_perm_cn`.
5. Keep Framework Preset as Next.js.
6. Keep Root Directory as repository root.
7. Use Install Command `pnpm install --frozen-lockfile`.
8. Use Build Command `pnpm build`.
9. Leave Output Directory as Vercel/Next.js default.
10. Add environment variables in Project Settings, not in `vercel.json`.
11. Keep `PRELAUNCH_NOINDEX=true` until the M28 launch gate passes.
12. Review the first Preview URL for layout, legal pages, robots, and sitemap
    behavior.

Do not run `vercel --prod`, promote a Preview deployment, connect a custom
domain, or change DNS without explicit owner approval.

## Domain And DNS Checklist

Owner approval is required before any production domain or DNS action.

When approved:

1. Add the intended domain in Vercel Project Settings.
2. For an apex domain such as `example.com`, follow Vercel's displayed A record
   instructions.
3. For a subdomain such as `www.example.com`, follow Vercel's displayed CNAME
   instructions.
4. If switching nameservers to Vercel, copy any existing DNS records that must
   remain active before changing nameservers.
5. If Vercel requires TXT verification, add only the shown TXT record and wait
   for verification.
6. Confirm HTTPS is active.
7. Confirm canonical URLs use the final domain through `NEXT_PUBLIC_SITE_URL`.
8. Confirm redirects between apex and `www` are intentional.
9. Keep `PRELAUNCH_NOINDEX=true` until M28 explicitly clears public indexing.

## Production Readiness Notes For M28

M27 leaves these launch decisions intentionally gated:

- production deployment/promotion
- custom domain connection
- DNS record changes
- Search Console/Bing verification tokens
- changing `PRELAUNCH_NOINDEX` to `false`
- legal/compliance approval for public launch

The next milestone should run a full production readiness checklist before any
public indexing or DNS change.
