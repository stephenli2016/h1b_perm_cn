# CODEX_MILESTONE_PLAN.md — VisaRadar CN Autonomous Build Plan

Project: **VisaRadar CN / 华人职业移民雷达**

Mission: Build a Chinese-language, official-data-based decision-support SEO website for overseas Chinese users researching H-1B, PERM, prevailing wage, employer sponsorship, and China employment-based visa bulletin issues.

This plan is designed for Codex Mac / Codex CLI to execute autonomously. The owner should only be needed at milestone boundaries, for keys/accounts, legal approvals, production launch, and other actions listed in `AGENTS.md`.

---

## Final product shape

Public product sections:

1. 首页: Chinese landing page explaining “查公司、查工资、查 PERM、查排期”.
2. H-1B company database: searchable company pages based on official data.
3. PERM/green-card company database: employer green-card sponsorship signals.
4. Prevailing wage / wage-level tools.
5. EB-2/EB-3 China visa bulletin tools.
6. 500–2,000 high-quality company pages.
7. 50 high-value tools/guides.
8. Correction request and compliance pages.
9. Later monetization: sponsored lawyer directory, job/career services, paid reports, email alerts.

MVP does not include:

- User accounts.
- Forum/comments.
- Personalized legal advice.
- Paid reports unless milestone reaches monetization phase.
- Scraped competitor data.

---

## Phase 0 — Owner setup and autonomous operating rules

### M00 — Owner prerequisite checklist, no coding

Purpose: Make sure the owner knows what will be needed later.

Codex tasks:

- Create/update `README_OWNER.md` with:
  - How to open the repo in Codex Mac.
  - How to start M01.
  - Keys that will eventually be requested.
  - Which milestones require owner approval.
- Do not require keys now.

Owner actions likely needed later:

- GitHub account/repository access.
- Supabase project and database URL.
- Vercel account/project.
- Domain name and DNS access.
- Analytics/Search Console if desired.
- Stripe only if paid reports are built.

Acceptance criteria:

- `README_OWNER.md` exists.
- It clearly says owner can start with local-only development.
- No secrets are required.

Human gate: End milestone confirmation only.

---

## Phase 1 — Foundation

### M01 — Repository scaffold and developer workflow

Purpose: Create the app foundation.

Codex tasks:

- Initialize Git if needed.
- Create a Next.js App Router TypeScript project using pnpm.
- Add Tailwind CSS.
- Add baseline lint, typecheck, formatting, and tests.
- Create project directories:
  - `app/`
  - `components/`
  - `lib/`
  - `data/`
  - `etl/`
  - `scripts/`
  - `docs/`
  - `tests/`
- Add `.env.example` with placeholder env vars.
- Add a simple Chinese homepage placeholder.
- Add `/health` route.
- Add CI-friendly commands to `package.json`.

Acceptance criteria:

- `pnpm install` works.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass or have documented local limitations.
- Homepage renders locally.
- No secrets committed.

Human gate: End milestone confirmation only.

---

### M02 — Product information architecture and routes

Purpose: Define page architecture before data implementation.

Codex tasks:

- Create route map and public sitemap draft.
- Implement static shell routes:
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
- Add Chinese nav, footer, and disclaimer strip.
- Add placeholder SEO metadata.
- Add `lib/site.ts` for site constants.

Acceptance criteria:

- All route shells render.
- Chinese navigation is usable.
- Disclaimer appears on data/tool pages.
- Build passes.

Human gate: End milestone confirmation only.

---

### M03 — Database schema and local data model

Purpose: Create a normalized model for official data.

Codex tasks:

- Choose and set up database/query strategy.
- Add schema/migrations for:
  - `employers`
  - `employer_aliases`
  - `locations`
  - `h1b_lca_records`
  - `perm_records`
  - `pwd_records`
  - `uscis_h1b_employer_records`
  - `visa_bulletin_months`
  - `visa_bulletin_dates`
  - `company_page_metrics`
  - `guide_pages`
  - `correction_requests`
  - `etl_runs`
  - `source_files`
- Add indexes for employer slug, raw employer name, fiscal year, SOC code, city/state, job title, source record ID.
- Add local dev seed fixture data.
- Add tests for schema creation and fixture queries.

Acceptance criteria:

- Local database or fixture mode works.
- Schema is documented in `docs/SCHEMA.md`.
- Tests cover core query examples.
- Build passes.

Human gate: End milestone confirmation only. Do not require Supabase yet; local mode is enough.

---

### M04 — ETL framework and source manifest

Purpose: Build a robust data pipeline foundation.

Codex tasks:

- Create `etl/` Python environment and dependency file.
- Add source manifest format:
  - source name
  - official URL
  - fiscal year/quarter
  - expected file type
  - checksum if available
  - downloaded path
  - parser name
- Add download helper that can fetch official public files when URLs are known.
- Add local fixture mode when downloads are unavailable.
- Add ETL run logging.
- Add unit tests for manifest parsing and raw file fingerprinting.
- Add `scripts/etl:*` commands in package or makefile.

Acceptance criteria:

- ETL can run against fixtures.
- Source files are fingerprinted.
- Failed download does not crash the whole project if fixture fallback exists.
- ETL run status is logged.

Human gate: End milestone confirmation only.

---

## Phase 2 — Official data ingestion

### M05 — OFLC LCA/H-1B parser

Purpose: Parse H-1B/LCA disclosure data.

Codex tasks:

- Implement parser for selected recent OFLC LCA disclosure files.
- Start with FY2025 and FY2026 available quarters if accessible; otherwise use fixtures.
- Normalize:
  - employer name
  - case number
  - case status
  - fiscal year
  - SOC code/title
  - job title
  - worksite city/state/zip
  - wage rate of pay
  - wage unit
  - prevailing wage
  - wage level if available
  - full-time indicator
  - received/decision dates
- Preserve raw fields in a JSON/raw table where reasonable.
- Add annualized wage conversion with clear logic and tests.
- Add duplicate detection using source record fingerprint.

Acceptance criteria:

- Fixture and at least one real-data sample parse correctly if data accessible.
- Wage normalization tests pass.
- Raw-to-normalized mapping documented.
- No personal data is displayed publicly.

Human gate: End milestone confirmation only.

---

### M06 — OFLC PERM parser

Purpose: Parse PERM public disclosure data.

Codex tasks:

- Implement parser for recent PERM disclosure files.
- Handle current and revised ETA-9089 formats if encountered.
- Normalize:
  - employer name
  - case number
  - case status
  - fiscal year
  - job title
  - SOC code/title
  - worksite city/state
  - wage offer / wage unit
  - priority date / received date / decision date if available
  - country of citizenship/birth only if available and safe; avoid personal identifiers
- Preserve raw fields where useful.
- Add tests for multiple PERM layouts.

Acceptance criteria:

- PERM fixtures parse.
- At least one real sample parses if accessible.
- Revised layout differences documented.
- PERM summaries can be queried by employer.

Human gate: End milestone confirmation only.

---

### M07 — Prevailing wage / PWD parser and wage lookup model

Purpose: Support wage-level and prevailing-wage tools.

Codex tasks:

- Implement parser for OFLC/FLAG wage data downloads or PWD disclosure files.
- Normalize:
  - data series / effective year
  - SOC code/title
  - area/city/state
  - wage levels 1–4 where available
  - wage unit
- Implement wage lookup query helper by SOC + location + year.
- Add tests for wage-level matching and missing-data fallback.

Acceptance criteria:

- Wage lookup works from fixtures.
- Tool-ready query helper exists.
- Limitations documented.

Human gate: End milestone confirmation only.

---

### M08 — USCIS H-1B Employer Data Hub ingestion

Purpose: Ingest USCIS employer petition decision data when available.

Codex tasks:

- Implement parser for USCIS downloadable CSV files if available.
- Normalize:
  - employer name
  - fiscal year
  - NAICS
  - initial approvals/denials if fields exist
  - continuing approvals/denials if fields exist
  - city/state/zip if fields exist
- Clearly label this as USCIS employer petition decision data, separate from DOL LCA.
- Add tests and docs.

Acceptance criteria:

- Parser works on fixture and official file if accessible.
- Query helper can summarize by employer/fiscal year.
- Public copy avoids misleading approval-rate claims.

Human gate: End milestone confirmation only.

---

### M09 — Visa Bulletin and USCIS filing chart parser

Purpose: Support China EB-2/EB-3 priority-date tools.

Codex tasks:

- Implement parser/scraper for U.S. Department of State Visa Bulletin pages.
- Store monthly final action dates and dates for filing for employment-based categories.
- Support China mainland-born EB-1/EB-2/EB-3 at minimum.
- Implement USCIS filing chart selection parser or manual monthly input fallback.
- Add tests for date parsing, `C`, `U`, and DAY-MONTH-YEAR formats.
- Create fixture files for at least 3 months.

Acceptance criteria:

- Current and historical fixture months parse.
- `/visa-bulletin` can show table from fixture data.
- Tool helper can determine whether a priority date is before a chart date.
- Clear warnings about not being legal advice.

Human gate: End milestone confirmation only.

---

### M10 — Employer canonicalization and top-company selection

Purpose: Create reliable company pages.

Codex tasks:

- Implement employer name normalization.
- Create alias table and deterministic matching.
- Build manual seed aliases for obvious large employers only if confident.
- Add confidence score.
- Create a scoring algorithm to select initial 500–2,000 company pages:
  - recent LCA count
  - PERM count
  - USCIS hub count if available
  - data diversity by job/location
  - Chinese user relevance signals from data, not scraped competitor info
- Add noindex/indexable decision helper.

Acceptance criteria:

- Top company list generated from fixture/real data.
- Alias mapping is auditable.
- Low-confidence merges are not automatic.
- Indexable selection criteria are documented.

Human gate: End milestone confirmation only.

---

## Phase 3 — Query layer and public pages

### M11 — Public query API and repository layer

Purpose: Make data available to pages safely.

Codex tasks:

- Implement typed server-side query functions:
  - search employers
  - get employer by slug
  - get H-1B summary by employer
  - get PERM summary by employer
  - get wage distribution by job/location
  - get related employers/jobs/locations
  - get visa bulletin dates
- Add caching strategy.
- Add input validation.
- Add tests for empty data and malformed slugs.

Acceptance criteria:

- Query layer works with fixture data.
- No direct unsafe SQL interpolation.
- Errors are user-friendly.

Human gate: End milestone confirmation only.

---

### M12 — Design system and Chinese UI components

Purpose: Build reusable UI pieces.

Codex tasks:

- Create layout components:
  - top nav
  - mobile nav
  - footer
  - source note box
  - disclaimer box
  - metric cards
  - data tables
  - empty states
  - breadcrumbs
  - related links
- Add accessibility basics.
- Add loading and error states.
- Use Chinese labels.

Acceptance criteria:

- Components are reusable.
- Mobile layout is acceptable.
- Lighthouse/accessibility basic checks pass if available.

Human gate: End milestone confirmation only.

---

### M13 — Search and directory pages

Purpose: Users can find companies/data.

Codex tasks:

- Implement `/h1b` search page.
- Implement `/perm` search page.
- Implement `/companies` or combined company search if useful.
- Add filters:
  - employer
  - fiscal year
  - state/city
  - job title/SOC
  - case status
- Add pagination.
- Add “how to interpret this data” boxes.
- Add noindex for filter combinations unless explicitly valuable.

Acceptance criteria:

- Search works locally.
- Empty/no-result states are clear.
- Filter URLs do not create SEO spam.
- Build passes.

Human gate: End milestone confirmation only.

---

### M14 — Company page template v1

Purpose: Create the core high-quality page template.

Codex tasks:

Implement `/h1b/company/[slug]` and/or unified `/company/[slug]` page with:

- Chinese title and meta description.
- Employer summary.
- H-1B/LCA recent-year cards.
- PERM recent-year cards.
- Wage distribution table/chart.
- Job title breakdown.
- Worksite location breakdown.
- PERM timeline/status summary.
- Data-source box.
- Caution/disclaimer box.
- Related companies/jobs/locations.
- FAQ section.
- Structured data where appropriate.

Acceptance criteria:

- At least 5 fixture companies render with different data shapes.
- Company page remains useful if some data sections are missing.
- No misleading “success rate” language.
- Build passes.

Human gate: End milestone confirmation only.

---

### M15 — Company page quality scoring, noindex, and sitemap logic

Purpose: Prevent low-quality programmatic SEO.

Codex tasks:

- Implement `companyPageQualityScore`.
- Implement indexability thresholds from `DATA_AND_SEO_POLICY.md`.
- Add metadata robots logic.
- Generate XML sitemaps split by type:
  - company pages
  - tools
  - guides
  - visa bulletin pages
- Exclude noindex pages from sitemap.
- Add canonical URLs.
- Add tests for index/noindex decisions.

Acceptance criteria:

- Low-data fixture company is noindex.
- High-data fixture company is indexable.
- Sitemap excludes noindex pages.
- Metadata/canonical tests pass.

Human gate: End milestone confirmation only.

---

### M16 — Generate first 500 high-quality company pages

Purpose: Reach initial launch scale safely.

Codex tasks:

- Use real data if available; otherwise use generated fixtures only for local validation.
- Generate/enable first 500 indexable company pages based on quality score.
- Add internal links among companies/jobs/locations.
- Add performance profiling for build/render.
- Add route pre-generation or dynamic strategy as appropriate.

Acceptance criteria:

- 500 page candidates selected from real data if available.
- Pages are not thin duplicates.
- Build performance is acceptable.
- Company sitemap generated.

Human gate: End milestone confirmation only.

---

### M17 — Expand toward 2,000 company pages and performance hardening

Purpose: Prepare the full initial target range.

Codex tasks:

- Increase selected pages toward 2,000 if data quality supports it.
- Optimize queries and caching.
- Add sitemap pagination if needed.
- Add page-size/performance checks.
- Ensure noindex logic handles low-data pages.

Acceptance criteria:

- Up to 2,000 pages can be generated/rendered.
- Build or dynamic rendering strategy is stable.
- No mass thin pages are indexable.

Human gate: End milestone confirmation only.

---

## Phase 4 — Tools and guides

### M18 — H-1B wage-level checker tool

Purpose: High-value interactive tool.

Codex tasks:

- Implement `/tools/h1b-wage-level-checker`.
- Inputs:
  - SOC/job title
  - city/state or worksite
  - offered wage
  - wage year
- Output:
  - approximate level comparison if data available
  - caveats
  - related company/job/location data
- Do not claim legal compliance.
- Add tests.

Acceptance criteria:

- Tool works with fixture and real wage data when available.
- Output is cautious.
- Page is indexable and useful.

Human gate: End milestone confirmation only.

---

### M19 — EB-2/EB-3 China priority date calculator

Purpose: Visa Bulletin traffic and internal support.

Codex tasks:

- Implement `/tools/eb2-eb3-china-priority-date-calculator`.
- Inputs:
  - category EB-1/EB-2/EB-3
  - country/chargeability default China mainland-born
  - priority date
  - chart type Final Action / Dates for Filing
- Output:
  - current month result
  - explanation in Chinese
  - source month and source URL
  - USCIS filing chart note
- Add `/visa-bulletin/[year]/[month]` pages if data exists.

Acceptance criteria:

- Handles date, `C`, and `U` states.
- Does not guarantee filing eligibility.
- Build/tests pass.

Human gate: End milestone confirmation only.

---

### M20 — Company immigration signal score

Purpose: Differentiate from plain data sites.

Codex tasks:

- Implement cautious “signals” rather than “success score”.
- Signals may include:
  - recent LCA activity
  - PERM activity
  - repeat filings across years
  - data consistency
  - job/location diversity
  - wage context
- Name it in Chinese as “公开数据友好度信号” or similar, not “成功率”.
- Add methodology page.
- Add tests.

Acceptance criteria:

- Score is transparent and explainable.
- Low sample size is clearly flagged.
- No legal outcome claims.

Human gate: End milestone confirmation only.

---

### M21 — H-1B transfer and PERM restart timeline estimator

Purpose: Practical decision-support page.

Codex tasks:

- Implement `/tools/h1b-transfer-risk-checklist` and `/tools/perm-restart-timeline-estimator`.
- Use generic educational scenarios.
- Include checklists and disclaimers.
- Link to company PERM/H-1B data.
- Do not ask for sensitive details.

Acceptance criteria:

- Tools are useful without collecting sensitive personal info.
- No legal advice claims.
- Internal links work.

Human gate: End milestone confirmation only.

---

### M22 — Publish 50 high-value guide/tool pages

Purpose: Build SEO support content.

Codex tasks:

- Implement all 50 pages from `CONTENT_GUIDE_50_TOPICS.md`.
- Use MDX or typed content files.
- Create content templates but ensure each page has unique useful content.
- Include official source boxes where applicable.
- Include related links.
- Add review date and disclaimer.
- Add content quality tests/checks:
  - title exists
  - meta exists
  - disclaimer exists
  - minimum useful sections exist
  - no forbidden language

Acceptance criteria:

- 50 pages exist.
- Priority 1 pages are especially polished.
- No generic filler-only pages.
- Build passes.

Human gate: End milestone confirmation only. No legal review required until production readiness.

---

## Phase 5 — SEO, compliance, and launch readiness

### M23 — Technical SEO hardening

Purpose: Make the site crawlable and defensible.

Codex tasks:

- Metadata templates for all page types.
- Canonicals.
- Breadcrumbs.
- JSON-LD for visible content only.
- XML sitemap split by page type.
- Robots.txt.
- Noindex logic for low-quality pages.
- OpenGraph/Twitter metadata.
- Internal link graph checks.
- 404/500 pages.

Acceptance criteria:

- SEO tests pass.
- Structured data is representative of visible content.
- Sitemap excludes noindex pages.
- No uncontrolled filter URL indexing.

Human gate: End milestone confirmation only.

---

### M24 — Legal/compliance pages and correction workflow

Purpose: Reduce legal and data-risk exposure.

Codex tasks:

- Implement:
  - `/disclaimer`
  - `/privacy`
  - `/terms`
  - `/corrections`
  - `/sources`
- Add correction request form with local stub if email/db unavailable.
- Add data-source and methodology pages:
  - LCA methodology
  - PERM methodology
  - wage methodology
  - visa bulletin methodology
  - employer signal methodology
- Add sitewide footer disclaimers.

Acceptance criteria:

- Pages are present and linked.
- Forms do not expose secrets.
- Legal language is cautious and clearly marked as draft for owner/legal review.

Human gate: Owner should review/approve legal pages before production launch.

---

### M25 — Analytics, monitoring, and webmaster setup

Purpose: Prepare for SEO learning and maintenance.

Codex tasks:

- Add environment-based analytics placeholders.
- Support GA4 or Plausible if owner provides key.
- Add Search Console verification placeholder.
- Add basic error monitoring placeholder.
- Add data freshness dashboard page or internal CLI report.
- Add `scripts/seo:audit` and `scripts/data:freshness`.

Acceptance criteria:

- Site works without analytics keys.
- `.env.example` documents optional keys.
- Owner action list clearly states what keys/verification are needed.

Human gate: Ask owner for analytics/Search Console only if they want it now; otherwise proceed with placeholders.

---

### M26 — Production database setup preparation

Purpose: Prepare Supabase or production Postgres without blocking local work.

Codex tasks:

- Create Supabase migration instructions.
- Add production schema migration scripts.
- Add seed/import instructions.
- Add RLS guidance if public tables/API routes require it.
- Add backup/export strategy.
- Add `.env.example` variables:
  - `DATABASE_URL`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` if required server-side only
- Do not commit keys.

Acceptance criteria:

- Local migrations work.
- Production setup doc is clear.
- App can run in local fixture mode without Supabase.

Human gate: Ask owner for Supabase project/keys only when needed for production import.

---

### M27 — Vercel deployment preparation

Purpose: Prepare but do not make irreversible deployment changes without approval.

Codex tasks:

- Add Vercel configuration if needed.
- Ensure build works in production mode.
- Add environment variable checklist.
- Add deployment checklist.
- Add domain/DNS instructions.
- Add “prelaunch noindex mode” option if owner wants to test privately.

Acceptance criteria:

- `pnpm build` passes locally.
- Vercel deployment instructions are clear.
- No production DNS changes are made without owner approval.

Human gate: Owner approval required before production deploy/domain connection.

---

### M28 — Production launch gate

Purpose: Final review before public indexing.

Codex tasks:

Run production readiness checklist:

- No secrets committed.
- Build passes.
- Sitemap contains only approved indexable pages.
- Low-quality pages noindex.
- Disclaimers visible.
- Terms/privacy/disclaimer/corrections/source pages linked.
- Data source dates visible.
- No competitor-scraped data.
- No forbidden claims.
- Analytics/search console optional keys configured if provided.
- Production DB has imported data or launch fixture mode is explicitly disabled.

Acceptance criteria:

- Create `docs/LAUNCH_READINESS_REPORT.md`.
- Stop and ask owner for explicit launch approval.

Human gate: Required.

---

## Phase 6 — Maintenance automation and monetization

### M29 — Scheduled data update automation

Purpose: Keep data fresh with low human effort.

Codex tasks:

- Add GitHub Actions or Vercel Cron for:
  - checking DOL OFLC new disclosure releases
  - checking Visa Bulletin monthly updates
  - running ETL validation
  - generating data freshness reports
- Do not auto-publish suspicious data changes without validation.
- Add failure notifications placeholder.

Acceptance criteria:

- Automation can run in dry-run mode.
- Freshness report generated.
- Data anomalies are flagged.

Human gate: Ask owner only for platform secrets or notification destination.

---

### M30 — Email alerts / newsletter waitlist

Purpose: Capture value without heavy interaction.

Codex tasks:

- Add optional email capture for:
  - Visa Bulletin alerts
  - company data updates
  - launch updates
- Use double opt-in if provider supports it.
- Add provider-agnostic interface; support Resend/Mailchimp/Buttondown later.
- Store minimal data.
- Add privacy copy.

Acceptance criteria:

- Works with local stub without provider key.
- Does not collect sensitive immigration facts.
- Owner can plug in email provider later.

Human gate: Ask for email provider key only if owner wants activation.

---

### M31 — Monetization v1: non-legal paid reports and affiliate-safe pages

Purpose: Start low-risk monetization.

Codex tasks:

- Add paid report concept but do not enable payment unless Stripe key is provided.
- Report examples:
  - company sponsor data PDF
  - wage comparison report
  - job title/city salary report
- Add affiliate/sponsored disclosure template.
- Avoid legal advice.
- Add Stripe placeholder integration.

Acceptance criteria:

- Report generation works locally as a downloadable mock/sample.
- Payment disabled unless keys provided.
- Sponsored/affiliate disclosure is clear.

Human gate: Ask owner for Stripe only if payment activation requested.

---

### M32 — Monetization v2: sponsored lawyer/service directory, compliance-first

Purpose: Higher-value monetization with compliance safeguards.

Codex tasks:

- Build a directory architecture, not a referral recommendation engine.
- Label sponsored placements clearly.
- Do not rank lawyers as “best” unless legally reviewed and based on transparent objective criteria.
- Add profile pages for immigration lawyers/service providers with owner-provided data only.
- Add inquiry form stub.
- Add compliance note for attorney advertising.

Acceptance criteria:

- Directory can exist without live providers.
- Sponsored labels are visible.
- No “we recommend the best lawyer for you” language.

Human gate: Owner/legal review required before activation.

---

### M33 — Search Console-driven expansion plan

Purpose: Expand pages based on real SEO signals.

Codex tasks:

- Add workflow to ingest Search Console export manually or via API if configured.
- Identify keywords with impressions but low CTR/rank.
- Recommend new company/job/location pages only if data quality supports them.
- Create expansion report.

Acceptance criteria:

- Expansion recommendations are data-driven.
- No mass-page creation without quality threshold.

Human gate: End milestone confirmation only, unless Search Console API access is requested.

---

### M34 — Admin/data quality dashboard

Purpose: Let owner monitor without reading logs.

Codex tasks:

- Create simple admin/dashboard page protected by env password or disabled in production by default.
- Show:
  - latest data dates
  - ETL run status
  - number of indexable/noindex pages
  - top data anomalies
  - correction requests
  - sitemap counts
- Avoid exposing secrets.

Acceptance criteria:

- Dashboard works locally.
- Production access is protected or disabled.

Human gate: Ask owner for admin password only if activating.

---

## Suggested first launch scope

Launch only after M28 if all are true:

- At least 500 high-quality company pages from official data.
- At least 15 polished tools/guides, ideally all 50 if M22 complete.
- H-1B search works.
- PERM search works.
- Wage-level checker works with caveats.
- EB-2/EB-3 China priority-date calculator works.
- Sitemap/noindex logic works.
- Legal/source/correction pages present.
- No secrets committed.
- Owner approves production launch.

---

## Recommended default site/page naming

Use placeholders until owner chooses final brand/domain:

- Brand: `VisaRadar CN`
- Chinese name: `华人职业移民雷达`
- Tagline: `查公司、查工资、查 PERM、查排期`
- Default contact email placeholder: `hello@example.com`
- Default domain placeholder: `example.com`

Do not block on naming. Use placeholders and make names configurable in `lib/site.ts`.

---

## Forbidden shortcuts

Codex must not:

- Publish pages from competitor data.
- Generate 100k thin pages.
- Create legal-advice chatbots.
- Store sensitive user immigration data in MVP.
- Claim case outcomes.
- Commit secrets.
- Deploy publicly without explicit owner approval.
- Use paid services without owner approval.

---

## Completion philosophy

Prefer a working, safe, source-cited, data-rich MVP over a large but fragile site. The business advantage is not “more pages”; it is Chinese decision support built on official data with careful interpretation.
