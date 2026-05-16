# Milestone M02 Report — Product Information Architecture and Routes

## Status

Completed

## Built

- Added shared site information architecture in `lib/site.ts`:
  - public route map
  - primary Chinese navigation items
  - footer navigation groups
  - sitemap grouping and indexing plan
  - official source names for page source notes
- Added shared shell components:
  - top navigation
  - footer
  - sitewide disclaimer strip
  - reusable page shell
  - route cards
  - source note box
- Implemented all M02 route shells:
  - `/`
  - `/h1b`
  - `/h1b/company/[slug]`
  - `/perm`
  - `/perm/company/[slug]`
  - `/tools`
  - `/guides`
  - `/visa-bulletin`
  - `/about`
  - `/disclaimer`
  - `/privacy`
  - `/corrections`
- Added placeholder SEO metadata and canonicals.
- Marked data-dependent placeholder pages as `noindex` or conditional until official data and quality thresholds exist.
- Added `docs/ROUTE_MAP.md` with route map, sitemap draft, navigation outline, and indexing rules.
- Added tests for route-map coverage, navigation labels, dynamic company indexability, and data-page flags.

## Files changed

- `app/about/page.tsx`
- `app/corrections/page.tsx`
- `app/disclaimer/page.tsx`
- `app/globals.css`
- `app/guides/page.tsx`
- `app/h1b/company/[slug]/page.tsx`
- `app/h1b/page.tsx`
- `app/layout.tsx`
- `app/page.tsx`
- `app/perm/company/[slug]/page.tsx`
- `app/perm/page.tsx`
- `app/privacy/page.tsx`
- `app/tools/page.tsx`
- `app/visa-bulletin/page.tsx`
- `components/disclaimer-strip.tsx`
- `components/page-shell.tsx`
- `components/route-card.tsx`
- `components/site-footer.tsx`
- `components/site-header.tsx`
- `components/source-note.tsx`
- `docs/ROUTE_MAP.md`
- `docs/milestone_reports/M02_information_architecture_routes.md`
- `lib/site.ts`
- `tests/site-routes.test.ts`

## Validation

- Command: `pnpm format`
- Result: pass. All matched files use Prettier code style.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm test`
- Result: pass. 2 test files, 6 tests passed.

- Command: `pnpm build`
- Result: pass. Build rendered the required static routes and dynamic company templates.

- Command: browser smoke test at `http://127.0.0.1:3001`
- Result: pass. Verified all 12 public route shells rendered expected headings, Chinese navigation, and the sitewide disclaimer.

- Command: `rg "一定|成功率|保证|一定可以|一定给" app components lib docs/ROUTE_MAP.md tests`
- Result: pass after review. Matches were only negated/compliance wording such as `不保证`, `不称为个案成功率`, and `不会承诺`.

## Screenshots / local URLs

- Local smoke-test URL used: `http://127.0.0.1:3001`
- Port `3000` was already occupied, so M02 verification used `3001`.
- Verified routes:
  - `/`
  - `/h1b`
  - `/h1b/company/example-employer`
  - `/perm`
  - `/perm/company/example-employer`
  - `/tools`
  - `/guides`
  - `/visa-bulletin`
  - `/about`
  - `/disclaimer`
  - `/privacy`
  - `/corrections`

## Decisions made without owner input

- Kept the design restrained and utilitarian because this is a data and decision-support product.
- Used sitewide disclaimer strip so data/tool pages inherit the required caution text.
- Set placeholder data directories and tool/guide shells to `noindex` until they contain useful official data or substantive content.
- Set dynamic company page templates to conditional/noindex until M10/M15 quality thresholds decide which company pages are indexable.
- Avoided linking to not-yet-implemented individual guide/tool URLs from cards to prevent unnecessary dead-end navigation.

## Known limitations

- Shell routes do not yet contain real official data, search, filters, tables, or calculators.
- `/tools` and `/guides` are directory shells only; individual tool/guide pages are scheduled for later milestones.
- Dynamic company pages render template placeholders for any slug but are intentionally noindex until real data and quality scoring exist.
- Legal/privacy copy is cautious MVP placeholder language and should still receive owner/legal review before production launch.
- The temporary dev server was stopped after browser verification.

## Owner action needed

None.

## Recommended next milestone

M03 — Database schema and local data model.
