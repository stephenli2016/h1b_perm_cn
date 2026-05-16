import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageShell } from "@/components/page-shell";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState, LoadingState } from "@/components/ui/feedback-state";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";

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
        getRowKey={(row) => row.label}
        rows={[{ label: "A", value: 1 }]}
      />,
    );

    expect(metricHtml).toContain("记录数");
    expect(metricHtml).toContain("fixture");
    expect(tableHtml).toContain(
      '<caption class="sr-only">测试数据表</caption>',
    );
    expect(tableHtml).toContain('scope="col"');
  });

  it("renders empty, loading, and error states with clear semantics", () => {
    const emptyHtml = renderToStaticMarkup(
      <EmptyState description="没有结果" title="暂无数据" />,
    );
    const loadingHtml = renderToStaticMarkup(<LoadingState />);
    const errorHtml = renderToStaticMarkup(
      <ErrorState description="请稍后重试" title="加载失败" />,
    );

    expect(emptyHtml).toContain("暂无数据");
    expect(loadingHtml).toContain('aria-busy="true"');
    expect(errorHtml).toContain('role="alert"');
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
});
