import { describe, expect, it } from "vitest";

import { generateMetadata as generateH1BCompanyMetadata } from "@/app/h1b/company/[slug]/page";
import { generateMetadata as generatePermCompanyMetadata } from "@/app/perm/company/[slug]/page";
import {
  companyPageQualityScore,
  evaluateCompanyIndexability,
  getCompanyPageSeo,
} from "@/lib/seo/company-quality";
import {
  listRuntimeCompanySitemapEntries,
  listSitemapEntries,
  renderSitemapIndex,
  renderUrlSet,
} from "@/lib/seo/sitemaps";

describe("M15 SEO indexability and sitemaps", () => {
  it("scores company pages and applies policy thresholds", () => {
    const lowData = {
      lcaCount5y: 1,
      permCount5y: 1,
      uscisRecordCount5y: 0,
      jobTitleCount: 1,
      locationCount: 1,
    };
    const highPerm = {
      lcaCount5y: 0,
      permCount5y: 3,
      uscisRecordCount5y: 0,
      jobTitleCount: 3,
      locationCount: 1,
      sourceCount: 1,
      hasLatestDataDate: true,
      hasVisibleTables: true,
      hasRelatedLinks: true,
      explanationWordCountZh: 420,
    };

    expect(companyPageQualityScore(highPerm)).toBeGreaterThan(
      companyPageQualityScore(lowData),
    );
    expect(evaluateCompanyIndexability(lowData)).toMatchObject({
      indexable: false,
      matchedThresholds: [],
    });
    expect(evaluateCompanyIndexability(highPerm, "perm")).toMatchObject({
      indexable: true,
      matchedThresholds: ["recent_perm_count_3"],
    });
    expect(evaluateCompanyIndexability(highPerm, "h1b")).toMatchObject({
      indexable: false,
    });
  });

  it("uses route-specific metadata robots and canonical URLs", async () => {
    const brightlinePerm = await generatePermCompanyMetadata({
      params: Promise.resolve({ slug: "brightline-health" }),
    });
    const brightlineH1B = await generateH1BCompanyMetadata({
      params: Promise.resolve({ slug: "brightline-health" }),
    });
    const northstarPerm = await generatePermCompanyMetadata({
      params: Promise.resolve({ slug: "northstar-cloud" }),
    });

    expect(brightlinePerm.robots).toMatchObject({
      index: true,
      follow: true,
    });
    expect(brightlinePerm.alternates?.canonical).toBe(
      "/perm/company/brightline-health",
    );
    expect(brightlineH1B.robots).toMatchObject({
      index: false,
      follow: true,
    });
    expect(northstarPerm.robots).toMatchObject({
      index: false,
      follow: true,
    });
  });

  it("includes only indexable URLs in split sitemap entries", () => {
    const companyEntries = listSitemapEntries("company-pages");
    const companyUrls = companyEntries.map((entry) => entry.url);

    expect(companyUrls).toContain(
      "http://localhost:3000/perm/company/brightline-health",
    );
    expect(companyUrls).not.toContain(
      "http://localhost:3000/h1b/company/brightline-health",
    );
    expect(companyUrls).not.toContain(
      "http://localhost:3000/perm/company/northstar-cloud",
    );

    const toolUrls = listSitemapEntries("tools").map((entry) => entry.url);
    const guideUrls = listSitemapEntries("guides").map((entry) => entry.url);

    expect(toolUrls).toHaveLength(13);
    expect(toolUrls).toEqual(
      expect.arrayContaining([
        "http://localhost:3000/tools",
        "http://localhost:3000/tools/h1b-company-sponsor-checker",
        "http://localhost:3000/tools/h1b-wage-level-checker",
        "http://localhost:3000/tools/eb2-eb3-china-priority-date-calculator",
        "http://localhost:3000/tools/company-immigration-score",
        "http://localhost:3000/tools/h1b-transfer-risk-checklist",
        "http://localhost:3000/tools/perm-restart-timeline-estimator",
        "http://localhost:3000/tools/visa-bulletin-alert",
      ]),
    );
    expect(guideUrls).toHaveLength(39);
    expect(guideUrls).toEqual(
      expect.arrayContaining([
        "http://localhost:3000/guides",
        "http://localhost:3000/guides/what-is-lca-chinese",
        "http://localhost:3000/guides/h1b-employer-data-hub-explained",
        "http://localhost:3000/guides/prevailing-wage-explained",
        "http://localhost:3000/guides/perm-explained-chinese",
        "http://localhost:3000/guides/visa-bulletin-explained-chinese",
        "http://localhost:3000/guides/how-to-choose-h1b-sponsor-company",
      ]),
    );
    expect(listSitemapEntries("visa-bulletin")).toEqual([
      {
        url: "http://localhost:3000/visa-bulletin",
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: "http://localhost:3000/visa-bulletin/2026/06",
        lastModified: "2026-05-04",
        changeFrequency: "monthly",
        priority: 0.55,
      },
      {
        url: "http://localhost:3000/visa-bulletin/2026/05",
        lastModified: "2026-04-07",
        changeFrequency: "monthly",
        priority: 0.55,
      },
      {
        url: "http://localhost:3000/visa-bulletin/2026/04",
        lastModified: "2026-03-10",
        changeFrequency: "monthly",
        priority: 0.55,
      },
    ]);
    const coreUrls = listSitemapEntries("core").map((entry) => entry.url);

    expect(coreUrls).toContain("http://localhost:3000/");
    expect(coreUrls).toContain("http://localhost:3000/disclaimer");
    expect(coreUrls).toContain("http://localhost:3000/privacy");
    expect(coreUrls).toContain("http://localhost:3000/terms");
    expect(coreUrls).toContain("http://localhost:3000/corrections");
    expect(coreUrls).toContain("http://localhost:3000/sources");
    expect(coreUrls).toContain("http://localhost:3000/methodology/lca");
    expect(coreUrls).toContain("http://localhost:3000/methodology/perm");
    expect(coreUrls).toContain("http://localhost:3000/methodology/wage");
    expect(coreUrls).toContain(
      "http://localhost:3000/methodology/visa-bulletin",
    );
    expect(coreUrls).toContain(
      "http://localhost:3000/methodology/employer-signal",
    );
    expect(coreUrls).not.toContain(
      "http://localhost:3000/corrections/received",
    );
  });

  it("does not expose fixture-only company sitemap URLs in postgres mode", async () => {
    const originalMode = process.env.LOCAL_DATA_MODE;
    const originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.LOCAL_DATA_MODE = "postgres";
    delete process.env.DATABASE_URL;

    try {
      await expect(listRuntimeCompanySitemapEntries()).resolves.toEqual([]);
    } finally {
      if (originalMode === undefined) {
        delete process.env.LOCAL_DATA_MODE;
      } else {
        process.env.LOCAL_DATA_MODE = originalMode;
      }
      if (originalDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDatabaseUrl;
      }
    }
  });

  it("renders valid sitemap XML shells without noindex URLs", () => {
    const sitemapIndex = renderSitemapIndex();
    const companyUrlSet = renderUrlSet(listSitemapEntries("company-pages"));

    expect(sitemapIndex).toContain("<sitemapindex");
    expect(sitemapIndex).toContain("/sitemaps/company-pages.xml");
    expect(companyUrlSet).toContain("<urlset");
    expect(companyUrlSet).toContain(
      "http://localhost:3000/perm/company/brightline-health",
    );
    expect(companyUrlSet).not.toContain("northstar-cloud");
    expect(renderUrlSet(listSitemapEntries("tools"))).toContain(
      "http://localhost:3000/tools/h1b-wage-level-checker",
    );
    expect(renderUrlSet(listSitemapEntries("tools"))).toContain(
      "http://localhost:3000/tools/h1b-company-sponsor-checker",
    );
    expect(renderUrlSet(listSitemapEntries("tools"))).toContain(
      "http://localhost:3000/tools/eb2-eb3-china-priority-date-calculator",
    );
    expect(renderUrlSet(listSitemapEntries("tools"))).toContain(
      "http://localhost:3000/tools/company-immigration-score",
    );
    expect(renderUrlSet(listSitemapEntries("tools"))).toContain(
      "http://localhost:3000/tools/h1b-transfer-risk-checklist",
    );
    expect(renderUrlSet(listSitemapEntries("tools"))).toContain(
      "http://localhost:3000/tools/perm-restart-timeline-estimator",
    );
    expect(renderUrlSet(listSitemapEntries("guides"))).toContain(
      "http://localhost:3000/guides/visa-bulletin-explained-chinese",
    );
    expect(renderUrlSet(listSitemapEntries("visa-bulletin"))).toContain(
      "http://localhost:3000/visa-bulletin",
    );
    expect(renderUrlSet(listSitemapEntries("visa-bulletin"))).toContain(
      "http://localhost:3000/visa-bulletin/2026/06",
    );
  });

  it("exposes route-specific SEO helper output for page components", () => {
    const metrics = {
      lcaCount5y: 0,
      permCount5y: 3,
      uscisRecordCount5y: 0,
      jobTitleCount: 3,
      locationCount: 1,
    };

    expect(getCompanyPageSeo(metrics, "perm")).toMatchObject({
      indexable: true,
      robots: {
        index: true,
        follow: true,
      },
    });
    expect(getCompanyPageSeo(metrics, "h1b")).toMatchObject({
      indexable: false,
      robots: {
        index: false,
        follow: true,
      },
    });
  });
});
