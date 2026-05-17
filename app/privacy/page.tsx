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
      description="MVP 阶段优先使用公开数据和本地占位能力，不建立用户账号，也不主动收集敏感移民细节。"
      eyebrow="合规"
      structuredData={buildWebPageJsonLd({
        title: "隐私政策",
        description: "MVP 阶段的隐私原则、最小化收集和敏感信息保护说明。",
        path: "/privacy",
      })}
      title="隐私政策"
    >
      <div className="space-y-6">
        <LegalDraftNotice />

        <section className="grid gap-4 md:grid-cols-2">
          <PrivacySection
            title="最小化收集"
            text="当前阶段不需要用户账号。后续如启用纠错、提醒、邮件或 analytics 功能，也只应收集完成该功能所需的最少信息，并在页面上说明用途。"
          />
          <PrivacySection
            title="敏感信息"
            text="请不要提交护照号、A-Number、I-94、完整住址、雇佣合同、移民 receipt number 或其他敏感个人文件。需要法律判断时请咨询专业人士。"
          />
          <PrivacySection
            title="纠错表单"
            text="MVP 阶段纠错表单只生成本地 stub 编号，不发送邮件、不写数据库、不回显问题说明。生产接入前需要确认保留期限、访问控制和处理流程。"
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
            。正式上线前，隐私文案、数据保留策略和后台访问权限仍需 owner
            和法律专业人士审阅。
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
