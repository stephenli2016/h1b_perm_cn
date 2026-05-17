# VisaRadar CN / 华人职业移民雷达

Chinese-language decision-support site for overseas Chinese professionals researching U.S. H-1B, PERM, prevailing wage, employer sponsorship history, and China employment-based visa bulletin signals.

## Local Development

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm deploy:validate
pnpm data:update:dry-run
```

## Environment

Copy `.env.example` to `.env.local` when local secrets or platform variables are needed. The M01 scaffold runs without real Supabase, Vercel, analytics, or payment credentials.

## Deployment Prep

M27 Vercel preparation lives in `docs/VERCEL_DEPLOYMENT_M27.md`. Keep
`PRELAUNCH_NOINDEX=true` for Preview/private test deployments and do not connect
production DNS without owner approval.

## Data Freshness Automation

M29 scheduled update automation lives in `docs/SCHEDULED_DATA_UPDATE_M29.md`.
The GitHub Actions workflow runs in dry-run mode only: it reports official-source
freshness and anomalies, then uploads a report artifact without publishing data.
