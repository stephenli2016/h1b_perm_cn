import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { RouteCard } from "@/components/route-card";

export const metadata: Metadata = {
  title: "职业移民工具",
  description:
    "H-1B 工资、公司 sponsor 记录、PERM、排期和跳槽时间线等中文工具入口规划。",
  alternates: {
    canonical: "/tools",
  },
  robots: {
    index: false,
    follow: true,
  },
};

const plannedTools = [
  {
    title: "H-1B 公司 Sponsor 记录查询",
    description: "用官方 LCA 和 USCIS 数据观察公司公开记录，不输出保证性结论。",
    meta: "M13-M14",
  },
  {
    title: "H-1B 工资 Level 中文判断",
    description: "按 SOC、地区、工资和年份做近似对照，并清楚列出限制。",
    href: "/tools/h1b-wage-level-checker",
    meta: "M18",
  },
  {
    title: "中国 EB-2 / EB-3 排期计算器",
    description: "基于 Visa Bulletin 和 USCIS filing chart 做中文解释。",
    meta: "M19",
  },
  {
    title: "跳槽后 PERM 重办时间线",
    description: "用教育性场景解释流程节点，不收集敏感个案信息。",
    meta: "M21",
  },
];

export default function ToolsPage() {
  return (
    <PageShell
      description="面向 H-1B、PERM、工资和排期判断的中文工具入口。已上线的工具会连接官方来源 fixture 或后续真实数据。"
      eyebrow="工具目录"
      title="职业移民工具"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {plannedTools.map((tool) => (
          <RouteCard
            description={tool.description}
            href={tool.href}
            key={tool.title}
            meta={tool.meta}
            title={tool.title}
          />
        ))}
      </section>
    </PageShell>
  );
}
