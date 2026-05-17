# Vercel Supabase Preview — M32

## Goal

M32 connects the existing Vercel project to the Supabase aggregate database for a
private preview while keeping public launch gated.

Target Vercel project:

- Team: `team_Oson62bGqFKyAmhvdipDQptX`
- Project: `h1b-perm-cn`
- Project ID: `prj_LOxCRuMFtt0oCcN7IaBFQWcNxkzR`

## Current Vercel State

The latest deployment from `main` failed because Vercel is building with
database mode enabled but `DATABASE_URL` is not configured in Project Settings:

```text
Error: DATABASE_URL is required when LOCAL_DATA_MODE uses the production database.
```

This is a configuration problem, not a local build problem. Local validation
passes with the Supabase Session Pooler URL.

M32 also hardens the build path so database-backed data pages render at request
time in `LOCAL_DATA_MODE=postgres`. A branch Preview can now complete its build
without a build-time database connection, but runtime data pages still require
`DATABASE_URL` before the Preview can be treated as Supabase-backed.

## Required Preview Environment Variables

Set these in Vercel Project Settings for Preview before deploying the private
Supabase-backed preview:

```text
LOCAL_DATA_MODE=postgres
DATABASE_POOL_MAX=1
DATABASE_URL=<Supabase Session Pooler Postgres connection string>
PRELAUNCH_NOINDEX=true
PREVIEW_PROTECTION_ENABLED=true
PREVIEW_PROTECTION_USERNAME=preview
PREVIEW_PROTECTION_PASSWORD=<strong random password>
PRERENDER_COMPANY_PAGES=false
PRERENDER_RUNTIME_DATA_PAGES=false
NEXT_PUBLIC_SITE_URL=<preview deployment URL after deploy>
NEXT_PUBLIC_CONTACT_EMAIL=<owner contact email>
```

`DATABASE_URL` and `PREVIEW_PROTECTION_PASSWORD` must be encrypted/server-side
environment variables. Do not prefix them with `NEXT_PUBLIC_`, and do not commit
them.

For this Supabase project, use the Session Pooler host
`aws-1-us-east-1.pooler.supabase.com` and username format
`postgres.<project-ref>`.

## Optional Production-Test Environment Variables

Only after the owner explicitly approves a private production test, set the same
values for Production but keep:

```text
PRELAUNCH_NOINDEX=true
PREVIEW_PROTECTION_ENABLED=true
```

Do not promote a Preview deployment, connect a custom domain, change DNS, or set
`PRELAUNCH_NOINDEX=false` until the production launch gate is rerun and approved.

## Preview Protection

The app now includes an optional Basic Auth `proxy.ts` gate controlled by:

- `PREVIEW_PROTECTION_ENABLED`
- `PREVIEW_PROTECTION_USERNAME`
- `PREVIEW_PROTECTION_PASSWORD`
- `PREVIEW_PROTECTION_REALM`

When enabled and no password is configured, access is denied by default. This is
intentional: a misconfigured private preview should fail closed, not become
public.

Vercel's built-in Deployment Protection can also be used. The app-level gate is
kept as a second safety layer because it is versioned with the repository and can
be validated locally.

## Validation Commands

Before deploying:

```bash
pnpm deploy:preview:validate
pnpm db:runtime:smoke --require-postgres
pnpm build
```

After deploying, verify:

```text
/health
/robots.txt
/h1b/company/<known-company-slug>
/perm/company/<known-company-slug>
/sitemaps/company-pages.xml
```

Expected private-preview behavior:

- unauthenticated page requests return `401`;
- authenticated page requests render from Supabase aggregate data;
- `/health` reports `dataMode: postgres` and `databaseConfigured: true`;
- `/robots.txt` disallows all crawlers while `PRELAUNCH_NOINDEX=true`;
- sitemap endpoints emit no public URLs while `PRELAUNCH_NOINDEX=true`.

Company pages should stay dynamically rendered in Supabase-backed Vercel builds.
Keep `PRERENDER_COMPANY_PAGES=false`; otherwise the build tries to pre-render
thousands of company routes and can time out.

Database-backed directory, tool, and Visa Bulletin pages also defer their data
load to request time in `LOCAL_DATA_MODE=postgres`, so Vercel builds are not
blocked by build-time database connectivity. Keep
`PRERENDER_RUNTIME_DATA_PAGES=false` for Preview and Production unless a later
milestone deliberately adds build-time database access.

## Current Blocker

The available Vercel connector can list projects, inspect deployments, fetch
build logs, deploy, and fetch protected URLs. It does not expose a write tool for
Project Settings environment variables.

Smallest owner action if no Vercel env-write token is available: add the Preview
environment variables listed above in the Vercel dashboard, then trigger a new
Preview deployment.
