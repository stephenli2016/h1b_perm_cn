import { describe, expect, it } from "vitest";

import { footerNavGroups } from "@/lib/site";
import { validateInternalLinkGraph } from "@/lib/seo/internal-link-graph";
import { listSitemapEntries } from "@/lib/seo/sitemaps";
import { buildLaunchReadinessReport } from "@/scripts/launch-readiness";

describe("M28 production launch gate", () => {
  it("generates a launch readiness report with public launch approved and optional warnings separated", () => {
    const report = buildLaunchReadinessReport({
      now: new Date("2026-05-17T00:00:00.000Z"),
    });
    const failed = report.checks.filter((check) => check.status === "fail");
    const blocked = report.checks.filter((check) => check.status === "blocked");
    const warnings = report.checks.filter((check) => check.status === "warn");
    const checksById = new Map(report.checks.map((check) => [check.id, check]));

    expect(report.status).toBe("warn");
    expect(report.technicalReady).toBe(true);
    expect(report.approvalReady).toBe(true);
    expect(report.publicLaunchReady).toBe(true);
    expect(failed).toEqual([]);
    expect(blocked).toEqual([]);
    expect(warnings.map((check) => check.id)).toEqual(
      expect.arrayContaining(["analytics-webmaster", "custom-domain-dns"]),
    );
    expect(checksById.get("production-data")).toMatchObject({
      category: "technical",
      status: "pass",
    });
    expect(checksById.get("deployment-approval")).toMatchObject({
      category: "approval",
      status: "pass",
    });
    expect(checksById.get("legal-approval")).toMatchObject({
      category: "approval",
      status: "pass",
    });
  });

  it("blocks public launch when production data and approval evidence are absent", () => {
    const report = buildLaunchReadinessReport({
      evidence: {
        productionDataVerified: false,
        publicLaunchApproved: false,
        customDomainConnected: false,
      },
      now: new Date("2026-05-17T00:00:00.000Z"),
      runtimeEnv: {},
    });
    const blockedIds = report.checks
      .filter((check) => check.status === "blocked")
      .map((check) => check.id);

    expect(report.status).toBe("blocked");
    expect(report.technicalReady).toBe(false);
    expect(report.approvalReady).toBe(false);
    expect(report.publicLaunchReady).toBe(false);
    expect(blockedIds).toEqual(
      expect.arrayContaining(["production-data", "deployment-approval"]),
    );
  });

  it("keeps sitemap output limited to approved indexable routes", () => {
    const internalLinkReport = validateInternalLinkGraph();

    expect(internalLinkReport.brokenLinks).toEqual([]);
    expect(internalLinkReport.sitemapUrlsWithSearchParams).toEqual([]);
    expect(internalLinkReport.noindexRouteUrlsInSitemaps).toEqual([]);
    expect(
      listSitemapEntries("company-pages").map((entry) => entry.url),
    ).toEqual(["http://localhost:3000/perm/company/brightline-health"]);
  });

  it("keeps required compliance and source pages available through footer groups", () => {
    const footerPaths = footerNavGroups.flatMap((group) =>
      group.links.map((link) => link.path),
    );

    expect(footerPaths).toEqual(
      expect.arrayContaining([
        "/terms",
        "/privacy",
        "/disclaimer",
        "/corrections",
        "/sources",
      ]),
    );
  });
});
