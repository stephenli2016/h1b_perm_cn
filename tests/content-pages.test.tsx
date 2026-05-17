import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import GuideContentPage from "@/app/guides/[slug]/page";
import GuidesPage from "@/app/guides/page";
import ToolContentPage from "@/app/tools/[slug]/page";
import ToolsPage from "@/app/tools/page";
import { ContentArticle } from "@/components/content/content-article";
import {
  contentPages,
  explicitToolContentPaths,
  getContentSources,
  listContentPages,
  listDynamicToolContentPages,
} from "@/lib/content/guide-pages";

const expectedM22Paths = [
  "/tools/h1b-company-sponsor-checker",
  "/tools/perm-green-card-company-checker",
  "/tools/h1b-wage-level-checker",
  "/tools/prevailing-wage-lookup",
  "/tools/eb2-eb3-china-priority-date-calculator",
  "/tools/h1b-transfer-risk-checklist",
  "/tools/perm-restart-timeline-estimator",
  "/tools/opt-to-h1b-timeline",
  "/tools/stem-opt-employer-checklist",
  "/tools/company-immigration-score",
  "/tools/wage-negotiation-with-h1b-data",
  "/tools/visa-bulletin-alert",
  "/guides/what-is-lca-chinese",
  "/guides/h1b-employer-data-hub-explained",
  "/guides/h1b-certified-lca-meaning",
  "/guides/h1b-withdrawn-denied-lca-meaning",
  "/guides/h1b-job-title-search",
  "/guides/h1b-city-salary-search",
  "/guides/h1b-soc-code-explained",
  "/guides/h1b-full-time-part-time-data",
  "/guides/h1b-dependent-employer",
  "/guides/h1b-small-company-sponsor-risk",
  "/guides/prevailing-wage-explained",
  "/guides/wage-level-1-2-3-4-explained",
  "/guides/h1b-salary-vs-prevailing-wage",
  "/guides/h1b-wage-location-effect",
  "/guides/h1b-salary-negotiation",
  "/guides/h1b-low-salary-warning-signs",
  "/guides/remote-work-h1b-wage",
  "/guides/soc-code-wage-level-case-study",
  "/guides/perm-explained-chinese",
  "/guides/perm-data-meaning",
  "/guides/perm-certified-meaning",
  "/guides/pwd-before-perm",
  "/guides/perm-recruitment-explained",
  "/guides/perm-audit-risk-basics",
  "/guides/i140-after-perm",
  "/guides/company-green-card-sponsor-signals",
  "/guides/green-card-timeline-after-h1b",
  "/guides/change-job-during-perm",
  "/guides/visa-bulletin-explained-chinese",
  "/guides/final-action-date-vs-dates-for-filing",
  "/guides/eb2-china-priority-date",
  "/guides/eb3-china-priority-date",
  "/guides/eb2-vs-eb3-china-downgrade",
  "/guides/uscis-filing-chart-explained",
  "/guides/how-to-choose-h1b-sponsor-company",
  "/guides/questions-to-ask-recruiter-about-h1b-green-card",
  "/guides/h1b-layoff-grace-period-basics",
  "/guides/immigration-friendly-company-checklist",
] as const;

const priorityOnePaths = [
  "/tools/h1b-company-sponsor-checker",
  "/tools/perm-green-card-company-checker",
  "/tools/h1b-wage-level-checker",
  "/tools/eb2-eb3-china-priority-date-calculator",
  "/tools/company-immigration-score",
  "/guides/what-is-lca-chinese",
  "/guides/h1b-employer-data-hub-explained",
  "/guides/prevailing-wage-explained",
  "/guides/wage-level-1-2-3-4-explained",
  "/guides/perm-explained-chinese",
  "/guides/perm-data-meaning",
  "/guides/company-green-card-sponsor-signals",
  "/guides/visa-bulletin-explained-chinese",
  "/guides/final-action-date-vs-dates-for-filing",
  "/guides/how-to-choose-h1b-sponsor-company",
] as const;

const forbiddenClaims =
  /这家公司一定|保证办|成功率|你的工资一定|你的排期一定|未来一定|一定会批准|一定可以提交|绕过移民|隐藏信息|伪造/i;

describe("M22 content pages", () => {
  it("publishes exactly the 50 planned high-value pages", () => {
    expect(contentPages).toHaveLength(50);
    expect(contentPages.map((page) => page.path)).toEqual([
      ...expectedM22Paths,
    ]);
    expect(listContentPages("tool")).toHaveLength(12);
    expect(listContentPages("guide")).toHaveLength(38);
    expect(listDynamicToolContentPages().map((page) => page.path)).toEqual(
      expectedM22Paths
        .filter((path) => path.startsWith("/tools/"))
        .filter((path) => !explicitToolContentPaths.has(path)),
    );
  });

  it("gives every page unique, source-backed, non-thin content fields", () => {
    const titles = new Set(contentPages.map((page) => page.title));
    const summaries = new Set(contentPages.map((page) => page.summary));

    expect(titles.size).toBe(50);
    expect(summaries.size).toBe(50);
    for (const page of contentPages) {
      expect(page.title.length).toBeGreaterThan(8);
      expect(page.metaDescription.length).toBeGreaterThan(40);
      expect(page.summary.length).toBeGreaterThan(55);
      expect(page.sourceContext.length).toBeGreaterThan(45);
      expect(page.checklist.length).toBeGreaterThanOrEqual(4);
      expect(page.example.length).toBeGreaterThan(35);
      expect(page.mistakes.length).toBeGreaterThanOrEqual(3);
      expect(page.relatedPaths.length).toBeGreaterThanOrEqual(3);
      expect(getContentSources(page).length).toBeGreaterThanOrEqual(2);
      expect(page.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(JSON.stringify(page)).not.toMatch(forbiddenClaims);
    }
  });

  it("keeps every priority 1 page polished with stronger source and checklist coverage", () => {
    const priorityOne = contentPages.filter((page) => page.priority === 1);

    expect(priorityOne.map((page) => page.path)).toEqual([...priorityOnePaths]);
    for (const page of priorityOne) {
      expect(page.checklist.length).toBeGreaterThanOrEqual(4);
      expect(getContentSources(page).length).toBeGreaterThanOrEqual(2);
      expect(page.relatedPaths.length).toBeGreaterThanOrEqual(3);
      expect(page.summary.length + page.sourceContext.length).toBeGreaterThan(
        130,
      );
    }
  });

  it("renders a content article with required sections, source links, and disclaimer", () => {
    const page = contentPages.find(
      (contentPage) => contentPage.path === "/guides/what-is-lca-chinese",
    );

    expect(page).toBeDefined();
    if (!page) {
      throw new Error("missing LCA guide page");
    }

    const html = renderToStaticMarkup(<ContentArticle page={page} />);

    expect(html).toContain("先读懂这件事");
    expect(html).toContain("你可以用它做什么");
    expect(html).toContain("官方来源怎么用");
    expect(html).toContain("常见误区");
    expect(html).toContain("相关工具 / 指南 / 数据入口");
    expect(html).toContain("本站基于公开数据整理");
    expect(html).toContain("核心必读");
    expect(html).not.toContain("Priority 1");
    expect(html).not.toContain("内容优先级");
    expect(html).toContain("Last reviewed: 2026-05-16");
    expect(html).toContain(
      "https://www.dol.gov/agencies/eta/foreign-labor/performance",
    );
  });

  it("renders tool and guide directories as task-oriented entry points", () => {
    const toolsHtml = renderToStaticMarkup(<ToolsPage />);
    const guidesHtml = renderToStaticMarkup(<GuidesPage />);

    expect(toolsHtml).toContain("按任务开始");
    expect(toolsHtml).toContain("投递前查公司");
    expect(toolsHtml).toContain("从 OPT 走到 H-1B");
    expect(toolsHtml).toContain("全部工具");
    expect(toolsHtml).not.toContain("P1 ·");
    expect(guidesHtml).toContain("先按问题选择");
    expect(guidesHtml).toContain("第一次读 H-1B 数据");
    expect(guidesHtml).toContain("建议先读");
    expect(guidesHtml).toContain('aria-label="指南分类"');
    expect(guidesHtml).not.toContain("P1 ·");
  });

  it("renders dynamic guide and missing-tool routes", async () => {
    const guideHtml = renderToStaticMarkup(
      await GuideContentPage({
        params: Promise.resolve({ slug: "visa-bulletin-explained-chinese" }),
      }),
    );
    const toolHtml = renderToStaticMarkup(
      await ToolContentPage({
        params: Promise.resolve({ slug: "prevailing-wage-lookup" }),
      }),
    );

    expect(guideHtml).toContain("Visa Bulletin 中文解释");
    expect(guideHtml).toContain("USCIS Adjustment of Status Filing Charts");
    expect(toolHtml).toContain("Prevailing Wage 中文查询入口");
    expect(toolHtml).toContain("FLAG Wage Search");
  });
});
