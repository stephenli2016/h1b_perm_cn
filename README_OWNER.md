# README_OWNER.md — How to Use This Codex Project Pack

This folder contains project instructions for building a Chinese H-1B/PERM/green-card decision-support SEO site with Codex Mac.

## Files

- `AGENTS.md` — put this in the repository root. Codex reads this automatically as project guidance.
- `docs/CODEX_MILESTONE_PLAN.md` — milestone-by-milestone product build plan.
- `docs/DATA_AND_SEO_POLICY.md` — official data, SEO, privacy, and compliance rules.
- `docs/CONTENT_GUIDE_50_TOPICS.md` — the 50 high-value tool/guide pages.
- `docs/CODEX_OWNER_PROMPTS.md` — prompts to paste into Codex.

## How to start

1. Create an empty project folder on your Mac.
2. Copy all files from this package into that folder.
3. Open the folder in Codex Mac.
4. Paste the first-run prompt from `docs/CODEX_OWNER_PROMPTS.md`.
5. Let Codex work until it finishes a milestone.
6. Review the milestone report and say “continue” when ready.

## Owner actions Codex may request later

- Supabase project/database keys.
- Vercel account/project connection.
- Domain and DNS approval.
- Analytics/Search Console verification.
- Legal/disclaimer approval before production launch.
- Stripe/payment keys only if paid reports are enabled.

Codex should not ask you for minor decisions during milestones.

## Vercel preview note

M27 adds Vercel preparation only. Preview or private production tests should keep
`PRELAUNCH_NOINDEX=true`. Public production deployment, custom domain
connection, DNS changes, and switching `PRELAUNCH_NOINDEX=false` require owner
approval in the launch gate.
