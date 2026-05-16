import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { RouteCard } from "@/components/route-card";
import { SourceNote } from "@/components/source-note";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "PERM / 绿卡公司数据库",
  description:
    "PERM 雇主公开数据信号入口，后续将接入 DOL OFLC PERM disclosure data。",
  alternates: {
    canonical: "/perm",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function PermPage() {
  return (
    <PageShell
      description="这里会成为 PERM / 职业移民公司查询入口。M02 阶段先固定页面结构、来源说明和解释边界，后续再接入官方 PERM 数据和公司页摘要。"
      eyebrow={siteConfig.tagline}
      title="PERM / 绿卡公司数据库"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <RouteCard
          description="按雇主名称查找 PERM 记录和公司页，展示近年公开劳工认证信号。"
          meta="目录"
          title="雇主 PERM 入口"
        />
        <RouteCard
          description="后续会展示 case status、职位、地点、工资单位和关键日期等摘要。"
          meta="PERM"
          title="状态与时间线"
        />
        <RouteCard
          description="PERM certification 是职业移民流程的一步，不等于 I-140、I-485 或绿卡获批。"
          meta="解释"
          title="避免误读"
        />
      </div>

      <div className="mt-6">
        <SourceNote names={["DOL OFLC PERM disclosure data"]} />
      </div>
    </PageShell>
  );
}
