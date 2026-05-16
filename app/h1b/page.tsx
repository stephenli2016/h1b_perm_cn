import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { RouteCard } from "@/components/route-card";
import { SourceNote } from "@/components/source-note";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";
import { publicQueryRepository } from "@/lib/db/public-query-repository";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "H-1B 公司数据库",
  description:
    "H-1B 雇主公开数据信号入口，后续将接入 DOL OFLC LCA 和 USCIS Employer Data Hub 数据。",
  alternates: {
    canonical: "/h1b",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function H1BPage() {
  const searchPreview = publicQueryRepository.searchEmployers({
    query: "acme",
    limit: 3,
  });
  const h1bPreview = publicQueryRepository.getH1BSummaryByEmployer({
    slug: "acme-analytics",
  });

  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "H-1B" }]}
      description="这里会成为 H-1B / LCA 公司查询入口。M02 阶段先固定页面结构、来源说明和解释边界，后续再接入官方数据、筛选和公司页。"
      eyebrow={siteConfig.tagline}
      title="H-1B 公司数据库"
    >
      <section className="grid gap-4 pb-6 md:grid-cols-3">
        <MetricCard
          description="来自本地 fixture 的雇主搜索预览。"
          label="搜索结果样例"
          value={
            searchPreview.ok
              ? `${searchPreview.data.results.length} 家`
              : "暂无"
          }
        />
        <MetricCard
          description="LCA 是劳工条件申请记录，不等于 petition 批准。"
          label="Acme LCA 记录"
          value={h1bPreview.ok ? h1bPreview.data.h1b.total : "暂无"}
        />
        <MetricCard
          description="后续页面会按数据质量决定是否 index。"
          label="当前索引策略"
          value="noindex"
        />
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <RouteCard
          description="按雇主名称、别名和 slug 查找公司页面；低数据公司页会先保持 noindex。"
          meta="目录"
          title="雇主搜索入口"
        />
        <RouteCard
          description="展示 fiscal year、case status、职位、worksite 和工资等公开记录摘要。"
          meta="LCA"
          title="年度和职位信号"
        />
        <RouteCard
          description="区分 LCA、H-1B petition 和 USCIS Employer Data Hub，避免把单一记录当成个案结果。"
          meta="解释"
          title="如何读公开数据"
        />
      </div>

      <div className="mt-6">
        {searchPreview.ok && searchPreview.data.results.length > 0 ? (
          <RelatedLinks
            items={searchPreview.data.results.map((result) => ({
              description: `匹配别名 ${result.matchedAliases.length} 个；真实搜索和筛选会在 M13 完成。`,
              href: `/h1b/company/${result.employer.slug}`,
              meta: "fixture",
              title: result.employer.displayName,
            }))}
            title="公司页预览"
          />
        ) : (
          <EmptyState
            description="当前 fixture 中没有可展示的雇主结果。"
            title="暂无公司结果"
          />
        )}
      </div>

      <div className="mt-6">
        <SourceNote
          names={[
            "DOL OFLC LCA / H-1B disclosure data",
            "USCIS H-1B Employer Data Hub",
          ]}
        />
      </div>

      <div className="mt-6">
        <DisclaimerBox compact>
          <p>
            LCA、H-1B Employer Data Hub
            和公司页摘要都只是公开数据线索，不代表个案批准、实际录用或雇主未来承诺。
          </p>
        </DisclaimerBox>
      </div>
    </PageShell>
  );
}
