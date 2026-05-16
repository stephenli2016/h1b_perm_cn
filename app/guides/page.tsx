import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { RouteCard } from "@/components/route-card";

export const metadata: Metadata = {
  title: "职业移民中文指南",
  description:
    "解释 LCA、PERM、Prevailing Wage、Visa Bulletin 和求职决策的中文指南目录规划。",
  alternates: {
    canonical: "/guides",
  },
  robots: {
    index: false,
    follow: true,
  },
};

const guideGroups = [
  {
    title: "H-1B 数据解释",
    description:
      "解释 LCA、USCIS Employer Data Hub、case status、SOC code 和城市工资查询。",
    meta: "10 篇规划",
  },
  {
    title: "Prevailing Wage 和薪资",
    description:
      "解释 wage level、地区影响、谈薪参考和工资偏低时需要谨慎看的信号。",
    meta: "8 篇规划",
  },
  {
    title: "PERM 和绿卡",
    description: "解释 PERM、PWD、recruitment、I-140 和公司绿卡公开数据信号。",
    meta: "10 篇规划",
  },
  {
    title: "排期与求职决策",
    description:
      "解释 Visa Bulletin、filing chart、中国 EB 类别和面试时如何问政策。",
    meta: "10 篇规划",
  },
];

export default function GuidesPage() {
  return (
    <PageShell
      description="这里会承载 50 个高价值中文工具/指南页面。M02 先建立目录；M22 再发布完整内容。"
      eyebrow="指南目录"
      title="职业移民中文指南"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {guideGroups.map((group) => (
          <RouteCard
            description={group.description}
            key={group.title}
            meta={group.meta}
            title={group.title}
          />
        ))}
      </section>
    </PageShell>
  );
}
