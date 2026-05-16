# Route Map and Public Sitemap Draft

Milestone: M02 — Product information architecture and routes

This document is the first public information architecture draft for VisaRadar CN / 华人职业移民雷达. It mirrors `lib/site.ts` and should be updated whenever public route behavior changes.

## Route Map

| Route                  | Purpose                                             | Sitemap group    | Indexing plan                                            |
| ---------------------- | --------------------------------------------------- | ---------------- | -------------------------------------------------------- |
| `/`                    | Homepage explaining 查公司、查工资、查 PERM、查排期 | `core`           | Indexable                                                |
| `/h1b`                 | H-1B / LCA employer data directory shell            | `data-directory` | Noindex until official data is available                 |
| `/h1b/company/[slug]`  | H-1B company page template                          | `company-pages`  | Conditional; index only after quality thresholds are met |
| `/perm`                | PERM / green-card employer data directory shell     | `data-directory` | Noindex until official data is available                 |
| `/perm/company/[slug]` | PERM company page template                          | `company-pages`  | Conditional; index only after quality thresholds are met |
| `/tools`               | Tool directory shell                                | `tools`          | Noindex until useful tools are implemented               |
| `/guides`              | 50-guide directory shell                            | `guides`         | Noindex until useful guide content is implemented        |
| `/visa-bulletin`       | China EB Visa Bulletin shell                        | `visa-bulletin`  | Noindex until parsed official data is available          |
| `/about`               | Product purpose and data principles                 | `core`           | Indexable                                                |
| `/disclaimer`          | Legal and immigration advice boundary               | `compliance`     | Indexable                                                |
| `/privacy`             | Privacy principles and sensitive-data warning       | `compliance`     | Indexable                                                |
| `/corrections`         | Correction/removal request path                     | `compliance`     | Indexable                                                |

## Public Sitemap Draft

Initial sitemap groups:

- `core`: `/`, `/about`
- `data-directory`: `/h1b`, `/perm`
- `company-pages`: first selected high-quality `/h1b/company/[slug]` and `/perm/company/[slug]` pages after M15-M17 quality and selection logic
- `tools`: `/tools` and future implemented tool pages from `docs/CONTENT_GUIDE_50_TOPICS.md`
- `guides`: `/guides` and future implemented guide pages from `docs/CONTENT_GUIDE_50_TOPICS.md`
- `visa-bulletin`: `/visa-bulletin` and future monthly pages if official data exists
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
