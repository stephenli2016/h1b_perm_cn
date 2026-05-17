# Scheduled Data Update Automation — M29

Milestone: M29 — Scheduled data update automation

M29 adds a dry-run GitHub Actions workflow and local CLI for monitoring official
data freshness. It does not import production data, commit generated records,
publish pages, deploy the site, or change indexing.

## Files

- `.github/workflows/data-update-dry-run.yml`
- `scripts/scheduled-data-update.ts`
- `tests/scheduled-data-update.test.ts`

## Commands

Run locally:

```bash
pnpm data:update:dry-run
```

Generate a local report file:

```bash
pnpm data:update:dry-run -- --output /tmp/visaradar-data-update-dry-run.md
```

Enable URL probes when network is available:

```bash
pnpm data:update:dry-run -- --network
```

Warnings do not fail the command. Failures do.

## GitHub Actions

Workflow: `Data update dry run`

Triggers:

- weekly schedule: Tuesday at 14:17 UTC
- manual `workflow_dispatch`

The workflow:

1. Installs dependencies with the pinned pnpm version.
2. Runs `pnpm etl:validate`.
3. Runs `pnpm data:update:dry-run -- --network --github-summary --output artifacts/data-update-dry-run.md`.
4. Runs `pnpm etl:test`.
5. Runs `pnpm data:freshness`.
6. Uploads `artifacts/data-update-dry-run.md` as a workflow artifact.
7. Emits a failure notification placeholder notice.

## What The Dry Run Checks

- Source manifest validity and required fixture coverage.
- Official-source host allowlist.
- DOL OFLC LCA/PERM/PWD disclosure release coverage.
- Visa Bulletin monthly fixture coverage.
- USCIS filing chart monthly fixture coverage.
- Missing production download files.
- Optional official URL reachability probes when `--network` is enabled.
- Dry-run/no-auto-publish policy.
- Failure-notification placeholder presence.

## Anomaly Policy

Status levels:

- `pass`: no action needed.
- `warn`: review needed, but the workflow can continue. Examples: production
  downloads absent locally or official URL probe warnings.
- `fail`: stop the workflow. Examples: missing required fixtures or disallowed
  source hosts.

The dry-run report never creates PRs, commits generated files, imports data into
Supabase, changes sitemap/indexability, or deploys the app.

## Failure Notification Placeholder

The workflow currently emits a GitHub Actions notice on failure:

```text
Configure a future Slack/email webhook secret to notify the owner when scheduled data dry runs fail.
```

When the owner provides a notification destination, add a provider-specific step
using a repository secret such as `DATA_UPDATE_NOTIFICATION_WEBHOOK`. Do not
commit webhook URLs.

## Owner Action Needed

None for M29.

Later owner action is needed only if real notifications are desired.
