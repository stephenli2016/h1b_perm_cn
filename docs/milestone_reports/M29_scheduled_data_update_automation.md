# Milestone M29 Report — Scheduled Data Update Automation

## Status

Completed

## Built

- Added a dry-run GitHub Actions workflow for scheduled official-data freshness checks.
- Added a local scheduled data update CLI that generates Markdown/JSON reports, supports GitHub step summaries, and keeps suspicious data changes in report-only mode.
- Added anomaly checks for source manifest coverage, official-source host allowlist, DOL OFLC disclosure coverage, Visa Bulletin freshness, USCIS filing chart freshness, missing production downloads, no-auto-publish policy, and notification placeholder coverage.
- Added tests for the dry-run report, workflow safety boundaries, package command, and M29 documentation.
- Documented the automation policy, local commands, GitHub Actions behavior, and future notification secret placeholder.

## Files changed

- `.github/workflows/data-update-dry-run.yml`
- `README.md`
- `docs/ETL.md`
- `docs/SCHEDULED_DATA_UPDATE_M29.md`
- `docs/milestone_reports/M29_scheduled_data_update_automation.md`
- `package.json`
- `scripts/scheduled-data-update.ts`
- `tests/scheduled-data-update.test.ts`

## Validation

- Command: `pnpm data:update:dry-run`
- Result: pass; generated the dry-run report with status `warn` because 15 production download files are absent locally, which is expected before production import.

- Command: `pnpm data:update:dry-run -- --output /private/tmp/visaradar-m29-data-update-dry-run.md`
- Result: pass; wrote a Markdown freshness report for local review.

- Command: `pnpm test tests/scheduled-data-update.test.ts`
- Result: pass; 1 file, 4 tests.

- Command: `pnpm typecheck`
- Result: pass.

- Command: `pnpm format`
- Result: pass.

- Command: `pnpm lint`
- Result: pass.

- Command: `pnpm test`
- Result: pass; 19 files, 118 tests.

- Command: `pnpm etl:validate`
- Result: pass; manifest has 15 official-source entries.

- Command: `pnpm etl:test`
- Result: pass; 46 Python ETL tests.

- Command: `pnpm data:freshness`
- Result: pass; required fixtures present, with local-mode warning for absent production downloads.

- Command: `pnpm build`
- Result: pass.

- Command: `pnpm db:validate`
- Result: pass; 2 files, 18 tests.

- Command: `pnpm db:production:validate`
- Result: pass.

- Command: `pnpm seo:audit`
- Result: pass; 4 files, 28 tests.

- Command: `git diff --check`
- Result: pass.

## Screenshots / local URLs

- Not applicable. M29 is a scheduled automation and CLI/reporting milestone.

## Decisions made without owner input

- Used GitHub Actions instead of Vercel Cron because the repo already has source, ETL, tests, and artifact generation in one place.
- Kept the workflow strictly dry-run/report-only: it does not commit, push, deploy, import production data, change sitemap output, or change indexability.
- Enabled optional official URL probes only in the GitHub workflow; local dry-runs skip network probes by default.
- Added a notification placeholder instead of requiring a Slack/email/webhook secret during this milestone.

## Known limitations

- The GitHub Actions workflow has been added locally and will run after push; it has not yet executed on GitHub in this local validation.
- Local validation did not run `--network` official URL probes because the milestone can be completed with local dry-run mode and the workflow enables probes in GitHub Actions.
- Real failure notifications are not active until the owner provides a destination and repository secret.
- Production data is still not imported or published; M29 only monitors and reports freshness/anomalies.

## Owner action needed

- None for M29.
- Later, provide a Slack/email/webhook destination secret such as `DATA_UPDATE_NOTIFICATION_WEBHOOK` if real failure notifications are desired.

## Recommended next milestone

M30 — Email alerts / newsletter waitlist
