import { describe, expect, it } from "vitest";

import {
  calculateCompanyPageMetrics,
  findPrevailingWage,
  checkVisaBulletinPriorityDate,
  getCompanyIndexabilityDecision,
  getEmployerBySlug,
  getEmployerImmigrationSummary,
  getLatestVisaBulletinMonth,
  getLocalFixtureData,
  getVisaBulletinCutoff,
  listVisaBulletinRows,
  listIndexableCompanyCandidates,
  listPriorityGuidePages,
  listTopCompanyCandidates,
  lookupPrevailingWage,
  matchWageAmountToLevels,
  normalizeEmployerName,
  resolveEmployerAlias,
  searchEmployers,
  summarizeUscisH1BEmployerData,
} from "@/lib/db/local-repository";

describe("local fixture repository", () => {
  it("normalizes employer names for deterministic matching", () => {
    expect(normalizeEmployerName("ACME ANALYTICS, LLC")).toBe("acme analytics");
    expect(normalizeEmployerName("The Acme Analytics, L.L.C.")).toBe(
      "acme analytics",
    );
    expect(normalizeEmployerName("Northstar Cloud Inc.")).toBe(
      "northstar cloud",
    );
    expect(normalizeEmployerName("AT&T Services Incorporated")).toBe(
      "at and t services",
    );
  });

  it("resolves aliases audibly without fuzzy low-confidence merges", () => {
    const aliasMatch = resolveEmployerAlias("ACME ANALYTICS, LLC");
    const variantMatch = resolveEmployerAlias("Acme Analytics L.L.C.");
    const unmatched = resolveEmployerAlias("Acme Analytics Holdings LLC");

    expect(aliasMatch).toMatchObject({
      matchMethod: "alias",
      confidenceScore: 0.98,
      reviewStatus: "auto",
    });
    expect(aliasMatch.employer?.slug).toBe("acme-analytics");
    expect(variantMatch).toMatchObject({
      matchMethod: "alias",
      confidenceScore: 0.98,
      reviewStatus: "auto",
    });
    expect(unmatched).toMatchObject({
      matchMethod: "unmatched",
      confidenceScore: 0,
      reviewStatus: "unmatched",
    });
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

  it("summarizes USCIS H-1B Employer Data Hub records by employer and fiscal year", () => {
    const summaries = summarizeUscisH1BEmployerData({
      employerName: "Acme Analytics, LLC",
      fiscalYear: 2025,
    });

    expect(summaries).toEqual([
      {
        fiscalYear: 2025,
        totalRecords: 1,
        initialApprovals: 2,
        initialDenials: 0,
        continuingApprovals: 3,
        continuingDenials: 0,
        initialDecisions: 2,
        continuingDecisions: 3,
        firstDecisions: 5,
        cities: ["Seattle"],
        states: ["WA"],
        naicsCodes: ["541511"],
      },
    ]);

    expect(
      summarizeUscisH1BEmployerData({ employerId: "emp-northstar" })[0],
    ).toMatchObject({
      fiscalYear: 2025,
      firstDecisions: 3,
      naicsCodes: ["541512"],
    });
  });

  it("looks up local prevailing wage fixtures by SOC and location", () => {
    const lookup = lookupPrevailingWage({
      socCode: "15-1252",
      city: "Seattle",
      state: "WA",
      effectiveYear: 2025,
    });

    expect(lookup).toMatchObject({
      status: "matched",
      matchScope: "city_state",
    });
    expect(lookup.record).toMatchObject({
      socCode: "15-1252",
      city: "Seattle",
      state: "WA",
      wageLevel2: 108900,
      wageUnit: "Year",
    });
    expect(
      findPrevailingWage({
        socCode: "15-1252",
        city: "Seattle",
        state: "WA",
        effectiveYear: 2025,
      })?.id,
    ).toBe("pwd-seattle-15-1252-2025");
  });

  it("falls back from exact city to area and statewide wage records", () => {
    const areaLookup = lookupPrevailingWage({
      socCode: "15-1252",
      city: "Bellevue",
      state: "WA",
      effectiveYear: 2025,
    });
    const statewideLookup = lookupPrevailingWage({
      socCode: "15-1252",
      city: "Spokane",
      state: "WA",
      effectiveYear: 2025,
    });
    const missingLookup = lookupPrevailingWage({
      socCode: "99-9999",
      city: "Seattle",
      state: "WA",
      effectiveYear: 2025,
    });

    expect(areaLookup).toMatchObject({
      status: "matched",
      matchScope: "area_name",
    });
    expect(areaLookup.record?.id).toBe("pwd-seattle-15-1252-2025");
    expect(statewideLookup).toMatchObject({
      status: "fallback",
      matchScope: "state",
    });
    expect(statewideLookup.record?.id).toBe("pwd-wa-statewide-15-1252-2025");
    expect(missingLookup).toMatchObject({
      status: "not_found",
    });
  });

  it("matches a wage amount to PWD levels without treating it as an approval odds metric", () => {
    const wage = findPrevailingWage({
      socCode: "15-1252",
      city: "Seattle",
      state: "WA",
      effectiveYear: 2025,
    });

    expect(wage).toBeDefined();
    expect(matchWageAmountToLevels(wage!, 119600)).toMatchObject({
      band: "level_2_to_3",
      lowerLevel: 2,
      nextLevel: 3,
    });
    expect(matchWageAmountToLevels(wage!, 70000)).toMatchObject({
      band: "below_level_1",
      nextLevel: 1,
    });
  });

  it("looks up visa bulletin fixture dates", () => {
    const cutoff = getVisaBulletinCutoff({
      monthKey: "2026-05",
      category: "EB-2",
      chargeabilityArea: "china-mainland",
      chartType: "final_action",
    });

    expect(cutoff?.month.uscisFilingChart).toBe("final_action");
    expect(cutoff?.date).toMatchObject({
      cutoffDate: "2021-09-01",
      cutoffStatus: "date",
      rawValue: "01SEP21",
    });
  });

  it("lists latest China EB visa bulletin rows and checks priority dates", () => {
    const latest = getLatestVisaBulletinMonth();
    const rows = listVisaBulletinRows("2026-06");
    const current = checkVisaBulletinPriorityDate({
      monthKey: "2026-06",
      category: "EB-3",
      chargeabilityArea: "china-mainland",
      chartType: "final_action",
      priorityDate: "2021-07-31",
    });
    const notCurrent = checkVisaBulletinPriorityDate({
      monthKey: "2026-06",
      category: "EB-3",
      chargeabilityArea: "china-mainland",
      chartType: "final_action",
      priorityDate: "2021-08-01",
    });

    expect(latest?.monthKey).toBe("2026-06");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      category: "EB-1",
      finalAction: { cutoffDate: "2023-04-01" },
      datesForFiling: { cutoffDate: "2023-12-01" },
    });
    expect(current).toMatchObject({
      status: "current",
      canProceedByChart: true,
    });
    expect(notCurrent).toMatchObject({
      status: "not_current",
      canProceedByChart: false,
    });
  });

  it("keeps fixture company pages out of indexable launch candidates", () => {
    expect(listIndexableCompanyCandidates()).toEqual([]);
    expect(getEmployerBySlug("missing-employer")).toBeUndefined();
  });

  it("generates ranked top-company candidates from fixture records", () => {
    const candidates = listTopCompanyCandidates();

    expect(candidates.map((candidate) => candidate.employer.slug)).toEqual([
      "acme-analytics",
      "northstar-cloud",
      "brightline-health",
      "lakeside-robotics",
      "cedar-fintech-labs",
    ]);
    expect(candidates[0]).toMatchObject({
      rank: 1,
      aliasCount: 2,
      metrics: {
        lcaCount5y: 3,
        permCount5y: 1,
        uscisRecordCount5y: 1,
        jobTitleCount: 3,
        locationCount: 2,
        indexable: false,
      },
    });
    expect(candidates[0]?.metrics.noindexReason).toContain(
      "Does not meet initial data threshold",
    );
  });

  it("marks company candidates indexable only after data thresholds are met", () => {
    const data = getLocalFixtureData();
    const baseRecord = data.h1bLcaRecords[0]!;
    const boostedData = {
      ...data,
      h1bLcaRecords: [
        ...data.h1bLcaRecords,
        ...Array.from({ length: 7 }, (_, index) => ({
          ...baseRecord,
          id: `lca-acme-extra-${index}`,
          sourceRecordId: `fixture-lca-extra-${index}`,
          sourceRecordFingerprint: `fixture-lca-extra-${index}`,
          jobTitle: index % 2 === 0 ? "Software Engineer" : "Data Engineer",
          worksiteCity: index % 2 === 0 ? "Seattle" : "Austin",
          worksiteState: index % 2 === 0 ? "WA" : "TX",
        })),
      ],
    };
    const metrics = calculateCompanyPageMetrics(boostedData).find(
      (candidate) => candidate.employerId === "emp-acme",
    );

    expect(metrics).toMatchObject({
      lcaCount5y: 10,
      indexable: true,
      noindexReason: undefined,
    });
    expect(getCompanyIndexabilityDecision(metrics!)).toMatchObject({
      indexable: true,
      matchedThresholds: ["recent_lca_count_10"],
    });
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
