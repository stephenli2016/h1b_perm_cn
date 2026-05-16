# Milestone M21 Report — H-1B Transfer and PERM Restart Tools

## Status

Completed

## Built

- Added `/tools/h1b-transfer-risk-checklist` as an indexable Chinese checklist tool for generic H-1B transfer scenarios.
- Added `/tools/perm-restart-timeline-estimator` as an indexable Chinese relative timeline tool for generic PERM restart planning scenarios.
- Added shared tool logic in `lib/career-decision-tools.ts` for scenario normalization, checklist sections, timeline steps, official source links, privacy notes, and related company-data links.
- Added both tools to the tools directory, route map, public route metadata, and `/sitemaps/tools.xml`.
- Added tests for generic scenario behavior, route metadata, sitemap inclusion, and page rendering without sensitive input fields.
- Added `docs/H1B_TRANSFER_AND_PERM_RESTART_TOOLS.md` documenting the privacy boundary, official sources, and SEO/internal-link rationale.

## Files changed

- `app/tools/h1b-transfer-risk-checklist/page.tsx`
- `app/tools/perm-restart-timeline-estimator/page.tsx`
- `app/tools/page.tsx`
- `lib/career-decision-tools.ts`
- `lib/site.ts`
- `tests/career-decision-tools.test.ts`
- `tests/seo.test.ts`
- `tests/site-routes.test.ts`
- `tests/ui-components.test.tsx`
- `docs/H1B_TRANSFER_AND_PERM_RESTART_TOOLS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ROUTE_MAP.md`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `docs/milestone_reports/M21_h1b_transfer_perm_restart_tools.md`

## Validation

- Command: `pnpm format:write`
- Result: pass

- Command: `pnpm lint`
- Result: pass

- Command: `pnpm typecheck`
- Result: pass

- Command: `pnpm test`
- Result: pass, 9 test files and 65 tests passed

- Command: `pnpm etl:test`
- Result: pass, 46 ETL tests passed

- Command: `pnpm etl:validate`
- Result: pass, 15 manifest sources validated

- Command: `pnpm format`
- Result: pass

- Command: `pnpm build`
- Result: pass, 29 static pages generated; both M21 tools are dynamic for query parameters

- Command: `git diff --check`
- Result: pass

- Command: `rg --pcre2 -n "sk-proj-|sk-[A-Za-z0-9]{20,}|SUPABASE_SERVICE_ROLE_KEY=(?!replace)|SUPABASE_ANON_KEY=(?!replace)|DATABASE_URL=postgresql://[^\\n]*supabase|PRIVATE KEY|PASSWORD=(?!replace)" . --hidden -g '!node_modules' -g '!.next' -g '!.git' -g '!docs/milestone_reports/**'`
- Result: pass, no secret-like values found outside historical milestone report text

- Command: browser verification with local `pnpm dev`
- Result: pass for desktop and mobile viewport checks; no console errors, no forbidden sensitive input field names, no horizontal overflow, and `/sitemaps/tools.xml` contains both new URLs

## Screenshots / local URLs

- Browser-verified `http://localhost:3000/tools/h1b-transfer-risk-checklist`
- Browser-verified `http://localhost:3000/tools/h1b-transfer-risk-checklist?scenario=cap-exempt-to-cap-subject&startTiming=not-sure&companyDataFocus=h1b`
- Browser-verified `http://localhost:3000/tools/perm-restart-timeline-estimator`
- Browser-verified `http://localhost:3000/tools/perm-restart-timeline-estimator?scenario=new-employer&stage=filed-pending&companyDataFocus=perm`
- Browser-verified `http://localhost:3000/sitemaps/tools.xml`
- Screenshots were captured during desktop and mobile browser verification.

## Decisions made without owner input

- Kept both tools as select-only educational tools so they do not collect priority dates, I-94 dates, receipt numbers, salary, employer names, or other sensitive personal details.
- Marked both tool pages as `index, follow` because they provide unique checklist/timeline value, official-source context, internal links, source notes, and disclaimers.
- Used official USCIS and DOL sources only for source links and tool framing.
- Kept `/tools` itself noindex while adding the new tool pages to `/sitemaps/tools.xml`.

## Known limitations

- The tools provide relative educational checklists and timelines only; they do not calculate real filing dates or decide individual eligibility.
- Official-source links are wired, but no live production ETL refresh or external account integration is required for this milestone.
- Browser validation used local development server rendering rather than deployed production URLs.

## Owner action needed

None.

## Recommended next milestone

M22 — Publish 50 high-value guide/tool pages
