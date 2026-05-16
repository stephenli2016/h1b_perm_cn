# CODEX_OWNER_PROMPTS.md — Prompts for Running This Project in Codex Mac

Use these prompts in the Codex Mac app or Codex CLI from the repository root.

## 1. First run in a new empty folder

Paste this to Codex:

```text
Read AGENTS.md and all files in docs/. Start Milestone M01 from docs/CODEX_MILESTONE_PLAN.md. Work autonomously until the milestone is complete. Do not ask clarifying questions during the milestone unless AGENTS.md requires owner input. Use local placeholders for missing secrets. At the end, create the milestone report and ask me whether to continue.
```

## 2. Continue after approving a milestone

```text
Continue to the next milestone recommended in the latest docs/milestone_reports/ report. Follow AGENTS.md and docs/CODEX_MILESTONE_PLAN.md. Work autonomously until the milestone is complete, then stop with a milestone report.
```

## 3. Resume after interruption

```text
Inspect the repository, read AGENTS.md, docs/CODEX_MILESTONE_PLAN.md, and the latest docs/milestone_reports/ file. Determine the current milestone and finish it. Do not redo completed work unless necessary. Stop with an updated milestone report.
```

## 4. When Codex asks for keys

Provide only the needed value and say:

```text
Use this key only in the local environment or platform secret store. Do not commit it. Update .env.example with the variable name only, then continue the current milestone.
```

## 5. Before production launch

```text
Run the production readiness checklist. Verify no secrets are committed, all legal disclaimers are present, low-quality pages are noindex, sitemap includes only indexable pages, and the build passes. Stop before DNS or production deploy changes unless I approve.
```

## 6. If Codex gets stuck

```text
Create a concise unblock report: what failed, what you tried, exact error messages, likely cause, and the smallest owner action needed. If a local mock can unblock work, implement the mock and continue.
```
