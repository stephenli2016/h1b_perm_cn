# Milestone M12 Report — Design system and Chinese UI components

## Status

Completed

## Built

- Added reusable Chinese UI components for breadcrumbs, metric cards, data tables, empty states, loading states, error states, disclaimer boxes, related links, and mobile navigation.
- Updated the shared page shell to support breadcrumbs and page actions.
- Improved the site header and footer with keyboard-visible focus styles, desktop/mobile navigation landmarks, and Chinese navigation labels.
- Added global focus-visible styling and a reusable `sr-only` utility.
- Reused the new components on `/h1b` and `/visa-bulletin` as representative integrations.
- Added M12 UI component tests using React static rendering.
- Added `docs/DESIGN_SYSTEM.md` documenting the component inventory, accessibility basics, mobile behavior, and usage guidance.

## Files changed

- `app/globals.css`
- `app/h1b/page.tsx`
- `app/visa-bulletin/page.tsx`
- `components/mobile-nav.tsx`
- `components/page-shell.tsx`
- `components/site-footer.tsx`
- `components/site-header.tsx`
- `components/source-note.tsx`
- `components/ui/breadcrumbs.tsx`
- `components/ui/data-table.tsx`
- `components/ui/disclaimer-box.tsx`
- `components/ui/empty-state.tsx`
- `components/ui/feedback-state.tsx`
- `components/ui/metric-card.tsx`
- `components/ui/related-links.tsx`
- `docs/DESIGN_SYSTEM.md`
- `tests/ui-components.test.tsx`
- `docs/milestone_reports/M12_design_system_chinese_ui_components.md`

## Validation

- Command: `pnpm test`
- Result: pass, 5 test files and 32 tests passed.

- Command: `pnpm etl:test`
- Result: pass, 46 ETL tests passed.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm build`
- Result: pass, Next.js production build completed and generated 13 static pages plus dynamic company/health routes.

- Command: `pnpm etl:validate`
- Result: pass, source manifest validated with 15 sources.

- Command: `curl -L http://localhost:3000/h1b`
- Result: pass, local page returned 200 and rendered mobile nav, breadcrumbs, metric cards, related links, source notes, and disclaimer copy.

- Command: `curl -L http://localhost:3000/visa-bulletin`
- Result: pass, local page returned 200 and rendered mobile nav, breadcrumbs, metric cards, accessible data table, source notes, and disclaimer copy.

- Command: `git diff --check`
- Result: pass.

- Command: secret scan with `rg --pcre2`
- Result: pass, no local secrets detected.

## Screenshots / local URLs

- Local dev URL: `http://localhost:3000`
- Checked pages:
  - `http://localhost:3000/h1b`
  - `http://localhost:3000/visa-bulletin`

## Decisions made without owner input

- Used a CSS-only mobile menu with native `details` / `summary` to avoid client JavaScript in the shared header.
- Kept the component palette restrained and data-first so it fits future search, directory, company, tool, and guide pages.
- Used horizontal overflow for dense tables on mobile instead of hiding columns.
- Used `aria-label` on `SourceNote` instead of a fixed heading id so the component remains reusable if multiple source boxes appear on one page.
- Kept `/h1b` and `/visa-bulletin` as `noindex` while they still use fixture or scaffolded data.

## Known limitations

- Lighthouse was not available in the current local tool context, so accessibility was validated through semantic component tests, focus styles, table semantics, HTML inspection, and successful local page rendering.
- The `/h1b` and `/visa-bulletin` integrations are representative examples; M13 will replace the H-1B scaffold with real search and filter UI.
- The mobile menu is intentionally simple and CSS-only; active-route highlighting can be added later when client-side navigation state is needed.

## Owner action needed

None.

## Recommended next milestone

M13 — Search and directory pages
