import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { RouteCard } from "@/components/route-card";
import { SourceNote } from "@/components/source-note";

export const metadata: Metadata = {
  title: "中国职业移民排期",
  description:
    "中国大陆出生 EB-1、EB-2、EB-3 Visa Bulletin 和 USCIS filing chart 中文解释入口。",
  alternates: {
    canonical: "/visa-bulletin",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function VisaBulletinPage() {
  return (
    <PageShell
      description="这里会展示中国大陆出生 EB 类别的 Visa Bulletin 数据、Final Action Date、Dates for Filing 和 USCIS 当月 filing chart 选择。"
      eyebrow="Visa Bulletin"
      title="中国职业移民排期"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <RouteCard
          description="后续将解析每月 Department of State Visa Bulletin 中的 EB-1、EB-2、EB-3 中国大陆出生日期。"
          meta="DOS"
          title="每月排期表"
        />
        <RouteCard
          description="后续会区分 Final Action Date 和 Dates for Filing，并解释 USCIS 当月选择。"
          meta="USCIS"
          title="Filing chart"
        />
        <RouteCard
          description="计算器只做公开日期对照和中文解释，不保证任何 I-485 或签证动作。"
          meta="工具边界"
          title="优先日期判断"
        />
      </section>

      <div className="mt-6">
        <SourceNote
          names={[
            "U.S. Department of State Visa Bulletin",
            "USCIS Adjustment of Status filing chart",
          ]}
        />
      </div>
    </PageShell>
  );
}
