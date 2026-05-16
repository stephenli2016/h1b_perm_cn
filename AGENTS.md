# AGENTS.md — Codex Autonomous Build Instructions

Project codename: **VisaRadar CN / 华人职业移民雷达**

This repository is for a Chinese-language SEO product for overseas Chinese users, focused first on U.S. H-1B, PERM, prevailing wage, employer sponsorship history, and China employment-based visa bulletin decision support.

## 0. Read before doing any work

Before starting any milestone, read these files:

1. `AGENTS.md` — this file, project rules and operating protocol.
2. `docs/CODEX_MILESTONE_PLAN.md` — full milestone plan and acceptance criteria.
3. `docs/DATA_AND_SEO_POLICY.md` — official source, data quality, SEO, privacy, and compliance rules.
4. `docs/CONTENT_GUIDE_50_TOPICS.md` — 50 high-value Chinese tool/guide pages.
5. `docs/CODEX_OWNER_PROMPTS.md` — how the owner will start/resume work.

If a file is missing, create it from the latest project plan before continuing.

## 1. Product goal

Build the final-form product in stages:

> A Chinese decision-support website for overseas Chinese professionals to research whether a U.S. employer is suitable for H-1B and green-card/PERM planning.

Initial launch target:

- 500–2,000 high-quality company pages.
- 50 high-value tool/explainer pages.
- Official-source data only.
- Programmatic SEO pages that are useful, data-rich, and not thin content.
- Minimal owner involvement.
- No forum, no comments, no user-generated content in MVP.
- No legal advice, no personalized immigration advice.

## 2. Audience and language rules

Primary users: 海外华人, especially Chinese-speaking international students, OPT/STEM OPT workers, H-1B workers, job seekers, and employment-based green card applicants.

Language:

- Public site UI and public copy: Simplified Chinese by default.
- Technical variable names, code comments, database names: English.
- URLs: English slugs by default for maintainability; Chinese titles and metadata for SEO.
- Each page should explain U.S. immigration/data terms in Chinese, with concise English term labels where helpful.

Tone:

- Clear, practical, cautious.
- Never overpromise.
- Always distinguish data signals from legal conclusions.

## 3. Human-interaction protocol

The owner wants minimum human effort. Do not ask questions during a milestone unless absolutely required.

Only ask the owner when one of these is true:

1. End of a milestone: produce a concise milestone report and ask for approval to continue.
2. A secret/API key/account is needed: Supabase, Vercel, domain DNS, Stripe, analytics, Sentry, GitHub, etc.
3. Production deployment, domain connection, DNS change, paid subscription, or irreversible action is needed.
4. A legal/compliance statement must be approved before launch.
5. A required official data source is unavailable and no local/fixture fallback can reasonably continue.
6. A security or privacy issue could expose secrets or personal data.
7. The requested action would violate official source terms, Google spam policies, or legal/ethical constraints.

When blocked by missing keys, do this instead of stopping where possible:

- Create `.env.example` with placeholder names.
- Implement local mocks/fixtures.
- Add a clear TODO in the milestone report.
- Continue all work that can be completed without the key.

Do not ask the owner about aesthetic preferences, minor naming choices, implementation libraries, copy wording, or whether to proceed within a milestone. Make reasonable decisions and document them.

## 4. Milestone execution protocol

Each milestone must be completed as an isolated unit.

At the start of each milestone:

1. Read the relevant milestone section in `docs/CODEX_MILESTONE_PLAN.md`.
2. Create or update a branch/worktree if appropriate.
3. Inspect current repo status.
4. Write a short internal implementation plan.
5. Execute without asking the owner unless a human-interaction trigger occurs.

At the end of each milestone:

1. Run tests, lint, typecheck, and any milestone-specific validation.
2. Create `docs/milestone_reports/MXX_<short_name>.md` containing:
   - What was built.
   - Files changed.
   - Commands run and results.
   - Screenshots or local URLs if applicable.
   - Known limitations.
   - Required owner actions, if any.
   - Exact next recommended milestone.
3. Stop and ask the owner to confirm continuation.

Never silently skip acceptance criteria. If a criterion cannot be met, explain why in the milestone report and provide the best fallback.

## 5. Tech stack defaults

Use these defaults unless a strong technical reason exists:

- App: Next.js App Router, TypeScript, React, Tailwind CSS.
- UI: accessible components; shadcn/ui is acceptable if already added, but avoid adding many UI dependencies.
- Package manager: pnpm.
- Database: Supabase Postgres for production, with local Postgres or SQLite/DuckDB fixtures for local development.
- ORM/query layer: Drizzle ORM or direct SQL with typed query helpers. Prefer maintainable SQL for analytics-heavy queries.
- ETL: Python scripts with Polars/DuckDB for large official datasets, plus TypeScript wrappers where useful.
- Charts: lightweight React chart library or SVG/table-first visualizations. Do not make charts essential for reading data.
- Deployment: Vercel.
- Cron/automation: GitHub Actions and/or Vercel Cron.
- Testing: Vitest for TS units, Playwright for core browser flows, pytest for Python ETL, SQL fixture tests.
- Observability: minimal first; add Sentry/Plausible/GA only when keys are provided.

Avoid in MVP unless necessary:

- User accounts.
- Forums/comments.
- Complex admin panels.
- Paid search infrastructure like Algolia.
- Scraping competitor websites.
- AI-generated bulk articles without data/tool value.

## 6. Official data source rules

Use official and public sources first:

- DOL OFLC public disclosure/performance data for LCA/H-1B, PERM, and Prevailing Wage.
- DOL/FLAG wage search/downloads for prevailing wage data.
- USCIS H-1B Employer Data Hub or official downloadable files where available.
- U.S. Department of State Visa Bulletin.
- USCIS Adjustment of Status filing chart page for which chart to use.

Do not scrape or copy competitor databases such as H1BData, H1BGrader, MyVisaJobs, 1Point3Acres, attorney blog datasets, Reddit, forums, or paid databases. They can be used only for manual competitive awareness, not as data inputs.

Every public data page must show:

- Data source name.
- Latest data date / fiscal years covered.
- A plain-Chinese explanation that LCA/PERM/Employer Hub records are signals, not guarantees of approval or hiring.
- A disclaimer: “本站内容仅供信息参考，不构成法律、移民、税务或职业建议。”

## 7. SEO rules

Programmatic SEO is allowed only when the page adds real value.

A page is indexable only if it has enough unique value:

- Real official data.
- Useful summaries, comparisons, charts/tables, and source dates.
- Internal links to related companies, job titles, locations, tools, and guides.
- User-visible content that matches structured data.
- No misleading claims.

Pages with thin data must be `noindex` until they meet quality thresholds.

Never generate huge numbers of near-identical pages just for ranking. Start with 500–2,000 company pages selected by quality signals and expand only after Search Console confirms demand.

## 8. Legal, privacy, and safety rules

This product must not provide legal advice.

Forbidden public claims:

- “这家公司一定给你办 H-1B/绿卡.”
- “H-1B 成功率/绿卡成功率” unless the metric is clearly defined using official data and not framed as actual approval odds.
- “你的排期一定会在某月到达.”
- “你的工资一定符合 H-1B 要求.”
- Any recommendation to hide information, misrepresent credentials, or bypass immigration rules.

Privacy rules:

- Do not display foreign worker names, personal addresses, or unnecessary personal identifiers even if found in data.
- Aggregate low-sample-size combinations.
- Do not infer individual identity from small employer/location/job combinations.
- Add a correction/removal request path.
- Do not collect sensitive immigration details in MVP unless absolutely necessary.

## 9. Quality bar for company pages

Each indexable company page should include:

- Chinese title and meta description.
- Employer canonical name and alias handling.
- H-1B/LCA summary for recent fiscal years.
- PERM summary for recent fiscal years if available.
- Prevailing wage / wage-level context where available.
- Job title and worksite breakdown.
- Data coverage and source notes.
- “How to read this page” explanation in Chinese.
- Cautious sponsor signals, not legal conclusions.
- Tables with filters/sorting where useful.
- Related companies, locations, job titles, tools, and guides.
- JSON-LD only when representative of visible page content.
- Clear disclaimer.

## 10. Development discipline

- Keep code readable and modular.
- Prefer small, testable functions.
- Add tests for ETL transformations, wage normalization, employer canonicalization, visa bulletin parsing, SEO indexability rules, and route generation.
- Never commit secrets.
- Maintain `.env.example`.
- Use clear commit messages if committing.
- Update docs when behavior changes.
- Run formatting/lint/typecheck/tests before milestone completion.

Default validation commands, adjust if project scripts differ:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pytest
```

## 11. Owner-facing milestone report template

Use this structure:

```md
# Milestone MXX Report — <name>

## Status
Completed / Partially completed / Blocked

## Built
- ...

## Files changed
- ...

## Validation
- Command: `...`
- Result: pass/fail

## Screenshots / local URLs
- ...

## Decisions made without owner input
- ...

## Known limitations
- ...

## Owner action needed
- None / Provide X / Approve Y

## Recommended next milestone
MXX — <name>
```

## 12. First action when Codex starts in an empty folder

If the repository is empty:

1. Initialize Git if needed.
2. Create the project structure.
3. Preserve this `AGENTS.md` and docs.
4. Begin Milestone M01 from `docs/CODEX_MILESTONE_PLAN.md`.
5. Do not ask for clarifications unless required by the human-interaction protocol.
