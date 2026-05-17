import Link from "next/link";
import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { buildNoIndexSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildNoIndexSeoMetadata({
  title: "页面未找到",
  description: "当前页面不存在，或对应公开数据尚未达到可展示条件。",
  path: "/404",
});

export default function NotFoundPage() {
  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "页面未找到" }]}
      canonicalPath="/404"
      description="这个地址没有可展示的公开数据页面。可以回到核心入口继续查公司、查工资、查 PERM 或查排期。"
      eyebrow="404"
      title="页面未找到"
    >
      <div className="flex flex-wrap gap-3">
        <Link
          className="rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] hover:text-white"
          href="/tools"
        >
          查看工具
        </Link>
        <Link
          className="rounded-md border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold"
          href="/guides"
        >
          浏览指南
        </Link>
      </div>
    </PageShell>
  );
}
