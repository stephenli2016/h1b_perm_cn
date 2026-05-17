# Employer Canonicalization and Company Selection — M10

Milestone: M10 — Employer canonicalization and top-company selection

## Goal

Company pages must be built from reliable employer entities, not raw employer-name strings. M10 creates a deterministic first pass that can work with local fixtures now and larger official datasets later.

The pipeline never uses competitor, forum, social, or law-firm data. It only consumes normalized records derived from approved official-source families:

- DOL OFLC LCA / H-1B disclosure data.
- DOL OFLC PERM disclosure data.
- USCIS H-1B Employer Data Hub records.

## Commands

Generate candidate company-page data from existing normalized fixture JSONL:

```bash
pnpm etl:lca:fixtures
pnpm etl:perm:fixtures
pnpm etl:uscis:h1b:fixtures
pnpm etl:companies:fixtures
```

`pnpm etl:companies:fixtures` writes ignored local outputs:

- `data/normalized/employers.jsonl`
- `data/normalized/employer_aliases.jsonl`
- `data/normalized/company_page_candidates.jsonl`

## Normalization Rules

Employer normalization is deterministic:

- Convert to lowercase.
- Normalize ASCII accents.
- Replace `&` with `and`.
- Remove common legal suffixes such as `LLC`, `L.L.C.`, `Inc`, `Corp`, `Corporation`, `Company`, `Ltd`, `LLP`, `LP`, `PC`, and related variants.
- Remove punctuation and extra whitespace.
- Preserve the original raw employer name in alias output.

Examples:

| Raw name                      | Normalized name           |
| ----------------------------- | ------------------------- |
| `ACME ANALYTICS, LLC`         | `acme analytics`          |
| `The Acme Analytics, L.L.C.`  | `acme analytics`          |
| `AT&T Services Incorporated`  | `at and t services`       |
| `Acme Analytics Holdings LLC` | `acme analytics holdings` |

## Matching Rules

M10 uses only high-confidence matching:

1. Manual seed exact match, if a raw name exactly normalizes to a seed alias.
2. Exact normalized-name match across official source records.
3. No fuzzy matching or substring matching.

Low-confidence similarity is not automatically merged. For example, `Acme Analytics LLC` and `Acme Analytics Holdings LLC` remain separate unless a future manual review explicitly maps them.

## Manual Alias Seeds

Manual seeds live in:

- `data/manual/employer_alias_seeds.json`

Seeds are exact-match aids only. They do not create public company pages by themselves and do not add company data. A seeded employer appears only when an official source record contains a matching raw employer name.

The seed file is intentionally conservative: it covers high-volume company
groups, known renamed/acquired brands, subsidiaries, and common official-record
spelling variants only when the raw name normalizes to an exact seed alias.
Examples include Google/Alphabet, Meta/Facebook/WhatsApp, Microsoft/LinkedIn,
Tata Consultancy Services/TCS variants, large IT consultancies, major banks, and
high-volume technology platforms. Similar-looking names are not merged unless
listed exactly; for example, `Tata Technologies` and `Amdocs` remain separate
from `Tata Consultancy Services` and `AMD`.

Each alias output includes:

- raw name
- normalized name
- source system
- confidence score
- review status
- match method
- source record count

## Confidence Scores

Current confidence policy:

| Match method      | Score  | Review status |
| ----------------- | ------ | ------------- |
| Manual seed exact | `1.0`  | `manual`      |
| Exact normalized  | `0.96` | `auto`        |

Future fuzzy or parent/subsidiary suggestions, if added, must use `needs_review` and must not merge automatically.

## Company Quality Score

The candidate score is a ranking signal, not a legal conclusion and not a success-rate metric.

Formula:

- LCA volume: `min(recent_lca_count * 2, 80)`
- PERM volume: `min(recent_perm_count * 8, 80)`
- USCIS Employer Hub rows: `min(recent_uscis_row_count * 5, 25)`
- Job-title diversity: `min(distinct_job_titles * 3, 30)`
- Location diversity: `min(distinct_locations * 2, 20)`
- Chinese-user relevance signals from official data:
  - `+10` if recent PERM data exists.
  - `+8` if both recent LCA and PERM data exist.
  - `+1` per professional SOC record, capped at `20`.

Professional SOC prefixes used for this bonus:

- `11`, `13`, `15`, `17`, `19`, `23`, `27`, `29`

## Indexability Helper

M10 implements a data-readiness decision only. Later SEO milestones still need page-content quality checks, sitemap logic, and final launch review.

A company is data-ready for possible indexation only if it has at least one of:

- `10` or more LCA records in the recent 5-fiscal-year window.
- `3` or more PERM records in the recent 5-fiscal-year window.
- `3` or more USCIS Employer Data Hub rows in the recent 5-fiscal-year window.

It must also have at least one job title and one location.

Companies below these thresholds remain accessible for internal testing and future search, but public pages should stay `noindex`.

## Fixture Result

With current local normalized fixtures, the M10 ETL command generates:

- 3 employer candidates.
- 8 auditable aliases.
- 0 indexable companies because fixture sample sizes are intentionally small.

This is expected. The fixture data validates the selection logic without pretending synthetic samples are launch-ready.
