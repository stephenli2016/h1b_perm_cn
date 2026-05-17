# Milestone P2 Report — Company Page Reading Flow

## Status

Completed locally. P2 changes are not committed yet.

## Built

- Added a “建议这样读这个公司页” section to company pages so users understand the intended reading order:
  - confirm employer entity and alias mapping
  - compare similar roles, SOC, worksite, and fiscal years
  - turn public data into questions for HR, recruiter, immigration team, or counsel
- Added mode-specific “下一步可以查看” links:
  - H-1B company pages link to wage level and H-1B data salary negotiation tools.
  - PERM company pages link to PERM restart timeline and EB priority date tools.
  - Both modes link back to company directory and correction request flow.
- Replaced public-facing internal SEO wording:
  - `页面索引状态` became `页面质量状态`.
  - Removed the visible `M15` reference from company page copy.
  - Source notes now explain whether the page reached public inclusion quality thresholds without exposing milestone language.
- Added regression coverage for the company page reading guide, next-step links, page-quality wording, and absence of `M15`.

## Files changed

- `components/company/company-profile.tsx`
- `tests/ui-components.test.tsx`

## Validation

- Command: `pnpm format`
- Result: pass
- Command: `pnpm lint`
- Result: pass
- Command: `pnpm typecheck`
- Result: pass
- Command: `pnpm test`
- Result: pass, 21 files / 132 tests
- Command: `pnpm seo:audit`
- Result: pass, 4 files / 29 tests
- Command: `pnpm build`
- Result: pass, 80 static pages generated

## Screenshots / local URLs

- Browser-verified local production server at `http://127.0.0.1:3000`.
- Verified `/perm/company/22nd-century-technologies`:
  - canonical `https://h1b-perm-cn.vercel.app/perm/company/22nd-century-technologies`
  - `index, follow`
  - contains `建议这样读这个公司页`, `下一步可以查看`, `跳槽后 PERM 重办时间线估算器`, and `页面质量状态`
  - does not contain `M15` or `页面索引状态`
- Verified `/h1b/company/22nd-century-technologies`:
  - canonical `https://h1b-perm-cn.vercel.app/h1b/company/22nd-century-technologies`
  - `index, follow`
  - contains `建议这样读这个公司页`, `下一步可以查看`, `H-1B 工资 Level 中文判断工具`, and `页面质量状态`
  - does not contain `M15` or `页面索引状态`

## Decisions made without owner input

- Treated P2 as a company-page reading-flow and data-interpretation polish pass.
- Kept the page server-rendered and reused existing `RelatedLinks` / `MetricCard` UI rather than adding new client-side interactions.
- Used mode-specific next-step links so H-1B and PERM pages lead users to different practical follow-up tools.

## Known limitations

- P2 is complete locally but not committed, pushed, or deployed.
- Company pages still rely on existing table layout; deeper table filtering/sorting would be a separate enhancement.

## Owner action needed

- Confirm whether P2 is accepted.
- Confirm whether to commit P2 before entering P3.

## Recommended next milestone

P3 — Continue the final priority bucket after owner confirmation.
