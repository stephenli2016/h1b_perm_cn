# Milestone P1 Report — Directory Discovery Polish

## Status

Completed locally. P1 changes are not committed yet.

## Built

- Upgraded `/tools` from a flat tool list into a task-oriented entry page:
  - 投递前查公司
  - 谈 offer 和工资
  - 从 OPT 走到 H-1B
  - 看 PERM 和排期
- Upgraded `/guides` from a category-only index into a guided reading entry page:
  - 先按问题选择
  - 建议先读
  - 分类锚点导航
- Removed user-visible internal priority wording from content pages and directory cards:
  - Replaced `Priority 1` / `P1` style labels with `核心必读`, `进阶补充`, and `场景延伸`.
- Added tests to ensure directory pages render the task-oriented sections and do not expose internal priority labels.

## Files changed

- `app/tools/page.tsx`
- `app/guides/page.tsx`
- `components/content/content-article.tsx`
- `tests/content-pages.test.tsx`

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
- Verified `/tools`:
  - canonical `https://h1b-perm-cn.vercel.app/tools`
  - `index, follow`
  - contains `按任务开始`, `投递前查公司`, `从 OPT 走到 H-1B`, `全部工具`
  - does not contain `P1 ·`, `Priority 1`, or `内容优先级`
- Verified `/guides`:
  - canonical `https://h1b-perm-cn.vercel.app/guides`
  - `index, follow`
  - contains `先按问题选择`, `第一次读 H-1B 数据`, `建议先读`, `指南分类`
  - does not contain `P1 ·`, `Priority 1`, or `内容优先级`
- Verified `/guides/what-is-lca-chinese`:
  - contains `阅读定位`, `核心必读`, and `你可以用它做什么`
  - does not expose internal priority labels

## Decisions made without owner input

- Treated P1 as a user-discovery and navigation polish pass after P0.
- Kept all additions static/server-rendered and avoided client-side filtering to preserve SEO simplicity.
- Used task-oriented groupings instead of adding a search box, because the content set is still small enough to scan.

## Known limitations

- P1 is complete locally but not committed, pushed, or deployed.
- Directory pages still do not have text search; that should wait until the content catalog grows or usage data shows demand.

## Owner action needed

- Confirm whether P1 is accepted.
- Confirm whether to commit P1 before entering P2.

## Recommended next milestone

P2 — Continue the next priority bucket after owner confirmation.
