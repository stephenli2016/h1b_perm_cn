# Milestone M01 Report — Repository Scaffold and Developer Workflow

## Status

Completed

## Built

- Initialized Git on branch `main`.
- Created a Next.js App Router project with TypeScript, React, Tailwind CSS, and pnpm.
- Added baseline developer workflow commands for dev, build, lint, typecheck, test, and formatting.
- Added a Simplified Chinese homepage placeholder for VisaRadar CN / 华人职业移民雷达.
- Added `/health` route returning JSON service status.
- Added `.env.example` with local-only placeholders for future database and Supabase variables.
- Added required project directories: `app/`, `components/`, `lib/`, `data/`, `etl/`, `scripts/`, `docs/`, and `tests/`.
- Added Vitest coverage for the health route and required disclaimer text.
- Added pnpm build-script approvals for `sharp` and `unrs-resolver` in `pnpm-workspace.yaml`.

## Files changed

- `.env.example`
- `.gitignore`
- `.prettierignore`
- `README.md`
- `app/globals.css`
- `app/health/route.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `components/.gitkeep`
- `data/.gitkeep`
- `etl/.gitkeep`
- `eslint.config.mjs`
- `lib/site.ts`
- `next-env.d.ts`
- `next.config.ts`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `postcss.config.mjs`
- `scripts/.gitkeep`
- `tests/health.test.ts`
- `tsconfig.json`
- `vitest.config.ts`
- `docs/milestone_reports/M01_repository_scaffold.md`

## Validation

- Command: `pnpm install --config.confirm-modules-purge=false --config.fetch-retries=0`
- Result: pass. Initial sandboxed run failed on npm DNS; rerun with approved network access succeeded.

- Command: `pnpm approve-builds sharp unrs-resolver`
- Result: pass. Added non-interactive build-script approvals for pnpm 11.

- Command: `pnpm peers check`
- Result: pass. No peer dependency issues found after pinning ESLint to 9.39.1.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm test`
- Result: pass. 1 test file, 2 tests passed.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm build`
- Result: pass. Uses `next build --webpack` because this local sandbox blocks Turbopack helper port binding.

- Command: `pnpm dev --hostname 127.0.0.1 --port 3000`
- Result: pass with approved local port binding. Homepage smoke-tested in the in-app browser.

- Command: `curl -sS http://127.0.0.1:3000/health`
- Result: pass. Returned `{"ok":true,"service":"VisaRadar CN","chineseName":"华人职业移民雷达"}`.

## Screenshots / local URLs

- Local homepage URL during smoke test: `http://127.0.0.1:3000`
- Health URL: `http://127.0.0.1:3000/health`
- Browser smoke test confirmed the homepage title, brand text, headline, disclaimer, and health link rendered.

## Decisions made without owner input

- Used current pinned package versions resolved by pnpm: Next.js 16.2.6, React 19.2.6, Tailwind CSS 4.3.0, TypeScript 6.0.3, Vitest 4.1.6.
- Pinned ESLint to 9.39.1 because Next's transitive ESLint plugins do not yet support ESLint 10.
- Used direct Next flat ESLint config import instead of `FlatCompat`, which caused a circular config validation error.
- Set `pnpm build` to `next build --webpack` so the build passes in restricted local/CI-like environments where Turbopack cannot bind helper ports.
- Preserved `AGENTS.md` formatting by excluding it from Prettier.

## Known limitations

- No real official immigration data is ingested yet; this is expected for M01.
- No production database, Supabase project, Vercel deployment, analytics, or domain configuration is connected yet.
- In this Codex sandbox, npm install and local server port binding required explicit approval. The project itself uses normal local commands.
- The temporary dev server was stopped after smoke testing.

## Owner action needed

None.

## Recommended next milestone

M02 — Product information architecture and routes.
