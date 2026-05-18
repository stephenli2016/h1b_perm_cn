import type { Metadata } from "next";

import { LegalDraftNotice } from "@/components/compliance/legal-draft-notice";
import { PageShell } from "@/components/page-shell";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildRouteSeoMetadata("/privacy");

export default function PrivacyPage() {
  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "隐私政策" }]}
      canonicalPath="/privacy"
      description="说明本站如何最小化收集信息、处理纠错请求，并避免展示不必要个人识别信息。"
      eyebrow="合规"
      structuredData={buildWebPageJsonLd({
        title: "隐私政策",
        description: "隐私原则、最小化收集和敏感信息保护说明。",
        path: "/privacy",
      })}
      title="隐私政策"
    >
      <div className="space-y-6">
        <LegalDraftNotice />

        <section className="grid gap-4 md:grid-cols-2">
          <PrivacySection
            title="最小化收集"
            text="使用公司页、工具页和指南页不需要创建账号。纠错请求只收集处理问题所需的页面 URL、问题说明和可选联系邮箱。"
          />
          <PrivacySection
            title="敏感信息"
            text="请不要提交护照号、A-Number、I-94、完整住址、雇佣合同、移民收据号（receipt number）或其他敏感个人文件。需要法律判断时请咨询专业人士。"
          />
          <PrivacySection
            title="纠错表单"
            text="纠错表单会生成公开请求编号。页面不会回显你提交的说明、邮箱或来源 URL；后台处理只用于复核数据展示、名称归并和隐私问题。"
          />
          <PrivacySection
            title="公开数据隐私"
            text="即使官方来源包含个人字段，本站也不展示 foreign worker names、个人地址、FEIN 或不必要识别信息，并会聚合低样本组合。"
          />
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">联系</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            隐私或纠错请求可先发送至 {siteConfig.contactEmail}
            。请不要通过邮件或表单发送证件号码、收据号（receipt
            number）、完整住址、雇佣合同或个人案情细节。
          </p>
        </section>

        <p className="text-xs text-[var(--muted)]">Last reviewed: 2026-05-17</p>
      </div>
    </PageShell>
  );
}

function PrivacySection({ text, title }: { title: string; text: string }) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text}</p>
    </article>
  );
}
