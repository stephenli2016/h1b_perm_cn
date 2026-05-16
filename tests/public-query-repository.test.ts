import { describe, expect, it } from "vitest";

import { createPublicQueryRepository } from "@/lib/db/public-query-repository";
import type { FixtureData } from "@/lib/db/types";

const emptyFixtureData: FixtureData = {
  employers: [],
  employerAliases: [],
  locations: [],
  sourceFiles: [],
  h1bLcaRecords: [],
  permRecords: [],
  pwdRecords: [],
  uscisH1BEmployerRecords: [],
  visaBulletinMonths: [],
  visaBulletinDates: [],
  companyPageMetrics: [],
  guidePages: [],
  correctionRequests: [],
  etlRuns: [],
};

describe("public query repository", () => {
  it("searches employers with validated input and friendly errors", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.searchEmployers({ query: "acme", limit: 5 });
    const invalid = repo.searchEmployers({ query: "a" });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }
    expect(result.data.results[0]?.employer.slug).toBe("acme-analytics");

    expect(invalid).toMatchObject({
      ok: false,
      error: {
        code: "invalid_input",
        field: "query",
      },
    });
  });

  it("gets employer, H-1B, and PERM summaries by safe slug", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const employer = repo.getEmployerBySlug({ slug: "acme-analytics" });
    const h1b = repo.getH1BSummaryByEmployer({ slug: "acme-analytics" });
    const perm = repo.getPermSummaryByEmployer({ slug: "acme-analytics" });

    expect(employer.ok).toBe(true);
    expect(h1b.ok).toBe(true);
    expect(perm.ok).toBe(true);

    if (!employer.ok || !h1b.ok || !perm.ok) {
      throw new Error("expected summaries to resolve");
    }

    expect(employer.data.displayName).toBe("Acme Analytics");
    expect(h1b.data.h1b).toMatchObject({
      total: 3,
      certified: 2,
      withdrawn: 1,
    });
    expect(h1b.data.interpretationNoteZh).toContain("不代表个案批准");
    expect(perm.data.perm).toMatchObject({
      total: 1,
      certified: 1,
    });
    expect(perm.data.interpretationNoteZh).toContain("不等于 I-140");
  });

  it("rejects malformed slugs before lookup", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.getEmployerBySlug({ slug: "../acme-analytics" });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "invalid_input",
        field: "slug",
      },
    });
  });

  it("returns friendly not-found and empty-data errors", () => {
    const repo = createPublicQueryRepository({
      data: emptyFixtureData,
      cacheEnabled: false,
    });
    const search = repo.searchEmployers({ query: "acme" });
    const employer = repo.getEmployerBySlug({ slug: "acme-analytics" });
    const visa = repo.getVisaBulletinDates();

    expect(search).toMatchObject({
      ok: true,
      data: {
        results: [],
      },
    });
    expect(employer).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
      },
    });
    expect(visa).toMatchObject({
      ok: false,
      error: {
        code: "empty_data",
      },
    });
  });

  it("searches and paginates H-1B disclosure records with filters", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.searchH1BRecords({
      state: "wa",
      page: 2,
      pageSize: 1,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    expect(result.data.filters).toMatchObject({
      state: "WA",
      hasActiveFilters: true,
    });
    expect(result.data.pagination).toMatchObject({
      page: 2,
      pageSize: 1,
      totalResults: 2,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false,
    });
    expect(result.data.records).toHaveLength(1);
    expect(result.data.records[0]?.employer.slug).toBe("acme-analytics");
    expect(result.data.availableFilters.states).toEqual([
      "CA",
      "NY",
      "TX",
      "WA",
    ]);
    expect(result.data.seo.noindex).toBe(true);
  });

  it("builds company profiles for five fixture companies with varied data shapes", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const slugs = repo.listCompanySlugs();

    expect(slugs).toEqual([
      "acme-analytics",
      "brightline-health",
      "cedar-fintech-labs",
      "lakeside-robotics",
      "northstar-cloud",
    ]);

    for (const slug of slugs) {
      const result = repo.getCompanyProfileBySlug({ slug });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error(result.error.messageZh);
      }
      expect(result.data.employer.slug).toBe(slug);
      expect(result.data.fiscalYears.length).toBeGreaterThan(0);
      expect(result.data.interpretationNoteZh).toContain("不代表个案批准");
    }

    const permOnly = repo.getCompanyProfileBySlug({
      slug: "brightline-health",
    });
    const h1bOnly = repo.getCompanyProfileBySlug({
      slug: "cedar-fintech-labs",
    });

    expect(permOnly.ok).toBe(true);
    expect(h1bOnly.ok).toBe(true);

    if (!permOnly.ok || !h1bOnly.ok) {
      throw new Error("expected varied fixture profiles to resolve");
    }

    expect(permOnly.data.h1b.total).toBe(0);
    expect(permOnly.data.perm.total).toBe(3);
    expect(permOnly.data.seo).toMatchObject({
      indexable: true,
      noindex: false,
      matchedThresholds: ["recent_perm_count_3"],
    });
    expect(permOnly.data.wageDistribution).toBeUndefined();
    expect(permOnly.data.permTimeline.map((row) => row.caseStatus)).toEqual([
      "Certified",
      "Withdrawn",
      "Certified",
    ]);

    expect(h1bOnly.data.h1b.total).toBe(2);
    expect(h1bOnly.data.perm.total).toBe(0);
    expect(h1bOnly.data.seo.noindex).toBe(true);
    expect(h1bOnly.data.h1bRecentRecords).toHaveLength(2);
    expect(h1bOnly.data.permTimeline).toHaveLength(0);
  });

  it("searches PERM disclosure records by job/SOC and status", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.searchPermRecords({
      caseStatus: "certified",
      jobOrSoc: "17-2141",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    expect(result.data.pagination.totalResults).toBe(1);
    expect(result.data.records[0]).toMatchObject({
      caseStatus: "Certified",
      socCode: "17-2141",
      employer: {
        slug: "lakeside-robotics",
      },
    });
    expect(result.data.interpretationNoteZh).toContain("不等于 I-140");
  });

  it("searches the combined company directory", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.searchCompanyDirectory({
      employer: "cloud",
      jobOrSoc: "15-1252",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    expect(result.data.pagination.totalResults).toBe(1);
    expect(result.data.results[0]).toMatchObject({
      employer: {
        slug: "northstar-cloud",
      },
      h1bRecordCount: 1,
      permRecordCount: 1,
      matchedRecordCount: 2,
    });
    expect(result.data.results[0]?.topLocations[0]).toEqual({
      value: "Austin, TX",
      count: 2,
    });
  });

  it("rejects invalid directory filters with friendly errors", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const invalidState = repo.searchH1BRecords({ state: "Washington" });
    const invalidStatus = repo.searchPermRecords({ caseStatus: "APPROVED" });
    const invalidPage = repo.searchCompanyDirectory({ page: 0 });

    expect(invalidState).toMatchObject({
      ok: false,
      error: {
        code: "invalid_input",
        field: "state",
      },
    });
    expect(invalidStatus).toMatchObject({
      ok: false,
      error: {
        code: "invalid_input",
        field: "caseStatus",
      },
    });
    expect(invalidPage).toMatchObject({
      ok: false,
      error: {
        code: "invalid_input",
        field: "page",
      },
    });
  });

  it("returns wage distribution by employer, job, and location filters", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.getWageDistribution({
      employerSlug: "acme-analytics",
      city: "Seattle",
      state: "WA",
      socCode: "15-1252",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    expect(result.data).toMatchObject({
      count: 1,
      wageUnit: "Year",
      min: 142000,
      median: 142000,
      max: 142000,
      fiscalYears: [2025],
    });
    expect(result.data.sampleWarningZh).toContain("样本少于 3 条");
    expect(result.data.jobTitles[0]).toEqual({
      value: "Software Engineer",
      count: 1,
    });
  });

  it("checks H-1B wage level against matched PWD fixture records", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.checkH1BWageLevel({
      socOrJobTitle: "15-1252",
      city: "Seattle",
      state: "WA",
      offeredWage: 119600,
      wageYear: 2025,
      wageUnit: "Year",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    expect(result.data.resolvedSoc).toMatchObject({
      socCode: "15-1252",
      matchMethod: "soc_code",
    });
    expect(result.data.lookupStatus).toBe("matched");
    expect(result.data.matchScope).toBe("city_state");
    expect(result.data.comparison).toMatchObject({
      band: "level_2_to_3",
      lowerLevel: 2,
      nextLevel: 3,
    });
    expect(result.data.wageRecord?.levels).toHaveLength(4);
    expect(result.data.sourceNames).toContain("DOL FLAG wage data fixture");
    expect(result.data.interpretationNoteZh).toContain("不构成法律");
  });

  it("resolves job title keywords and can match metro-area wage rows", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.checkH1BWageLevel({
      socOrJobTitle: "Software Engineer",
      city: "Bellevue",
      state: "WA",
      offeredWage: 90000,
      wageYear: 2025,
      wageUnit: "Year",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    expect(result.data.resolvedSoc).toMatchObject({
      socCode: "15-1252",
      matchMethod: "h1b_job_title",
    });
    expect(result.data.matchScope).toBe("area_name");
    expect(result.data.comparison?.band).toBe("below_level_1");
    expect(result.data.comparison?.messageZh).toContain("不是个案法律结论");
  });

  it("converts annual wage inputs when the PWD record is hourly", () => {
    const hourlyFixtureData: FixtureData = {
      ...emptyFixtureData,
      sourceFiles: [
        {
          id: "source-hourly-pwd",
          sourceName: "DOL FLAG hourly wage fixture",
          officialUrl: "https://flag.dol.gov/wage-data",
          fiscalYear: 2026,
          fileType: "csv",
          latestDataDate: "2026-07-01",
        },
      ],
      pwdRecords: [
        {
          id: "pwd-worcester-15-2051-2026",
          sourceFileId: "source-hourly-pwd",
          locationId: "loc-worcester-ma",
          sourceRecordId: "fixture-hourly-001",
          sourceRecordFingerprint: "fixture-hourly-001",
          dataSeries: "DOL FLAG OFLC Wage Data Downloads",
          effectiveYear: 2026,
          socCode: "15-2051",
          socTitle: "Data Scientists",
          areaName: "Worcester MA-CT",
          city: "Worcester",
          state: "MA",
          wageLevel1: 43.25,
          wageLevel2: 54.4,
          wageLevel3: 65.55,
          wageLevel4: 76.7,
          wageUnit: "Hour",
        },
      ],
    };
    const repo = createPublicQueryRepository({
      data: hourlyFixtureData,
      cacheEnabled: false,
    });
    const result = repo.checkH1BWageLevel({
      socOrJobTitle: "15-2051",
      city: "Worcester",
      state: "MA",
      offeredWage: 120000,
      wageYear: 2026,
      wageUnit: "Year",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    expect(result.data.unitConversion).toMatchObject({
      originalUnit: "Year",
      comparisonUnit: "Hour",
    });
    expect(result.data.comparison?.offeredWageForComparison).toBeCloseTo(
      57.69,
      2,
    );
    expect(result.data.comparison?.band).toBe("level_2_to_3");
  });

  it("rejects invalid wage-level checker inputs with friendly errors", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const invalid = repo.checkH1BWageLevel({
      socOrJobTitle: "S",
      state: "Washington",
      offeredWage: -1,
      wageYear: 2025,
    });

    expect(invalid).toMatchObject({
      ok: false,
      error: {
        code: "invalid_input",
        field: "socOrJobTitle",
      },
    });
  });

  it("returns related employers, job titles, and locations", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.getRelatedEntities({ slug: "acme-analytics" });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    expect(result.data.relatedEmployers[0]?.employer.slug).toBe(
      "northstar-cloud",
    );
    expect(result.data.relatedEmployers[0]?.sharedSignals).toEqual(
      expect.arrayContaining(["SOC: 15-1252", "地点: Austin, TX"]),
    );
    expect(result.data.relatedJobTitles[0]).toEqual({
      value: "Software Engineer",
      count: 2,
    });
    expect(result.data.relatedLocations[0]).toEqual({
      value: "Seattle, WA",
      count: 3,
    });
  });

  it("returns latest and filtered visa bulletin rows", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const latest = repo.getVisaBulletinDates();
    const filtered = repo.getVisaBulletinDates({
      monthKey: "2026-06",
      category: "EB-3",
    });

    expect(latest.ok).toBe(true);
    expect(filtered.ok).toBe(true);
    if (!latest.ok || !filtered.ok) {
      throw new Error("expected visa bulletin data");
    }

    expect(latest.data.month.monthKey).toBe("2026-06");
    expect(latest.data.rows).toHaveLength(3);
    expect(filtered.data.rows).toHaveLength(1);
    expect(filtered.data.rows[0]?.finalAction?.cutoffDate).toBe("2021-08-01");
    expect(filtered.data.interpretationNoteZh).toContain("USCIS 当月选择");
  });

  it("tracks cache hits and misses within a repository instance", () => {
    let now = 1000;
    const repo = createPublicQueryRepository({
      cacheTtlMs: 100,
      now: () => now,
    });

    expect(repo.cacheStats()).toMatchObject({ hits: 0, misses: 0, size: 0 });

    const first = repo.getEmployerBySlug({ slug: "acme-analytics" });
    const second = repo.getEmployerBySlug({ slug: "acme-analytics" });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(repo.cacheStats()).toMatchObject({ hits: 1, misses: 1, size: 1 });

    now = 1201;
    repo.getEmployerBySlug({ slug: "acme-analytics" });
    expect(repo.cacheStats()).toMatchObject({ hits: 1, misses: 2, size: 1 });

    repo.clearCache();
    expect(repo.cacheStats()).toMatchObject({ hits: 0, misses: 0, size: 0 });
  });
});
