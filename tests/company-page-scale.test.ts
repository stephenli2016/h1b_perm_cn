import { describe, expect, it } from "vitest";

import { createPublicQueryRepository } from "@/lib/db/public-query-repository";
import {
  COMPANY_PAGE_VISIBLE_ROW_BUDGET,
  EXPANDED_COMPANY_PAGE_TARGET,
  INITIAL_COMPANY_PAGE_TARGET,
  inferCompanyDataSourceKind,
  profileCompanyPageSelection,
  selectCompanyPageRoutes,
} from "@/lib/seo/company-page-selection";
import {
  listCompanySitemapPages,
  listSitemapEntries,
  renderSitemapIndex,
} from "@/lib/seo/sitemaps";

import { createM16ScaleFixtureData } from "./fixtures/m16-scale-fixtures";

describe("M16/M17 company page scale selection", () => {
  it("selects 500 high-quality generated fixture pages for local validation", () => {
    const data = createM16ScaleFixtureData(INITIAL_COMPANY_PAGE_TARGET);
    const selected = selectCompanyPageRoutes(data);

    expect(inferCompanyDataSourceKind(data)).toBe("generated_fixture");
    expect(selected).toHaveLength(500);
    expect(selected.every((candidate) => candidate.mode === "h1b")).toBe(true);
    expect(new Set(selected.map((candidate) => candidate.path)).size).toBe(500);
    expect(
      new Set(selected.map((candidate) => candidate.contentFingerprint)).size,
    ).toBe(500);
    expect(selected[0]).toMatchObject({
      rank: 1,
      path: "/h1b/company/m16-validation-employer-001",
      metrics: {
        indexable: true,
        lcaCount5y: 10,
        permCount5y: 2,
      },
    });
    expect(selected.at(-1)).toMatchObject({
      rank: 500,
      path: "/h1b/company/m16-validation-employer-500",
    });
  });

  it("limits route pre-generation and company sitemap to selected pages", () => {
    const data = createM16ScaleFixtureData(INITIAL_COMPANY_PAGE_TARGET + 12);
    const repo = createPublicQueryRepository({
      data,
      cacheEnabled: false,
    });
    const h1bStaticSlugs = repo.listCompanyStaticSlugs(
      "h1b",
      INITIAL_COMPANY_PAGE_TARGET,
    );
    const permStaticSlugs = repo.listCompanyStaticSlugs(
      "perm",
      INITIAL_COMPANY_PAGE_TARGET,
    );
    const companySitemapEntries = listSitemapEntries("company-pages", data, {
      limit: INITIAL_COMPANY_PAGE_TARGET,
    });

    expect(h1bStaticSlugs).toHaveLength(500);
    expect(permStaticSlugs).toHaveLength(0);
    expect(h1bStaticSlugs[0]).toBe("m16-validation-employer-001");
    expect(h1bStaticSlugs).not.toContain("m16-validation-employer-501");
    expect(companySitemapEntries).toHaveLength(500);
    expect(companySitemapEntries[0]).toMatchObject({
      url: "http://localhost:3000/h1b/company/m16-validation-employer-001",
      lastModified: "2026-03-31",
    });
    expect(
      companySitemapEntries.some((entry) =>
        entry.url.includes("m16-validation-employer-501"),
      ),
    ).toBe(false);
  });

  it("profiles 500-page selection within the local performance budget", () => {
    const data = createM16ScaleFixtureData(INITIAL_COMPANY_PAGE_TARGET);
    const profile = profileCompanyPageSelection(data, {
      limit: INITIAL_COMPANY_PAGE_TARGET,
    });

    expect(profile).toMatchObject({
      dataSourceKind: "generated_fixture",
      targetPageCount: 500,
      availableRouteCount: 500,
      selectedRouteCount: 500,
      h1bRouteCount: 500,
      permRouteCount: 0,
      uniqueEmployerCount: 500,
      duplicateContentFingerprintCount: 0,
      lowDataSelectedRouteCount: 0,
      oversizedPageCount: 0,
      buildStrategy: "pre_generate_selected_routes_dynamic_fallback",
      withinBudget: true,
    });
    expect(profile.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(profile.elapsedMs).toBeLessThanOrEqual(profile.budgetMs);
  });

  it("expands selected generated fixture pages to the 2,000-page M17 target", () => {
    const data = createM16ScaleFixtureData(EXPANDED_COMPANY_PAGE_TARGET + 10);
    const repo = createPublicQueryRepository({
      data,
      cacheEnabled: false,
    });
    const selected = selectCompanyPageRoutes(data);
    const h1bStaticSlugs = repo.listCompanyStaticSlugs("h1b");
    const companySitemapEntries = listSitemapEntries("company-pages", data);
    const profile = profileCompanyPageSelection(data);

    expect(selected).toHaveLength(2000);
    expect(h1bStaticSlugs).toHaveLength(2000);
    expect(new Set(h1bStaticSlugs).size).toBe(2000);
    expect(h1bStaticSlugs).toEqual(
      selected.map((candidate) => candidate.employer.slug),
    );
    expect(companySitemapEntries).toHaveLength(2000);
    expect(profile).toMatchObject({
      targetPageCount: 2000,
      availableRouteCount: 2010,
      selectedRouteCount: 2000,
      h1bRouteCount: 2000,
      lowDataSelectedRouteCount: 0,
      oversizedPageCount: 0,
      withinBudget: true,
    });
    expect(profile.maxEstimatedVisibleRows).toBeLessThanOrEqual(
      COMPANY_PAGE_VISIBLE_ROW_BUDGET,
    );
  });

  it("paginates company sitemap chunks for the expanded target", () => {
    const data = createM16ScaleFixtureData(EXPANDED_COMPANY_PAGE_TARGET);
    const sitemapPages = listCompanySitemapPages(data);
    const sitemapIndex = renderSitemapIndex(data);

    expect(sitemapPages).toEqual([
      {
        page: 1,
        path: "/sitemaps/company-pages/1.xml",
        entryCount: 500,
      },
      {
        page: 2,
        path: "/sitemaps/company-pages/2.xml",
        entryCount: 500,
      },
      {
        page: 3,
        path: "/sitemaps/company-pages/3.xml",
        entryCount: 500,
      },
      {
        page: 4,
        path: "/sitemaps/company-pages/4.xml",
        entryCount: 500,
      },
    ]);
    expect(sitemapIndex).toContain("/sitemaps/company-pages/1.xml");
    expect(sitemapIndex).toContain("/sitemaps/company-pages/4.xml");
    expect(listSitemapEntries("company-pages", data, { page: 4 })).toHaveLength(
      500,
    );
    expect(listSitemapEntries("company-pages", data, { page: 5 })).toEqual([]);
  });

  it("keeps low-data generated companies out of expanded selection", () => {
    const data = createM16ScaleFixtureData(EXPANDED_COMPANY_PAGE_TARGET + 25);
    const lowDataEmployerIds = new Set(
      data.employers
        .slice(EXPANDED_COMPANY_PAGE_TARGET)
        .map((employer) => employer.id),
    );
    const mixedData = {
      ...data,
      h1bLcaRecords: data.h1bLcaRecords.filter(
        (record) => !lowDataEmployerIds.has(record.employerId),
      ),
      permRecords: data.permRecords.filter(
        (record) => !lowDataEmployerIds.has(record.employerId),
      ),
    };
    const selected = selectCompanyPageRoutes(mixedData);

    expect(selected).toHaveLength(2000);
    expect(
      selected.some((candidate) =>
        lowDataEmployerIds.has(candidate.employer.id),
      ),
    ).toBe(false);
  });
});
