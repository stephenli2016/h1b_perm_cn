import type { Metadata } from "next";

import { LegalDraftNotice } from "@/components/compliance/legal-draft-notice";
import { PageShell } from "@/components/page-shell";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildRouteSeoMetadata("/disclaimer");

export default function DisclaimerPage() {
  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "免责声明" }]}
      canonicalPath="/disclaimer"
      description="所有数据页、工具页和指南页都必须在这个边界内解释公开数据。"
      eyebrow="合规"
      structuredData={buildWebPageJsonLd({
        title: "免责声明",
        description:
          "本站内容仅供信息参考，不构成法律、移民、税务、职业或财务建议。",
        path: "/disclaimer",
      })}
      title="免责声明"
    >
      <div className="space-y-6">
        <LegalDraftNotice />

        <DisclaimerBox title="核心免责声明">
          <p>{siteConfig.fullDisclaimer}</p>
        </DisclaimerBox>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">本站定位</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              VisaRadar CN
              是公开数据整理和中文解释产品。页面、表格、工具、评分、指南和来源说明都只帮助用户做背景研究，不代表律师意见、移民局决定或雇主承诺。
            </p>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">专业建议边界</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              USCIS 对外提醒，移民法律建议应来自合格律师或 DOJ
              认可机构代表。本站不能判断个人是否符合 H-1B、PERM、I-140、I-485
              或其他移民程序要求。
            </p>
          </article>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">不会提供的内容</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)]">
            <li>不会承诺某家公司一定办理 H-1B 或绿卡。</li>
            <li>不会把 LCA、PERM 或排期公开记录解释成个案批准保证。</li>
            <li>不会把公开数据包装成 H-1B 成功率、绿卡成功率或雇主推荐。</li>
            <li>不会要求用户提交敏感移民细节来给出个性化法律建议。</li>
            <li>不会建议用户隐瞒事实、误导雇主或规避移民规则。</li>
          </ul>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">数据页如何阅读</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            LCA、PERM、USCIS Employer Data Hub、Prevailing Wage 和 Visa Bulletin
            记录应被理解为官方公开数据信号。它们可能有延迟、字段缺失、雇主名称差异和样本不足问题。每个数据页都应同时查看来源、覆盖期、样本量、低样本提示和纠错入口。
          </p>
        </section>

        <p className="text-xs text-[var(--muted)]">Last reviewed: 2026-05-17</p>
      </div>
    </PageShell>
  );
}
