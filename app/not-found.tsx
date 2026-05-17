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
      <div className="space-y-6">
        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">可能发生了什么</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)] md:grid-cols-3">
            <li>公司名称或 slug 不存在，或还没有进入公开展示范围。</li>
            <li>页面参数太细，系统把它作为搜索结果而不是固定页面。</li>
            <li>旧链接对应的数据页已经调整到新的公司、工具或指南入口。</li>
          </ul>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <NotFoundLink
            description="从公司、职位、地点和财政年度重新查公开记录。"
            href="/companies"
            title="回到公司目录"
          />
          <NotFoundLink
            description="按 H-1B、PERM、工资、OPT 和排期场景选择工具。"
            href="/tools"
            title="查看工具"
          />
          <NotFoundLink
            description="先读 LCA、PERM、prevailing wage 和 Visa Bulletin 背景。"
            href="/guides"
            title="浏览指南"
          />
          <NotFoundLink
            description="如果你认为这是错误链接或名称归并问题，可以提交线索。"
            href="/corrections"
            title="提交纠错"
          />
        </section>
      </div>
    </PageShell>
  );
}

function NotFoundLink({
  description,
  href,
  title,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      className="block rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm transition hover:border-[var(--accent)] hover:bg-slate-50"
      href={href}
    >
      <span className="font-semibold text-[var(--accent-strong)]">{title}</span>
      <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
        {description}
      </span>
    </Link>
  );
}
