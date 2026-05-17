import Link from "next/link";
import type { Metadata } from "next";

import { LegalDraftNotice } from "@/components/compliance/legal-draft-notice";
import { OfficialSourceList } from "@/components/compliance/official-source-list";
import { PageShell } from "@/components/page-shell";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";
import { officialSources } from "@/lib/compliance/content";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildRouteSeoMetadata("/sources");

export default function SourcesPage() {
  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "数据来源" }]}
      canonicalPath="/sources"
      description="列出本站使用的官方数据来源、用途、覆盖边界和谨慎解释方式。"
      eyebrow="来源"
      structuredData={buildWebPageJsonLd({
        title: "数据来源",
        description:
          "列出 VisaRadar CN 使用的官方数据来源、用途、覆盖边界和谨慎解释方式。",
        path: "/sources",
      })}
      title="数据来源"
    >
      <div className="space-y-6">
        <LegalDraftNotice />

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">来源原则</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            本站只使用官方、公开、可核验来源作为数据输入，不使用竞争网站、论坛或付费数据库作为数据源。社媒、律师博客或其他非官方内容最多用于人工了解用户需求，不进入页面数据。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] hover:bg-slate-50"
              href="/methodology/lca"
            >
              LCA 方法
            </Link>
            <Link
              className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] hover:bg-slate-50"
              href="/methodology/perm"
            >
              PERM 方法
            </Link>
            <Link
              className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] hover:bg-slate-50"
              href="/methodology/wage"
            >
              工资方法
            </Link>
            <Link
              className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] hover:bg-slate-50"
              href="/methodology/visa-bulletin"
            >
              排期方法
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">如何核验一页数据</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[var(--muted)]">
              <li>先看页面底部的数据来源名称和最新数据日期。</li>
              <li>
                再确认记录属于 LCA、PERM、PWD、USCIS Employer Hub 还是 Visa
                Bulletin。
              </li>
              <li>
                最后回到对应方法页，看字段口径、低样本限制和不能推断的结论。
              </li>
            </ol>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">不会作为数据输入的来源</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li>竞争网站、论坛、社媒、群聊截图或付费数据库。</li>
              <li>无法核验来源日期和字段口径的二手整理表。</li>
              <li>包含不必要个人识别信息且无法安全聚合的材料。</li>
            </ul>
          </article>
        </section>

        <OfficialSourceList sources={officialSources} />

        <DisclaimerBox>
          <p>{siteConfig.fullDisclaimer}</p>
        </DisclaimerBox>

        <p className="text-xs text-[var(--muted)]">Last reviewed: 2026-05-17</p>
      </div>
    </PageShell>
  );
}
