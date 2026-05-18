# Milestone P2 Report — Company Page Reading Flow

## Status

Completed locally. P2 changes are not committed yet.

## Built

- Strengthened company pages around user decision flow:
  - kept “先看结论” as the first page-level reading anchor
  - added “可以直接问雇主的问题” so users can turn public data into concrete HR/recruiter/immigration-team questions
  - generated H-1B, PERM, employer-entity, and wage/SOC questions from the company profile payload
- Replaced remaining user-facing SEO/index phrasing in company page hero copy with practical reading guidance:
  - H-1B pages now explain that records help prepare employer/lawyer questions
  - PERM pages now explain the same while preserving the PERM/I-140/I-485 boundary
- Made low-data company pages easier to interpret:
  - “资料完整度” now describes which data dimensions are sparse instead of exposing internal quality-gate wording
  - missing H-1B wage samples now explain that missing samples are not a compliance conclusion and link to the wage-level tool
- Added regression coverage for the new company-page question checklist across H-1B and PERM examples.

## Files changed

- `app/h1b/company/[slug]/page.tsx`
- `app/perm/company/[slug]/page.tsx`
- `components/company/company-profile.tsx`
- `tests/ui-components.test.tsx`
- `docs/milestone_reports/P2_company_page_reading_flow.md`

## Validation

- Command: `pnpm format`
- Result: pass
- Command: `pnpm lint`
- Result: pass
- Command: `pnpm typecheck`
- Result: pass
- Command: `pnpm test`
- Result: pass, 21 files / 136 tests
- Command: `pnpm seo:audit`
- Result: pass, 4 files / 30 tests
- Command: `pnpm build`
- Result: pass, 79 static pages generated

## Screenshots / local URLs

- Browser-verified local fixture server at `http://localhost:3001`.
- Verified `/h1b/company/acme-analytics`:
  - contains `先看结论`
  - contains `可以直接问雇主的问题`
  - contains `我的 offer 上的雇主法定实体`
  - contains `这个岗位的职位、SOC、工作地点和近年 H-1B/LCA 记录`
  - contains `H-1B 工资等级中文判断工具`
- Verified `/perm/company/brightline-health`:
  - contains `先看结论`
  - contains `可以直接问雇主的问题`
  - contains `这个岗位是否会启动 H-1B/LCA`
  - contains `这个岗位的 PERM 职位、地点、启动时间`
  - contains `跳槽后 PERM 重办时间线估算器`

## Decisions made without owner input

- Treated P2 as the company-page reading-flow pass after the P1 terminology/user-copy cleanup.
- Kept everything server-rendered and reusable from the existing company profile payload.
- Used question cards instead of adding interactive filters, because the immediate user problem is interpretation and next action, not table manipulation.

## Known limitations

- P2 is complete locally but not committed, pushed, or deployed.
- Browser verification used local fixture slugs so the checks are deterministic. Production company slugs depend on the current Supabase data.
- Company tables still use the existing table layout; deeper filtering/sorting remains a later enhancement.

## Owner action needed

- Confirm whether P2 is accepted.

## Recommended next milestone

P3 — Continue the next priority bucket after owner confirmation.
