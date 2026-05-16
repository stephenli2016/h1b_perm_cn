import { describe, expect, it } from "vitest";

import { generateMetadata as generateH1BCompanyMetadata } from "@/app/h1b/company/[slug]/page";
import { generateMetadata as generatePermCompanyMetadata } from "@/app/perm/company/[slug]/page";
import {
  companyPageQualityScore,
  evaluateCompanyIndexability,
  getCompanyPageSeo,
} from "@/lib/seo/company-quality";
import {
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

    expect(listSitemapEntries("tools").map((entry) => entry.url)).toEqual([
      "http://localhost:3000/tools/h1b-wage-level-checker",
      "http://localhost:3000/tools/eb2-eb3-china-priority-date-calculator",
      "http://localhost:3000/tools/company-immigration-score",
    ]);
    expect(listSitemapEntries("guides")).toEqual([]);
    expect(listSitemapEntries("visa-bulletin")).toEqual([
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
    expect(coreUrls).toContain("http://localhost:3000/corrections");
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
      "http://localhost:3000/tools/eb2-eb3-china-priority-date-calculator",
    );
    expect(renderUrlSet(listSitemapEntries("tools"))).toContain(
      "http://localhost:3000/tools/company-immigration-score",
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
