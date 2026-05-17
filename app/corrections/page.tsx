import type { Metadata } from "next";

import { CorrectionRequestForm } from "@/components/compliance/correction-request-form";
import { LegalDraftNotice } from "@/components/compliance/legal-draft-notice";
import { PageShell } from "@/components/page-shell";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildRouteSeoMetadata("/corrections");

export default function CorrectionsPage() {
  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "纠错" }]}
      canonicalPath="/corrections"
      description="如果页面展示、雇主名称归并、数据解释或隐私处理存在问题，可以通过这里提交纠错线索。"
      eyebrow="纠错"
      structuredData={buildWebPageJsonLd({
        title: "数据纠错与移除请求",
        description: "提交雇主名称、页面展示或隐私相关问题的纠错请求路径。",
        path: "/corrections",
      })}
      title="数据纠错与移除请求"
    >
      <div className="space-y-6">
        <LegalDraftNotice />

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">提交时建议包含</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)]">
              <li>问题页面 URL 或公司名称。</li>
              <li>你认为需要修改的字段、归并问题或解释问题。</li>
              <li>可以核验的官方来源 URL 或简短原因。</li>
              <li>
                如涉及隐私，请只描述问题，不要发送敏感身份证件或完整个人材料。
              </li>
            </ul>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">处理原则</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)]">
              <li>优先复核官方来源、字段映射和雇主名称归并规则。</li>
              <li>隐私或低样本风险优先处理，可聚合、隐藏或补充说明。</li>
              <li>不会通过纠错表单提供个人移民法律判断。</li>
              <li>提交后会生成公开请求编号，页面不会回显你的说明内容。</li>
            </ul>
          </article>
        </section>

        <CorrectionRequestForm />

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">邮件备用路径</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            如果表单无法提交，或你希望补充可核验材料，可发送邮件至{" "}
            {siteConfig.contactEmail}
            。请继续遵守最小化信息原则，不要发送证件号码、完整住址或个人案情材料。
          </p>
          <a
            className="mt-5 inline-flex rounded-md border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--accent-strong)] hover:bg-slate-50 hover:text-[var(--accent-strong)]"
            href={`mailto:${siteConfig.contactEmail}?subject=VisaRadar%20CN%20correction%20request`}
          >
            发送纠错邮件
          </a>
        </section>

        <p className="text-xs text-[var(--muted)]">Last reviewed: 2026-05-17</p>
      </div>
    </PageShell>
  );
}
