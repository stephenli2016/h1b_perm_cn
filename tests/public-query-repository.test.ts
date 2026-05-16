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
    expect(result.data.availableFilters.states).toEqual(["CA", "TX", "WA"]);
    expect(result.data.seo.noindex).toBe(true);
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
