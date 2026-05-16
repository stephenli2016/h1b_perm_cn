import { describe, expect, it } from "vitest";

import { createPublicQueryRepository } from "@/lib/db/public-query-repository";
import {
  INITIAL_COMPANY_PAGE_TARGET,
  inferCompanyDataSourceKind,
  profileCompanyPageSelection,
  selectCompanyPageRoutes,
} from "@/lib/seo/company-page-selection";
import { listSitemapEntries } from "@/lib/seo/sitemaps";

import { createM16ScaleFixtureData } from "./fixtures/m16-scale-fixtures";

describe("M16 company page scale selection", () => {
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
    const h1bStaticSlugs = repo.listCompanyStaticSlugs("h1b");
    const permStaticSlugs = repo.listCompanyStaticSlugs("perm");
    const companySitemapEntries = listSitemapEntries("company-pages", data);

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
    const profile = profileCompanyPageSelection(data);

    expect(profile).toMatchObject({
      dataSourceKind: "generated_fixture",
      targetPageCount: 500,
      availableRouteCount: 500,
      selectedRouteCount: 500,
      h1bRouteCount: 500,
      permRouteCount: 0,
      uniqueEmployerCount: 500,
      duplicateContentFingerprintCount: 0,
      buildStrategy: "pre_generate_selected_routes_dynamic_fallback",
      withinBudget: true,
    });
    expect(profile.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(profile.elapsedMs).toBeLessThanOrEqual(profile.budgetMs);
  });
});
