# Milestone M24 Report — Legal Compliance and Correction Workflow

## Status

Completed.

## Built

- Added draft legal/compliance pages for `/terms`, expanded `/disclaimer`, `/privacy`, and `/corrections`.
- Added `/sources` with official-source registry and visible source-use boundaries.
- Added five methodology pages:
  - `/methodology/lca`
  - `/methodology/perm`
  - `/methodology/wage`
  - `/methodology/visa-bulletin`
  - `/methodology/employer-signal`
- Added a local correction request stub:
  - `/corrections/request` validates form submissions and redirects with a public stub ID.
  - `/corrections/received` is `noindex, follow` and does not echo submitted descriptions, page URLs, source URLs, or email.
- Added footer links for source/methodology and compliance pages.
- Added M24 tests for legal draft notices, source domains, methodology rendering, no-secret form fields, and stub redirect behavior.

## Files changed

- `app/corrections/page.tsx`
- `app/corrections/request/route.ts`
- `app/corrections/received/page.tsx`
- `app/disclaimer/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/sources/page.tsx`
- `app/methodology/*/page.tsx`
- `app/methodology/methodology-route.tsx`
- `components/compliance/*`
- `components/site-footer.tsx`
- `lib/compliance/content.ts`
- `lib/seo/metadata.ts`
- `lib/site.ts`
- `tests/compliance-pages.test.tsx`
- `tests/seo.test.ts`
- `tests/site-routes.test.ts`
- `docs/LEGAL_COMPLIANCE_M24.md`
- `docs/ROUTE_MAP.md`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/SCHEMA.md`

## Validation

- Command: `pnpm lint`
  - Result: pass
- Command: `pnpm typecheck`
  - Result: pass
- Command: `pnpm test`
  - Result: pass, 13 test files / 95 tests
- Command: `pnpm etl:test`
  - Result: pass, 46 ETL tests
- Command: `pnpm etl:validate`
  - Result: pass, 15 manifest sources
- Command: `pnpm format:write`
  - Result: pass, formatted new/changed files
- Command: `pnpm format`
  - Result: pass
- Command: `pnpm build`
  - Result: pass, 84 static/dynamic app routes generated
- Command: `curl -L ... /terms`, `/sources`, `/methodology/lca`, `/corrections`
  - Result: pass, all returned HTTP 200
- Command: `curl -L -X POST ... /corrections/request`
  - Result: pass, redirected to `/corrections/received?status=received&type=data-error&id=VR-COR-...`
- Command: `git diff --check`
  - Result: pass
- Command: secret scan with `rg --pcre2`
  - Result: pass, no matches

## Screenshots / local URLs

- Local dev URL during QA: `http://localhost:3000`
- Checked URLs:
  - `http://localhost:3000/terms`
  - `http://localhost:3000/sources`
  - `http://localhost:3000/methodology/lca`
  - `http://localhost:3000/corrections`
  - `http://localhost:3000/corrections/received?status=received&type=data-error&id=VR-COR-...`
- Screenshots: not captured. The in-app browser plugin connected, but this environment blocked access from that browser surface to the local dev server; local HTTP checks were used as the fallback runtime validation.

## Decisions made without owner input

- Used a shared `lib/compliance/content.ts` registry for official sources, methodology pages, correction request types, and draft notices.
- Marked all legal/compliance pages as drafts requiring owner/legal review before production launch.
- Kept the correction form as a local stub with no email, database write, or secret dependency.
- Kept `/corrections/received` out of `publicRoutes` and XML sitemaps, with `noindex, follow` metadata.
- Included legal/source/methodology pages in the compliance/core sitemap group so users and crawlers can inspect source and method boundaries.

## Known limitations

- Legal, privacy, and terms copy is not final legal advice and must be reviewed before production launch.
- Correction requests are not persisted yet and do not notify anyone.
- Production correction workflow still needs retention policy, access control, review queue, and email or database integration.
- Browser visual QA could not be completed in the in-app browser because the local dev server was unreachable from that browser surface; build, tests, and local HTTP route checks passed.

## Owner action needed

- Before production launch: review and approve legal/privacy/terms/correction copy with qualified legal counsel.
- No owner action is required to continue local development milestones.

## Recommended next milestone

M25 — Analytics, monitoring, and webmaster setup.
