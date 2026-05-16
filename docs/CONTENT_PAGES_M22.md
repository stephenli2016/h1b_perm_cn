# M22 Content Pages

Milestone: M22 — Publish 50 high-value guide/tool pages

## Implementation

M22 publishes the 50 planned pages from `docs/CONTENT_GUIDE_50_TOPICS.md` through a typed content registry:

- Content data: `lib/content/guide-pages.ts`
- Shared renderer: `components/content/content-article.tsx`
- Guide route: `/guides/[slug]`
- Tool fallback route: `/tools/[slug]`
- Tool directory: `/tools`
- Guide directory: `/guides`

The five interactive tool pages already built in M18-M21 keep their route-specific implementations:

- `/tools/h1b-wage-level-checker`
- `/tools/eb2-eb3-china-priority-date-calculator`
- `/tools/company-immigration-score`
- `/tools/h1b-transfer-risk-checklist`
- `/tools/perm-restart-timeline-estimator`

The remaining seven tool pages use the M22 shared content renderer. All 38 guide pages use the shared renderer.

## Content Contract

Every content entry includes:

- Chinese title and meta description.
- Official source context.
- Plain-Chinese summary.
- At least four checklist steps.
- One generic worked example.
- At least three common mistakes.
- At least three related internal links.
- Official source IDs mapped to official URLs.
- Review date.
- Disclaimer rendered on the page.

Priority 1 pages have stricter tests for source and checklist coverage.

## Official Source Families

The source registry uses official sources only:

- DOL OFLC Foreign Labor Certification and Performance Data.
- DOL/FLAG wage data and wage search.
- DOL/FLAG PERM.
- USCIS H-1B, Form I-129, Employer Data Hub, OPT/STEM OPT, termination options, employment-based green card, and Form I-140.
- Department of State Visa Bulletin.
- USCIS Adjustment of Status Filing Charts.

No competitor database, forum, social media, attorney blog dataset, or user-generated source is used as content input.

## Indexing and Sitemap

After M22:

- `/tools` is indexable because it lists 12 published tool pages with useful summaries.
- `/guides` is indexable because it lists 38 published guide pages by category.
- `/sitemaps/tools.xml` includes `/tools` plus all 12 tool pages.
- `/sitemaps/guides.xml` includes `/guides` plus all 38 guide pages.

The content pages are not programmatic thin pages: each page has a unique title, summary, checklist, example, mistakes, source set, and related-link set.

## Validation

`tests/content-pages.test.tsx` checks:

- Exactly 50 planned paths exist.
- There are 12 tool pages and 38 guide pages.
- Dynamic tool pages exclude the five explicit interactive tool routes.
- Every page has unique, source-backed, non-thin content fields.
- Priority 1 pages have stronger checklist/source coverage.
- Rendered pages include required sections, official source links, disclaimer, and review date.
- Dynamic guide and tool routes render representative pages.
