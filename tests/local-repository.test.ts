import { describe, expect, it } from "vitest";

import {
  findPrevailingWage,
  getEmployerBySlug,
  getEmployerImmigrationSummary,
  getLocalFixtureData,
  getVisaBulletinCutoff,
  listIndexableCompanyCandidates,
  listPriorityGuidePages,
  normalizeEmployerName,
  searchEmployers,
} from "@/lib/db/local-repository";

describe("local fixture repository", () => {
  it("normalizes employer names for deterministic matching", () => {
    expect(normalizeEmployerName("ACME ANALYTICS, LLC")).toBe("acme analytics");
    expect(normalizeEmployerName("Northstar Cloud Inc.")).toBe(
      "northstar cloud",
    );
  });

  it("searches canonical names and aliases", () => {
    const results = searchEmployers("ACME Analytics LLC");

    expect(results).toHaveLength(1);
    expect(results[0]?.employer.slug).toBe("acme-analytics");
    expect(results[0]?.matchedAliases).toContain("ACME ANALYTICS, LLC");
  });

  it("returns employer summaries from H-1B, PERM, and USCIS fixtures", () => {
    const summary = getEmployerImmigrationSummary("acme-analytics");

    expect(summary?.employer.displayName).toBe("Acme Analytics");
    expect(summary?.h1b).toMatchObject({
      total: 3,
      certified: 2,
      withdrawn: 1,
      denied: 0,
      fiscalYears: [2025],
    });
    expect(summary?.perm).toMatchObject({
      total: 1,
      certified: 1,
      denied: 0,
    });
    expect(summary?.uscis).toMatchObject({
      totalRecords: 1,
      initialApprovals: 2,
      continuingApprovals: 3,
    });
    expect(summary?.topJobTitles[0]?.jobTitle).toBe("Software Engineer");
    expect(summary?.topLocations[0]?.location).toBe("Seattle, WA");
    expect(summary?.latestDataDate).toBe("2025-09-30");
  });

  it("looks up local prevailing wage fixtures by SOC and location", () => {
    const wage = findPrevailingWage({
      socCode: "15-1252",
      city: "Seattle",
      state: "WA",
      effectiveYear: 2025,
    });

    expect(wage).toMatchObject({
      socCode: "15-1252",
      city: "Seattle",
      state: "WA",
      wageLevel2: 108900,
      wageUnit: "Year",
    });
  });

  it("looks up visa bulletin fixture dates", () => {
    const cutoff = getVisaBulletinCutoff({
      monthKey: "2026-05",
      category: "EB-2",
      chargeabilityArea: "china-mainland",
      chartType: "dates_for_filing",
    });

    expect(cutoff?.month.uscisFilingChart).toBe("dates_for_filing");
    expect(cutoff?.date).toMatchObject({
      cutoffDate: "2021-04-01",
      cutoffStatus: "date",
      rawValue: "01APR21",
    });
  });

  it("keeps fixture company pages out of indexable launch candidates", () => {
    expect(listIndexableCompanyCandidates()).toEqual([]);
    expect(getEmployerBySlug("missing-employer")).toBeUndefined();
  });

  it("exposes priority guide fixtures for content planning", () => {
    const priorityGuides = listPriorityGuidePages(1);

    expect(priorityGuides.map((guide) => guide.slug)).toEqual(
      expect.arrayContaining([
        "what-is-lca-chinese",
        "perm-explained-chinese",
        "visa-bulletin-explained-chinese",
      ]),
    );
  });

  it("includes fixture rows for every M03 data family", () => {
    const data = getLocalFixtureData();

    expect(data.employers.length).toBeGreaterThan(0);
    expect(data.h1bLcaRecords.length).toBeGreaterThan(0);
    expect(data.permRecords.length).toBeGreaterThan(0);
    expect(data.pwdRecords.length).toBeGreaterThan(0);
    expect(data.uscisH1BEmployerRecords.length).toBeGreaterThan(0);
    expect(data.visaBulletinDates.length).toBeGreaterThan(0);
    expect(data.companyPageMetrics.length).toBeGreaterThan(0);
    expect(data.guidePages.length).toBeGreaterThan(0);
    expect(data.correctionRequests.length).toBeGreaterThan(0);
    expect(data.etlRuns.length).toBeGreaterThan(0);
  });
});
