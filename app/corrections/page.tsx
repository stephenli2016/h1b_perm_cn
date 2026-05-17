import type { Metadata } from "next";

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
      description="如果页面展示、雇主名称归并、数据解释或隐私处理存在问题，可以通过这里提交纠错线索。MVP 阶段先提供静态路径。"
      eyebrow="纠错"
      structuredData={buildWebPageJsonLd({
        title: "数据纠错与移除请求",
        description: "提交雇主名称、页面展示或隐私相关问题的纠错请求路径。",
        path: "/corrections",
      })}
      title="数据纠错与移除请求"
    >
      <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">提交时建议包含</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)]">
          <li>问题页面 URL 或公司名称。</li>
          <li>你认为需要修改的字段或解释。</li>
          <li>可以核验的官方来源或简短原因。</li>
          <li>
            如涉及隐私，请只描述问题，不要发送敏感身份证件或完整个人材料。
          </li>
        </ul>
        <a
          className="mt-5 inline-flex rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] hover:text-white"
          href={`mailto:${siteConfig.contactEmail}?subject=VisaRadar%20CN%20correction%20request`}
        >
          发送纠错邮件
        </a>
      </section>
    </PageShell>
  );
}
