import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

import CompanyImmigrationScorePage from "@/app/tools/company-immigration-score/page";
import H1BTransferRiskChecklistPage from "@/app/tools/h1b-transfer-risk-checklist/page";
import PermRestartTimelineEstimatorPage from "@/app/tools/perm-restart-timeline-estimator/page";
import { CompanyProfile } from "@/components/company/company-profile";
import { PageShell } from "@/components/page-shell";
import { DirectoryFilterForm } from "@/components/search/directory-filter-form";
import { Pagination } from "@/components/search/pagination";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState, LoadingState } from "@/components/ui/feedback-state";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";
import { publicQueryRepository } from "@/lib/db/public-query-repository";

type Row = {
  label: string;
  value: number;
};

const columns: DataTableColumn<Row>[] = [
  {
    key: "label",
    header: "标签",
    render: (row) => row.label,
  },
  {
    key: "value",
    header: "数值",
    align: "right",
    render: (row) => row.value,
  },
];

describe("M12 UI components", () => {
  it("renders desktop and mobile navigation landmarks", () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(html).toContain('aria-label="主导航"');
    expect(html).toContain('aria-label="移动端主导航"');
    expect(html).toContain("<summary");
    expect(html).toContain("菜单");
  });

  it("renders footer quick actions and compliance navigation", () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain('aria-label="常用动作"');
    expect(html).toContain("查公司");
    expect(html).toContain("查工资");
    expect(html).toContain("查排期");
    expect(html).toContain("提交纠错");
    expect(html).toContain("不提供法律、移民、税务、职业或财务建议");
    expect(html).not.toContain("example-employer");
    expect(html).not.toContain("/perm/company/brightline-health");
    expect(html).not.toContain("/h1b/company/[slug]");
  });

  it("renders page shell with breadcrumbs", () => {
    const html = renderToStaticMarkup(
      <PageShell
        breadcrumbs={[{ href: "/", label: "首页" }, { label: "H-1B" }]}
        description="页面说明"
        title="页面标题"
      >
        <p>正文</p>
      </PageShell>,
    );

    expect(html).toContain('aria-label="面包屑导航"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("<main");
  });

  it("renders standalone breadcrumbs", () => {
    const html = renderToStaticMarkup(
      <Breadcrumbs
        items={[{ href: "/", label: "首页" }, { label: "当前页" }]}
      />,
    );

    expect(html).toContain("首页");
    expect(html).toContain("当前页");
  });

  it("renders accessible metric cards and data tables", () => {
    const metricHtml = renderToStaticMarkup(
      <MetricCard
        description="解释"
        label="记录数"
        trend="fixture"
        value={12}
      />,
    );
    const tableHtml = renderToStaticMarkup(
      <DataTable
        caption="测试数据表"
        columns={columns}
        emptyAction={<a href="/companies">查看全部</a>}
        getRowKey={(row) => row.label}
        rows={[{ label: "A", value: 1 }]}
      />,
    );
    const emptyTableHtml = renderToStaticMarkup(
      <DataTable
        caption="空数据表"
        columns={columns}
        emptyAction={<a href="/companies">清除筛选</a>}
        getRowKey={(row) => row.label}
        rows={[]}
      />,
    );

    expect(metricHtml).toContain("记录数");
    expect(metricHtml).toContain("fixture");
    expect(tableHtml).toContain(
      '<caption class="sr-only">测试数据表</caption>',
    );
    expect(tableHtml).toContain('scope="col"');
    expect(emptyTableHtml).toContain("暂无数据");
    expect(emptyTableHtml).toContain("清除筛选");
  });

  it("renders empty, loading, and error states with clear semantics", () => {
    const emptyHtml = renderToStaticMarkup(
      <EmptyState description="没有结果" title="暂无数据" />,
    );
    const loadingHtml = renderToStaticMarkup(<LoadingState />);
    const errorHtml = renderToStaticMarkup(
      <ErrorState
        action={<a href="/sources">查看数据来源</a>}
        description="请稍后重试"
        title="加载失败"
      />,
    );

    expect(emptyHtml).toContain("暂无数据");
    expect(loadingHtml).toContain('aria-busy="true"');
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain("查看数据来源");
  });

  it("renders disclaimer and related-link blocks in Chinese", () => {
    const disclaimerHtml = renderToStaticMarkup(<DisclaimerBox compact />);
    const relatedHtml = renderToStaticMarkup(
      <RelatedLinks
        items={[
          {
            description: "解释链接",
            href: "/guides",
            meta: "guide",
            title: "相关指南",
          },
        ]}
      />,
    );

    expect(disclaimerHtml).toContain("重要提示");
    expect(disclaimerHtml).toContain("查看完整免责声明");
    expect(relatedHtml).toContain("相关链接");
    expect(relatedHtml).toContain("相关指南");
  });

  it("renders directory filters and pagination with GET-friendly controls", () => {
    const formHtml = renderToStaticMarkup(
      <DirectoryFilterForm
        action="/h1b"
        caseStatuses={["CERTIFIED"]}
        fiscalYears={[2025]}
        states={["WA"]}
        submitLabel="搜索 H-1B 记录"
        values={{ employer: "Acme" }}
      />,
    );
    const paginationHtml = renderToStaticMarkup(
      <Pagination
        basePath="/h1b"
        currentParams={{ employer: "Acme", page: "2" }}
        pagination={{
          hasNextPage: true,
          hasPreviousPage: true,
          page: 2,
          pageSize: 2,
          totalPages: 3,
          totalResults: 5,
        }}
      />,
    );

    expect(formHtml).toContain('method="get"');
    expect(formHtml).toContain('name="employer"');
    expect(formHtml).toContain("职位 / SOC");
    expect(paginationHtml).toContain("搜索结果分页");
    expect(paginationHtml).toContain("/h1b?employer=Acme");
  });

  it("renders the company profile template with missing data states and JSON-LD", () => {
    const result = publicQueryRepository.getCompanyProfileBySlug({
      slug: "brightline-health",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    const html = renderToStaticMarkup(
      <CompanyProfile mode="perm" profile={result.data} />,
    );

    expect(html).toContain("Brightline Health");
    expect(html).toContain("暂无 H-1B LCA 记录");
    expect(html).toContain("PERM 时间线与状态");
    expect(html).toContain("建议这样读这个公司页");
    expect(html).toContain("可以直接问雇主的问题");
    expect(html).toContain("这个岗位是否会启动 H-1B/LCA");
    expect(html).toContain("这个岗位的 PERM 职位、地点、启动时间");
    expect(html).toContain("下一步可以查看");
    expect(html).toContain("跳槽后 PERM 重办时间线估算器");
    expect(html).toContain("资料完整度");
    expect(html).toContain("公开数据友好度信号");
    expect(html).toContain("查看方法说明");
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain("FAQPage");
    expect(html).toContain("PERM 已认证是否等于绿卡获批");
    expect(html).not.toContain("M15");
  });

  it("renders H-1B company pages with employer-ready questions", () => {
    const result = publicQueryRepository.getCompanyProfileBySlug({
      slug: "acme-analytics",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    const html = renderToStaticMarkup(
      <CompanyProfile mode="h1b" profile={result.data} />,
    );

    expect(html).toContain("可以直接问雇主的问题");
    expect(html).toContain("我的 offer 上的雇主法定实体");
    expect(html).toContain("这个岗位的职位、SOC、工作地点和近年 H-1B/LCA 记录");
    expect(html).toContain("H-1B 工资等级中文判断工具");
  });

  it("renders the company immigration signal methodology page", async () => {
    const html = renderToStaticMarkup(await CompanyImmigrationScorePage());

    expect(html).toContain("公司职业移民公开数据友好度信号");
    expect(html).toContain("近期 LCA 活动");
    expect(html).toContain("低样本规则");
    expect(html).toContain("不是 H-1B 或绿卡获批概率");
    expect(html).toContain("示例信号");
    expect(html).toContain("回到公司目录");
  });

  it("renders the H-1B transfer checklist without sensitive data fields", async () => {
    const html = renderToStaticMarkup(
      await H1BTransferRiskChecklistPage({
        searchParams: Promise.resolve({
          companyDataFocus: "h1b",
          scenario: "cap-exempt-to-cap-subject",
          startTiming: "not-sure",
        }),
      }),
    );

    expect(html).toContain("H-1B 换雇主风险清单");
    expect(html).toContain("免抽签雇主");
    expect(html).toContain("不收集敏感信息");
    expect(html).toContain("/h1b");
    expect(html).not.toContain('name="receiptNumber"');
    expect(html).not.toContain('name="i94"');
    expect(html).not.toContain('name="salary"');
  });

  it("renders the PERM restart timeline without sensitive data fields", async () => {
    const html = renderToStaticMarkup(
      await PermRestartTimelineEstimatorPage({
        searchParams: Promise.resolve({
          companyDataFocus: "perm",
          scenario: "new-employer",
          stage: "filed-pending",
        }),
      }),
    );

    expect(html).toContain("跳槽后 PERM 重办时间线估算器");
    expect(html).toContain("ETA-9089 / PERM 申请");
    expect(html).toContain("不收集敏感信息");
    expect(html).toContain("/perm");
    expect(html).not.toContain('name="priorityDate"');
    expect(html).not.toContain('name="receiptNumber"');
    expect(html).not.toContain('name="employerName"');
  });
});
