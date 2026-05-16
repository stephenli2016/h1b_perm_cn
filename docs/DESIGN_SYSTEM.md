# Design System — M12

Milestone: M12 — Design system and Chinese UI components

## Purpose

M12 creates reusable UI pieces for data-heavy Chinese pages. The design goal is quiet, scannable, and practical: users should be able to compare company, wage, PERM, and Visa Bulletin signals without mistaking public data for legal conclusions.

## Component Inventory

Layout and navigation:

- `SiteHeader` — desktop top navigation plus CSS-only mobile menu.
- `MobileNav` — mobile navigation using native `details` / `summary`.
- `SiteFooter` — grouped footer links.
- `PageShell` — consistent page width, title, description, optional breadcrumbs, and optional actions.
- `Breadcrumbs` — accessible breadcrumb navigation.

Data display:

- `MetricCard` — compact key metric card with optional positive or warning trend label.
- `DataTable` — responsive table wrapper with caption, column scopes, and empty-state fallback.
- `SourceNote` — source and coverage box.
- `RelatedLinks` — internal-link list for related companies, guides, tools, jobs, or locations.

States and compliance:

- `EmptyState` — no-result or missing-data block.
- `LoadingState` — polite loading state with `aria-busy`.
- `ErrorState` — user-facing error block with `role="alert"`.
- `DisclaimerBox` — reusable legal/compliance caution box.
- `DisclaimerStrip` — sitewide short/full disclaimer strip.

## Accessibility Basics

M12 adds:

- Global `focus-visible` outlines.
- Chinese navigation labels.
- Desktop and mobile navigation landmarks.
- Breadcrumb `aria-current="page"`.
- Table captions and `scope="col"`.
- Loading state `aria-busy`.
- Error state `role="alert"`.
- Keyboard-friendly link and menu focus styles.

## Mobile Layout

The header uses a CSS-only mobile menu to avoid client JavaScript at this stage. Data tables use horizontal overflow with stable minimum widths, while cards and related-link grids collapse to one column on small screens.

## Usage Notes

- Use `MetricCard` for dense numeric summaries, not long prose.
- Use `DataTable` for record-like official data and always provide a descriptive caption.
- Use `DisclaimerBox` near data interpretations or tools that could be mistaken for advice.
- Use `EmptyState` when a query returns no results; use `ErrorState` only for failed or invalid states.
- Use `RelatedLinks` to connect company pages, guides, tools, job titles, and locations without generating thin SEO pages.

## Current Integration

M12 wires representative components into:

- `/h1b`
- `/visa-bulletin`
- `/tools/h1b-wage-level-checker`
- `/tools/eb2-eb3-china-priority-date-calculator`
- `/tools/company-immigration-score`
- `/tools/h1b-transfer-risk-checklist`
- `/tools/perm-restart-timeline-estimator`
- `/visa-bulletin/[year]/[month]`

Later milestones will reuse the same components in search, company pages, tools, and guide templates.
