import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildScheduledDataUpdateReport,
  renderScheduledDataUpdateReport,
} from "@/scripts/scheduled-data-update";

describe("M29 scheduled data update automation", () => {
  it("builds a dry-run freshness report without publishing data", async () => {
    const report = await buildScheduledDataUpdateReport({
      networkChecks: false,
      now: new Date("2026-05-17T00:00:00.000Z"),
    });
    const checkById = new Map(report.checks.map((check) => [check.id, check]));

    expect(report.dryRun).toBe(true);
    expect(report.autoPublish).toBe(false);
    expect(["pass", "warn"]).toContain(report.status);
    expect(report.anomalyCount).toBeGreaterThanOrEqual(0);
    expect(checkById.get("manifest")).toMatchObject({ status: "pass" });
    expect(checkById.get("official-hosts")).toMatchObject({ status: "pass" });
    expect(checkById.get("oflc-disclosures")).toMatchObject({
      status: "pass",
    });
    expect(checkById.get("visa-bulletin")).toMatchObject({ status: "pass" });
    expect(checkById.get("uscis-filing-chart")).toMatchObject({
      status: "pass",
    });
    expect(["pass", "warn"]).toContain(
      checkById.get("production-downloads")?.status,
    );
    expect(checkById.get("auto-publish")).toMatchObject({ status: "pass" });
  });

  it("renders a Markdown report suitable for GitHub summary artifacts", async () => {
    const report = await buildScheduledDataUpdateReport({
      networkChecks: false,
      now: new Date("2026-05-17T00:00:00.000Z"),
    });
    const rendered = renderScheduledDataUpdateReport(report);

    expect(rendered).toContain("# Scheduled Data Update Dry Run");
    expect(rendered).toContain("DOL OFLC disclosure release coverage");
    expect(rendered).toContain("Visa Bulletin monthly update coverage");
    expect(rendered).toContain("Auto publish: no");
    expect(rendered).toContain("Warnings flag data gaps");
  });

  it("adds a GitHub Actions dry-run workflow with artifact and notification placeholder", () => {
    const workflowPath = join(
      process.cwd(),
      ".github/workflows/data-update-dry-run.yml",
    );
    const workflow = readFileSync(workflowPath, "utf8");

    expect(existsSync(workflowPath)).toBe(true);
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("cron:");
    expect(workflow).toContain("pnpm data:update:dry-run");
    expect(workflow).toContain("artifacts/data-update-dry-run.md");
    expect(workflow).toContain("actions/upload-artifact@v4");
    expect(workflow).toContain("Failure notification placeholder");
    expect(workflow).not.toContain("git push");
    expect(workflow).not.toContain("vercel --prod");
  });

  it("documents dry-run policy and exposes package command", () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const docs = readFileSync(
      join(process.cwd(), "docs/SCHEDULED_DATA_UPDATE_M29.md"),
      "utf8",
    );

    expect(packageJson.scripts["data:update:dry-run"]).toBe(
      "node --no-warnings --experimental-strip-types scripts/scheduled-data-update.ts --dry-run",
    );
    expect(docs).toContain("dry-run GitHub Actions workflow");
    expect(docs).toContain("never creates PRs");
    expect(docs).toContain("DATA_UPDATE_NOTIFICATION_WEBHOOK");
  });
});
