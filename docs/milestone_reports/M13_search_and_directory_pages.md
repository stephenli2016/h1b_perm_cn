# Milestone M13 Report — Search and directory pages

## Status

Completed

## Built

- Implemented fixture-backed `/h1b` search with filters for employer, fiscal year, state, city, job/SOC, case status, and pagination.
- Implemented fixture-backed `/perm` search with the same filter and pagination pattern.
- Added `/companies` as a combined company directory aggregating H-1B LCA and PERM signals by employer.
- Added reusable directory filter, pagination, and interpretation-panel components.
- Extended the public query repository with typed `searchH1BRecords`, `searchPermRecords`, and `searchCompanyDirectory` methods.
- Added friendly validation errors for invalid states, statuses, fiscal years, pages, and overlong text filters.
- Added empty/no-result states and Chinese “how to interpret this data” boxes.
- Kept all directory and filtered URLs `noindex, follow` with canonical URLs pointing to the base directory route.
- Documented directory search behavior in `docs/SEARCH_DIRECTORY.md` and updated `docs/PUBLIC_QUERY_API.md`.

## Files changed

- `app/h1b/page.tsx`
- `app/perm/page.tsx`
- `app/companies/page.tsx`
- `components/search/directory-filter-form.tsx`
- `components/search/interpretation-panel.tsx`
- `components/search/pagination.tsx`
- `lib/db/public-query-repository.ts`
- `lib/directory-search.ts`
- `lib/site.ts`
- `docs/PUBLIC_QUERY_API.md`
- `docs/SEARCH_DIRECTORY.md`
- `tests/public-query-repository.test.ts`
- `tests/site-routes.test.ts`
- `tests/ui-components.test.tsx`
- `docs/milestone_reports/M13_search_and_directory_pages.md`

## Validation

- Command: `pnpm test`
- Result: pass, 5 test files and 37 tests passed.

- Command: `pnpm etl:test`
- Result: pass, 46 ETL tests passed.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm build`
- Result: pass, Next.js production build completed with 14 app routes; `/h1b`, `/perm`, and `/companies` render dynamically because they read search params.

- Command: `pnpm etl:validate`
- Result: pass, source manifest validated with 15 sources.

- Command: `curl -L http://localhost:3000/h1b?page=2`
- Result: pass, returned 200; rendered H-1B results, pagination, `noindex, follow`, and interpretation copy.

- Command: `curl -L 'http://localhost:3000/perm?caseStatus=Certified&jobOrSoc=17-2141'`
- Result: pass, returned 200; rendered filtered PERM result and interpretation copy.

- Command: `curl -L 'http://localhost:3000/companies?employer=cloud&jobOrSoc=15-1252'`
- Result: pass, returned 200; rendered combined Northstar Cloud result and `noindex, follow`.

- Command: `curl -L 'http://localhost:3000/h1b?employer=zzzz'`
- Result: pass, returned 200; rendered clear no-result state.

- Command: `curl -L 'http://localhost:3000/h1b?state=ZZZ'`
- Result: pass, returned 200; rendered friendly validation error.

- Command: `git diff --check`
- Result: pass.

- Command: secret scan with `rg --pcre2`
- Result: pass, no local secrets detected.

## Screenshots / local URLs

- Local dev URL: `http://localhost:3000`
- Checked pages:
  - `http://localhost:3000/h1b?page=2`
  - `http://localhost:3000/perm?caseStatus=Certified&jobOrSoc=17-2141`
  - `http://localhost:3000/companies?employer=cloud&jobOrSoc=15-1252`
  - `http://localhost:3000/h1b?employer=zzzz`
  - `http://localhost:3000/h1b?state=ZZZ`

## Decisions made without owner input

- Added `/companies` as a non-primary-nav combined directory because it is useful for users who do not yet know whether they care more about H-1B or PERM data.
- Kept `/companies` linked through the route map/footer data group but out of the compact primary nav.
- Used GET forms and server-rendered search params so filtered URLs are shareable and testable without client JavaScript.
- Used a small fixture-friendly page size so local data demonstrates pagination.
- Kept all directory/filter pages `noindex` until production data volume and quality thresholds are implemented in later milestones.
- Displayed wages as `USD <amount>/年` to avoid ambiguity in server-rendered output.

## Known limitations

- Searches currently run against small local fixture arrays, not production-scale SQL.
- Pagination is fixture-friendly; production pages will likely use a larger page size and database-backed offset/keyset pagination.
- `/h1b/company/[slug]` and `/perm/company/[slug]` are still placeholder templates until M14.
- Browser/Lighthouse tooling was not available in the current tool context; local rendering was verified with dev server HTML checks using `curl` and `rg`.

## Owner action needed

None.

## Recommended next milestone

M14 — Company page template v1
