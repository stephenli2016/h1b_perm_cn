import { describe, expect, it } from "vitest";

import { footerNavGroups } from "@/lib/site";
import { validateInternalLinkGraph } from "@/lib/seo/internal-link-graph";
import { listSitemapEntries } from "@/lib/seo/sitemaps";
import { buildLaunchReadinessReport } from "@/scripts/launch-readiness";

describe("M28 production launch gate", () => {
  it("generates a launch readiness report with public launch blocked", () => {
    const report = buildLaunchReadinessReport({
      now: new Date("2026-05-17T00:00:00.000Z"),
    });
    const failed = report.checks.filter((check) => check.status === "fail");
    const blocked = report.checks.filter((check) => check.status === "blocked");

    expect(report.status).toBe("blocked");
    expect(report.publicLaunchReady).toBe(false);
    expect(failed).toEqual([]);
    expect(blocked.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "production-data",
        "legal-approval",
        "deployment-approval",
      ]),
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
