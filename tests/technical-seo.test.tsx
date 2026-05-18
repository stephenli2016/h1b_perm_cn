import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ErrorPage from "@/app/error";
import NotFoundPage, { metadata as notFoundMetadata } from "@/app/not-found";
import robots from "@/app/robots";
import { generateMetadata as generateH1BMetadata } from "@/app/h1b/page";
import { generateMetadata as generatePriorityDateMetadata } from "@/app/tools/eb2-eb3-china-priority-date-calculator/page";
import { generateMetadata as generateTransferMetadata } from "@/app/tools/h1b-transfer-risk-checklist/page";
import { generateMetadata as generateWageLevelMetadata } from "@/app/tools/h1b-wage-level-checker/page";
import { generateMetadata as generatePermRestartMetadata } from "@/app/tools/perm-restart-timeline-estimator/page";
import { ContentArticle } from "@/components/content/content-article";
import { PageShell } from "@/components/page-shell";
import { contentPages } from "@/lib/content/guide-pages";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { validateInternalLinkGraph } from "@/lib/seo/internal-link-graph";
import { buildSeoMetadata, hasSubmittedSearchParams } from "@/lib/seo/metadata";

describe("M23 technical SEO hardening", () => {
  it("builds canonical metadata with OpenGraph, Twitter, and robots defaults", () => {
    const metadata = buildSeoMetadata({
      title: "测试页面",
      description: "测试描述",
      path: "/guides/test?ignored=true",
      pageType: "article",
    });

    expect(metadata.alternates?.canonical).toBe("/guides/test");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({
      title: "测试页面",
      locale: "zh_CN",
      type: "article",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary",
      title: "测试页面",
    });
  });

  it("keeps uncontrolled search and calculator result URLs noindex with base canonicals", async () => {
    expect(hasSubmittedSearchParams({ employer: "", page: undefined })).toBe(
      false,
    );
    expect(hasSubmittedSearchParams({ employer: "Acme" })).toBe(true);

    const baseWageMetadata = await generateWageLevelMetadata({
      searchParams: Promise.resolve({}),
    });
    const queryWageMetadata = await generateWageLevelMetadata({
      searchParams: Promise.resolve({
        city: "Seattle",
        offeredWage: "120000",
        soc: "15-1252",
        state: "WA",
      }),
    });
    const filteredDirectoryMetadata = await generateH1BMetadata({
      searchParams: Promise.resolve({ employer: "Brightline" }),
    });
    const priorityDateQueryMetadata = await generatePriorityDateMetadata({
      searchParams: Promise.resolve({
        category: "EB-2",
        monthKey: "2026-06",
        priorityDate: "2021-08-31",
      }),
    });
    const transferQueryMetadata = await generateTransferMetadata({
      searchParams: Promise.resolve({ scenario: "new-employer" }),
    });
    const permRestartQueryMetadata = await generatePermRestartMetadata({
      searchParams: Promise.resolve({ stage: "filed-pending" }),
    });

    expect(baseWageMetadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
    expect(queryWageMetadata.robots).toMatchObject({
      index: false,
      follow: true,
    });
    expect(queryWageMetadata.alternates?.canonical).toBe(
      "/tools/h1b-wage-level-checker",
    );
    expect(filteredDirectoryMetadata.robots).toMatchObject({
      index: false,
      follow: true,
    });
    expect(filteredDirectoryMetadata.alternates?.canonical).toBe("/h1b");
    expect(priorityDateQueryMetadata.robots).toMatchObject({
      index: false,
      follow: true,
    });
    expect(priorityDateQueryMetadata.alternates?.canonical).toBe(
      "/tools/eb2-eb3-china-priority-date-calculator",
    );
    expect(transferQueryMetadata.robots).toMatchObject({
      index: false,
      follow: true,
    });
    expect(permRestartQueryMetadata.robots).toMatchObject({
      index: false,
      follow: true,
    });
  });

  it("renders visible breadcrumbs and representative JSON-LD only", () => {
    const html = renderToStaticMarkup(
      <PageShell
        breadcrumbs={[
          { href: "/", label: "首页" },
          { href: "/guides", label: "指南" },
          { label: "当前指南" },
        ]}
        canonicalPath="/guides/current-guide"
        description="页面说明"
        structuredData={buildWebPageJsonLd({
          title: "当前指南",
          description: "页面说明",
          path: "/guides/current-guide",
        })}
        title="当前指南"
      >
        <p>正文</p>
      </PageShell>,
    );

    expect(html).toContain("BreadcrumbList");
    expect(html).toContain("WebPage");
    expect(html).toContain("当前指南");
    expect(html).not.toContain("JobPosting");
    expect(html).not.toContain("AggregateRating");
  });

  it("marks guide pages as Article and tool pages as WebApplication", () => {
    const guide = contentPages.find(
      (page) => page.path === "/guides/what-is-lca-chinese",
    );
    const tool = contentPages.find(
      (page) => page.path === "/tools/prevailing-wage-lookup",
    );

    expect(guide).toBeDefined();
    expect(tool).toBeDefined();
    if (!guide || !tool) {
      throw new Error("missing M22 content fixture");
    }

    const guideHtml = renderToStaticMarkup(<ContentArticle page={guide} />);
    const toolHtml = renderToStaticMarkup(<ContentArticle page={tool} />);

    expect(guideHtml).toContain("Article");
    expect(toolHtml).toContain("WebApplication");
    expect(guideHtml).toContain("LCA 是什么");
    expect(toolHtml).toContain("通行工资（Prevailing Wage）中文查询入口");
  });

  it("validates internal links, sitemap cleanliness, and noindex exclusions", () => {
    const report = validateInternalLinkGraph();

    expect(report.brokenLinks).toEqual([]);
    expect(report.sitemapUrlsWithSearchParams).toEqual([]);
    expect(report.noindexRouteUrlsInSitemaps).toEqual([]);
    expect(report.knownPaths).toEqual(
      expect.arrayContaining([
        "/robots.txt",
        "/sitemap.xml",
        "/tools/h1b-wage-level-checker",
        "/guides/what-is-lca-chinese",
        "/perm/company/brightline-health",
      ]),
    );
  });

  it("exposes robots.txt, 404, and 500 experiences with noindex safeguards", () => {
    const robotsConfig = robots();
    const notFoundHtml = renderToStaticMarkup(<NotFoundPage />);
    const errorHtml = renderToStaticMarkup(
      <ErrorPage error={new Error("boom")} reset={() => undefined} />,
    );

    expect(robotsConfig.sitemap).toBe("http://localhost:3000/sitemap.xml");
    expect(robotsConfig.rules).toEqual([{ userAgent: "*", allow: "/" }]);
    expect(notFoundMetadata.robots).toMatchObject({
      index: false,
      follow: true,
    });
    expect(notFoundHtml).toContain("页面未找到");
    expect(notFoundHtml).toContain("可能发生了什么");
    expect(notFoundHtml).toContain("回到公司目录");
    expect(notFoundHtml).toContain("提交纠错");
    expect(errorHtml).toContain("页面暂时无法加载");
    expect(errorHtml).toContain("重试");
    expect(errorHtml).toContain("查看数据来源");
    expect(errorHtml).toContain("提交纠错");
    expect(errorHtml).not.toContain("Error digest");
  });
});
