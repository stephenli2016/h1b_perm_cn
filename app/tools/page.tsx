import type { Metadata } from "next";

import { ContentDirectoryCard } from "@/components/content/content-article";
import { PageShell } from "@/components/page-shell";
import { listContentPages } from "@/lib/content/guide-pages";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildRouteSeoMetadata("/tools");

export default function ToolsPage() {
  const tools = listContentPages("tool");

  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "工具" }]}
      canonicalPath="/tools"
      description="面向 H-1B、PERM、工资和排期判断的中文工具入口。每个工具页都标明官方来源、使用边界和相关数据入口。"
      eyebrow="工具目录"
      structuredData={buildWebPageJsonLd({
        title: "职业移民工具",
        description: "12 个 H-1B、PERM、工资、排期和跳槽时间线中文工具入口。",
        path: "/tools",
        pageType: "CollectionPage",
      })}
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
