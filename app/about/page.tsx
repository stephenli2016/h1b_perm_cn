import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { RouteCard } from "@/components/route-card";

export const metadata: Metadata = {
  title: "关于 VisaRadar CN",
  description: "了解本站目标、数据原则和为什么用谨慎方式呈现公开移民数据。",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <PageShell
      description="VisaRadar CN 面向海外华人，把 H-1B、PERM、工资和排期公开数据整理成中文决策支持页面。"
      eyebrow="关于"
      title="关于 VisaRadar CN"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <RouteCard
          description="只使用官方公开数据或明确许可的数据来源，不抓取竞品数据库、论坛或社交平台。"
          meta="来源"
          title="官方数据优先"
        />
        <RouteCard
          description="页面会区分数据记录、流程节点和法律结论；公开记录不是个案结果。"
          meta="解释"
          title="谨慎读数"
        />
        <RouteCard
          description="MVP 不做论坛、评论、账号系统，也不收集敏感移民细节。"
          meta="隐私"
          title="最小化产品面"
        />
      </section>
    </PageShell>
  );
}
