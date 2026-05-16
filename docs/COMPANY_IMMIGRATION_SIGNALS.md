# Company Immigration Public-Data Signals — M20

Routes:

- Company pages: `/h1b/company/[slug]`, `/perm/company/[slug]`
- Methodology page: `/tools/company-immigration-score`

## Purpose

M20 adds a cautious company-level signal called **公开数据友好度信号**.

It is designed to help Chinese-speaking job seekers understand how much official public data exists for an employer and how interpretable that data is. It is not a success score, approval odds metric, sponsor promise, or legal conclusion.

## Inputs

The signal uses official-source fixture families already available to company pages:

- DOL OFLC H-1B/LCA disclosure records.
- DOL OFLC PERM disclosure records.
- USCIS H-1B Employer Data Hub rows.
- DOL/FLAG prevailing wage fixture rows for wage-context matching.
- Employer alias mappings and source metadata for auditability.

## Dimensions

The helper lives in `lib/company-immigration-signals.ts`.

Dimensions:

1. `recent_lca_activity` — recent H-1B/LCA activity and certified LCA presence.
2. `perm_activity` — recent PERM disclosure activity and certified PERM presence.
3. `repeat_filing_history` — fiscal-year coverage and whether H-1B/PERM both appear.
4. `data_consistency` — source count, latest data date, and alias review confidence.
5. `job_location_diversity` — visible job, SOC, and location breadth.
6. `wage_context` — H-1B wage samples and whether PWD fixture context can be matched.

Each dimension returns:

- `score`
- `maxScore`
- `level`
- `evidenceZh`
- `explanationZh`

The company page renders all dimensions so the composite number is explainable instead of opaque.

## Low Sample Handling

If the last five fiscal years contain fewer than 3 H-1B/PERM public records, or fewer than 3 total related public records including USCIS Employer Hub rows, the signal is marked low-sample.

Low-sample pages show:

- A visible warning.
- A capped composite score.
- A label of `低样本，仅供背景参考`.

Low sample does not mean an employer is bad. It only means the public data is too sparse for a stronger public-data signal.

## Public Copy Rules

Allowed:

- “公开数据友好度信号”
- “公开记录较丰富”
- “有可见公开活动”
- “低样本，仅供背景参考”

Forbidden:

- “H-1B 成功率”
- “绿卡成功率”
- “这家公司一定 sponsor”
- “这个分数说明你可以/不可以申请”
- Any claim that predicts filing eligibility, approval, hiring, or future employer behavior.

## Fixture Behavior

The default fixture demonstrates multiple cases:

- `brightline-health` has enough PERM records to avoid the low-sample warning.
- `cedar-fintech-labs` is flagged low-sample because H-1B/PERM records are sparse.
- `acme-analytics` demonstrates combined H-1B, PERM, USCIS, alias, and wage-context signals.

## SEO

The methodology route `/tools/company-immigration-score` is indexable after M20 because it has original Chinese explanation, official-source context, a worked fixture example, visible methodology table, internal links, and disclaimer language.
