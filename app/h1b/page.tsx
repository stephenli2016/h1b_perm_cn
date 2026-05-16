import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { RouteCard } from "@/components/route-card";
import { SourceNote } from "@/components/source-note";
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
  return (
    <PageShell
      description="这里会成为 H-1B / LCA 公司查询入口。M02 阶段先固定页面结构、来源说明和解释边界，后续再接入官方数据、筛选和公司页。"
      eyebrow={siteConfig.tagline}
      title="H-1B 公司数据库"
    >
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
        <SourceNote
          names={[
            "DOL OFLC LCA / H-1B disclosure data",
            "USCIS H-1B Employer Data Hub",
          ]}
        />
      </div>
    </PageShell>
  );
}
