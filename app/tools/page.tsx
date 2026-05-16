import type { Metadata } from "next";

import { ContentDirectoryCard } from "@/components/content/content-article";
import { PageShell } from "@/components/page-shell";
import { listContentPages } from "@/lib/content/guide-pages";

export const metadata: Metadata = {
  title: "职业移民工具",
  description:
    "H-1B 工资、公司 sponsor 记录、PERM、排期和跳槽时间线等中文工具入口。",
  alternates: {
    canonical: "/tools",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ToolsPage() {
  const tools = listContentPages("tool");

  return (
    <PageShell
      description="面向 H-1B、PERM、工资和排期判断的中文工具入口。每个工具页都标明官方来源、使用边界和相关数据入口。"
      eyebrow="工具目录"
      title="职业移民工具"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {tools.map((page) => (
          <ContentDirectoryCard key={page.path} page={page} />
        ))}
      </section>
    </PageShell>
  );
}
