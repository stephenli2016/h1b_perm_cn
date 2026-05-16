# DATA_AND_SEO_POLICY.md — Official Data, SEO, Privacy, and Compliance Rules

Last planned date: 2026-05-16

## 1. Product category

This is an information and decision-support website, not a law firm, not a legal service, not a visa filing service, and not a job-placement service.

Required sitewide disclaimer in Chinese:

> 本站基于公开数据整理，仅供信息参考，不构成法律、移民、税务、职业或财务建议。LCA、PERM、H-1B Employer Data Hub、Visa Bulletin 等公开记录并不代表个案批准、雇主实际录用、雇主未来承诺或律师意见。具体情况请咨询持牌移民律师或相关专业人士。

Short disclaimer for cards/tables:

> 公开数据仅供参考，不代表个案结果。

## 2. Approved official sources

Codex must verify current URLs while implementing. Start from these official source families:

1. DOL OFLC Foreign Labor Certification news and public disclosure files.
   - https://www.dol.gov/agencies/eta/foreign-labor
   - https://www.dol.gov/agencies/eta/foreign-labor/performance

2. DOL/FLAG prevailing wage search and wage data downloads.
   - https://flag.dol.gov/wage-data/wage-search
   - https://flag.dol.gov/wage-data
   - https://www.dol.gov/agencies/eta/foreign-labor/wages

3. USCIS H-1B Employer Data Hub and official downloadable files when available.
   - https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub
   - https://www.uscis.gov/archive/h-1b-employer-data-hub-files

4. U.S. Department of State Visa Bulletin.
   - https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html

5. USCIS Adjustment of Status filing chart page.
   - https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin

6. Optional official data later:
   - BLS OEWS if direct occupational wage context is needed.
   - Census/CBP/BEA only if a specific public-data page requires it.

## 3. Disallowed sources for ingestion

Do not ingest, copy, scrape, or paraphrase data tables from competitor sites, forums, social media, or law firm articles.

Disallowed ingestion examples:

- H1BData.info
- H1BGrader
- MyVisaJobs
- 1Point3Acres / 一亩三分地
- Reddit, Blind, WeChat, Xiaohongshu, forums
- Attorney blog datasets
- Any site that is not an official source or explicitly licensed data provider

Competitor pages may be opened only for competitive research if the owner asks, not for data input.

## 4. Data interpretation rules

### LCA / H-1B disclosure data

Allowed:

- “根据 DOL OFLC 公开 LCA 数据，该雇主在 FY2025 有 X 条 certified LCA 记录。”
- “LCA 是 H-1B 流程中的劳工条件申请记录，不等于 H-1B petition 批准。”

Forbidden:

- “该公司 H-1B 成功率为 X%” unless using USCIS employer hub decision data and clearly defining the denominator and limitations.
- “该公司一定 sponsor.”
- “该 LCA 对应某个人已入职.”

### PERM data

Allowed:

- “根据 OFLC PERM disclosure data，该雇主近 N 年有 X 条 certified PERM records.”
- “PERM certification 是职业移民中的劳工认证步骤之一，不等于 I-140/I-485 或绿卡获批。”

Forbidden:

- “该公司绿卡成功率 X%” unless the site has end-to-end official approval data, which likely does not exist.
- “该公司保证办绿卡.”

### Prevailing Wage

Allowed:

- “DOL 将 prevailing wage described as average wage paid to similarly employed workers in a specific occupation and area.”
- “工资水平判断需要 SOC、地区、职位职责、经验要求等信息。”

Forbidden:

- “你的工资一定合规.”
- “你的 case 可以这样填.”

### Visa Bulletin

Allowed:

- “本月 Visa Bulletin 显示中国大陆出生 EB-2 Final Action Date 为 X。”
- “如果 priority date 早于表中日期，通常表示该类别在该表下排期已到；实际 filing chart 还需看 USCIS 当月选择。”

Forbidden:

- “你的 I-485 本月一定可以交.”
- “未来一定会前进/后退到某日期.”

## 5. Privacy and PII rules

- Never show foreign worker names.
- Never show personal addresses.
- Never show FEIN beyond what official datasets already aggregate, and avoid showing even partial tax IDs unless necessary for employer disambiguation.
- Avoid publishing tiny cohorts that could identify a specific person.
- For records under 3 in a highly specific employer + city + job combination, show aggregated summaries and avoid strong conclusions.
- Provide a correction/removal request page and email placeholder.

## 6. Employer canonicalization rules

Common problem: employer names vary across years and systems.

Create these entities:

- `employers`: canonical employer.
- `employer_aliases`: raw names mapped to canonical employer.
- `employer_locations`: normalized city/state/zip records.
- `source_records`: raw record fingerprints for auditability.

Canonicalization approach:

1. Normalize punctuation, casing, legal suffixes, whitespace.
2. Preserve raw employer name in source table.
3. Use deterministic rules first.
4. Use manual alias table for top employers.
5. Do not merge ambiguous employers automatically.
6. Record confidence score and source.

## 7. SEO indexability thresholds

A programmatic page is indexable only if it meets value thresholds.

Company page minimum for initial launch:

- At least 10 relevant LCA records in recent 5 fiscal years OR at least 3 PERM records in recent 5 fiscal years OR meaningful USCIS H-1B Employer Hub records.
- Has at least one table or chart unique to the company.
- Has at least 300–500 Chinese words of useful explanation that is not generic filler.
- Shows latest data date and sources.
- Includes internal links.

If a company has low data:

- Keep page accessible for search within site if useful.
- Add `<meta name="robots" content="noindex">` until quality threshold is met.
- Exclude from XML sitemap.

Tool/guide page indexability:

- Must solve a real user question.
- Must contain original Chinese explanations, official source context, examples, warnings, and related links.
- No AI filler.

## 8. Structured data rules

Use JSON-LD only when representative of visible page content.

Allowed types:

- `BreadcrumbList`
- `FAQPage` when visible FAQs exist.
- `Dataset` or `DataCatalog` for official data pages if appropriate.
- `WebApplication` for calculators/tools.
- `Article` for guides if content is article-like.

Avoid:

- Fake reviews/ratings.
- `JobPosting` unless the page is truly a job posting.
- Marking hidden content.

## 9. Google scaled-content risk controls

- Start with 500–2,000 high-quality pages, not 100,000 thin pages.
- Use data quality scoring before indexing.
- Split sitemap by type and include only indexable pages.
- Add canonical URLs.
- Add noindex for low-quality/low-data pages.
- Avoid near-duplicate templates.
- Make each page useful without relying on ads/affiliate links.
- Keep affiliate/lead gen clearly disclosed.

## 10. Correction and audit

Implement later but design now:

- `/corrections` page.
- `correction_requests` table.
- Admin-only review workflow or email notification.
- Raw record fingerprint and source URL for traceability.
- Clear policy: site may correct canonicalization/display errors; official records remain official-source records.
