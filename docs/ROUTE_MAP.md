# Route Map and Public Sitemap Draft

Milestone: M02 — Product information architecture and routes

This document is the first public information architecture draft for VisaRadar CN / 华人职业移民雷达. It mirrors `lib/site.ts` and should be updated whenever public route behavior changes.

## Route Map

| Route                                           | Purpose                                             | Sitemap group    | Indexing plan                                             |
| ----------------------------------------------- | --------------------------------------------------- | ---------------- | --------------------------------------------------------- |
| `/`                                             | Homepage explaining 查公司、查工资、查 PERM、查排期 | `core`           | Indexable                                                 |
| `/h1b`                                          | H-1B / LCA employer data directory shell            | `data-directory` | Noindex until official data is available                  |
| `/h1b/company/[slug]`                           | H-1B company page template                          | `company-pages`  | Conditional; index only after quality thresholds are met  |
| `/perm`                                         | PERM / green-card employer data directory shell     | `data-directory` | Noindex until official data is available                  |
| `/perm/company/[slug]`                          | PERM company page template                          | `company-pages`  | Conditional; index only after quality thresholds are met  |
| `/tools`                                        | 12-page tool directory                              | `tools`          | Indexable after M22                                       |
| `/tools/[slug]`                                 | M22 content tool fallback pages                     | `tools`          | Indexable for registered M22 tool slugs                   |
| `/tools/h1b-wage-level-checker`                 | H-1B wage-level comparison tool                     | `tools`          | Indexable after M18                                       |
| `/tools/eb2-eb3-china-priority-date-calculator` | China EB priority date calculator                   | `tools`          | Indexable after M19                                       |
| `/tools/company-immigration-score`              | Company public-data signal methodology              | `tools`          | Indexable after M20                                       |
| `/tools/h1b-transfer-risk-checklist`            | H-1B transfer checklist tool                        | `tools`          | Indexable after M21                                       |
| `/tools/perm-restart-timeline-estimator`        | PERM restart relative timeline tool                 | `tools`          | Indexable after M21                                       |
| `/guides`                                       | 38-page guide directory                             | `guides`         | Indexable after M22                                       |
| `/guides/[slug]`                                | M22 content guide pages                             | `guides`         | Indexable for registered M22 guide slugs                  |
| `/visa-bulletin`                                | China EB Visa Bulletin shell                        | `visa-bulletin`  | Noindex shell until production refresh is available       |
| `/visa-bulletin/[year]/[month]`                 | Month-specific China EB Visa Bulletin page          | `visa-bulletin`  | Conditional; index only when fixture/official data exists |
| `/about`                                        | Product purpose and data principles                 | `core`           | Indexable                                                 |
| `/disclaimer`                                   | Legal and immigration advice boundary               | `compliance`     | Indexable                                                 |
| `/privacy`                                      | Privacy principles and sensitive-data warning       | `compliance`     | Indexable                                                 |
| `/corrections`                                  | Correction/removal request path                     | `compliance`     | Indexable                                                 |

## Public Sitemap Draft

Initial sitemap groups:

- `core`: `/`, `/about`
- `data-directory`: `/h1b`, `/perm`
- `company-pages`: first selected high-quality `/h1b/company/[slug]` and `/perm/company/[slug]` pages after M15-M17 quality and selection logic
- `tools`: after M22 this includes `/tools` and all 12 tool pages from `docs/CONTENT_GUIDE_50_TOPICS.md`. Five interactive tool routes keep their custom pages; seven remaining tool routes use the M22 shared content renderer.
- `guides`: after M22 this includes `/guides` and all 38 guide pages from `docs/CONTENT_GUIDE_50_TOPICS.md`.
- `visa-bulletin`: fixture-backed monthly pages such as `/visa-bulletin/2026/06`; the `/visa-bulletin` directory shell remains noindex until production data refresh is available
- `compliance`: `/disclaimer`, `/privacy`, `/corrections`

## Indexing Rules

- Placeholder and thin data pages are `noindex` until they include official data, source dates, useful explanations, and internal links.
- Company pages are indexable only when they meet the quality thresholds in `docs/DATA_AND_SEO_POLICY.md`.
- Dynamic company pages enter the company sitemap only when they pass route-specific quality checks and are selected within the current launch cap.
- Public visible content must match any future structured data.

## Current Navigation

Primary navigation links:

- 首页
- H-1B
- PERM
- 工具
- 指南
- 排期
- 关于

Footer navigation also exposes compliance pages: 免责声明、隐私、纠错.
