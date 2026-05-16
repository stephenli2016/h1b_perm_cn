# Milestone M18 Report — H-1B Wage-Level Checker Tool

## Status

Completed

## Built

- Implemented `/tools/h1b-wage-level-checker` as an indexable Chinese tool page.
- Added a GET form for SOC/job title, city/state, offered wage, wage unit, and wage year.
- Added fixture-backed wage-level comparison through `checkH1BWageLevel`.
- Added SOC resolution from direct SOC code, PWD SOC title, or H-1B LCA job/SOC title.
- Reused official-source PWD lookup order: exact city, metro area, then statewide fallback.
- Added Year/Hour conversion with an explicit 2,080-hour caveat when needed.
- Added related same-SOC H-1B company, job-title, and location context.
- Added cautious Chinese output, source notes, official-source links, common mistakes, related links, and disclaimer.
- Added `/tools/h1b-wage-level-checker` to route metadata and `/sitemaps/tools.xml`.
- Added M18 docs for the tool behavior and updated route, sitemap, public query API, and design docs.

## Files changed

- `app/tools/h1b-wage-level-checker/page.tsx`
- `app/tools/page.tsx`
- `components/ui/metric-card.tsx`
- `docs/DESIGN_SYSTEM.md`
- `docs/H1B_WAGE_LEVEL_CHECKER.md`
- `docs/PUBLIC_QUERY_API.md`
- `docs/ROUTE_MAP.md`
- `docs/SEO_INDEXABILITY_AND_SITEMAPS.md`
- `lib/db/public-query-repository.ts`
- `lib/site.ts`
- `lib/wage-level-tool.ts`
- `tests/public-query-repository.test.ts`
- `tests/seo.test.ts`
- `tests/site-routes.test.ts`

## Validation

- Command: `pnpm test`
- Result: pass, 7 files / 54 tests.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm etl:test`
- Result: pass, 46 Python ETL tests.

- Command: `pnpm etl:validate`
- Result: pass, source manifest version 1 with 15 sources.

- Command: `pnpm build`
- Result: pass, 22 static pages generated; `/tools/h1b-wage-level-checker` is dynamic for query parameters.

- Command: `git diff --check`
- Result: pass.

- Command: secret scan with `rg --pcre2` for OpenAI/Supabase/database secret patterns
- Result: pass, no matches. `rg` returned exit code 1 because there were no findings.

## Screenshots / local URLs

- `http://localhost:3000/tools/h1b-wage-level-checker` — HTTP 200; default example renders `介于 Level 2 和 Level 3`, source notes, canonical URL, and `index, follow`.
- `http://localhost:3000/tools/h1b-wage-level-checker?socOrJobTitle=Software+Engineer&city=Bellevue&state=WA&offeredWage=90000&wageUnit=Year&wageYear=2025` — HTTP 200; form submission renders `查询结果`, resolves `15-1252`, and shows `Metro area 匹配`.
- `http://localhost:3000/sitemaps/tools.xml` — HTTP 200; includes `/tools/h1b-wage-level-checker`.
- Browser verification captured desktop and 390px mobile screenshots in the Codex in-app browser; both had no page-level horizontal overflow.
- The local dev server required sandbox escalation to bind port 3000 and was stopped after verification.

## Decisions made without owner input

- Kept `/tools` itself `noindex` while making the implemented wage-level tool page indexable.
- Used the existing local fixture wage year `2025` for the default example.
- Treated job-title matching as a best-effort SOC resolution helper, with direct SOC code preferred.
- Used 2,080 hours/year for Year/Hour conversion and displayed that caveat.
- Kept related H-1B samples as background context only, not as employer recommendations.

## Known limitations

- Production-scale official wage data is not connected yet; the page uses local official-source fixtures.
- SOC resolution from job title is intentionally conservative and may require users to enter a precise SOC code.
- The tool does not collect user data, save queries, send alerts, or provide legal advice.
- Related H-1B company/job/location context is limited by fixture size until real data ingestion is connected.

## Owner action needed

None.

## Recommended next milestone

M19 — EB-2/EB-3 China priority date calculator
