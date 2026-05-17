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
| `/terms`                                        | MVP usage terms draft and acceptable-use boundary   | `compliance`     | Indexable; draft pending owner/legal review               |
| `/corrections`                                  | Correction/removal request path                     | `compliance`     | Indexable                                                 |
| `/corrections/received`                         | Local correction stub confirmation page             | n/a              | Noindex; not included in sitemaps                         |
| `/sources`                                      | Official source registry and source-use policy      | `compliance`     | Indexable; draft pending owner/legal review               |
| `/methodology/lca`                              | LCA/H-1B disclosure data methodology                | `compliance`     | Indexable; draft pending owner/legal review               |
| `/methodology/perm`                             | PERM disclosure data methodology                    | `compliance`     | Indexable; draft pending owner/legal review               |
| `/methodology/wage`                             | Prevailing wage and wage-level methodology          | `compliance`     | Indexable; draft pending owner/legal review               |
| `/methodology/visa-bulletin`                    | Visa Bulletin and USCIS filing chart methodology    | `compliance`     | Indexable; draft pending owner/legal review               |
| `/methodology/employer-signal`                  | Employer public-data signal methodology             | `compliance`     | Indexable; draft pending owner/legal review               |
| `/robots.txt`                                   | Crawl policy and sitemap index pointer              | n/a              | Allows public crawl; not a sitemap URL                    |
| `/404`                                          | Not-found recovery experience                       | n/a              | Noindex                                                   |

## Public Sitemap Draft

Initial sitemap groups:

- `core`: `/`, `/about`
- `data-directory`: `/h1b`, `/perm`
- `company-pages`: first selected high-quality `/h1b/company/[slug]` and `/perm/company/[slug]` pages after M15-M17 quality and selection logic
- `tools`: after M22 this includes `/tools` and all 12 tool pages from `docs/CONTENT_GUIDE_50_TOPICS.md`. Five interactive tool routes keep their custom pages; seven remaining tool routes use the M22 shared content renderer.
- `guides`: after M22 this includes `/guides` and all 38 guide pages from `docs/CONTENT_GUIDE_50_TOPICS.md`.
- `visa-bulletin`: fixture-backed monthly pages such as `/visa-bulletin/2026/06`; the `/visa-bulletin` directory shell remains noindex until production data refresh is available
- `compliance`: `/disclaimer`, `/privacy`, `/terms`, `/corrections`, `/sources`, and the five M24 methodology pages

## Indexing Rules

- Placeholder and thin data pages are `noindex` until they include official data, source dates, useful explanations, and internal links.
- Company pages are indexable only when they meet the quality thresholds in `docs/DATA_AND_SEO_POLICY.md`.
- Dynamic company pages enter the company sitemap only when they pass route-specific quality checks and are selected within the current launch cap.
- Interactive tool query-result URLs are `noindex, follow` and canonicalize back to the base tool route.
- Public visible content must match structured data. M23 supports `BreadcrumbList`, `WebSite`, `WebPage`, `CollectionPage`, `AboutPage`, `Article`, `WebApplication`, `Dataset`, and visible `FAQPage` only.
- `robots.txt` does not block filter/query URLs because page-level `noindex` must be crawlable to work.
- M24 correction confirmation URLs such as `/corrections/received?status=received&id=...` are `noindex, follow` and never enter XML sitemaps.
- M24 legal and methodology pages are indexable so users and crawlers can inspect source/method boundaries, but all legal copy is explicitly marked as draft pending owner/legal review before production launch.

## Current Navigation

Primary navigation links:

- 首页
- H-1B
- PERM
- 工具
- 指南
- 排期
- 关于

Footer navigation also exposes method/source pages and compliance pages: 数据来源、LCA 方法、PERM 方法、工资方法、排期方法、雇主信号方法、免责声明、隐私、使用条款、纠错.
