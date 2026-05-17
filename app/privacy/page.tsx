import type { Metadata } from "next";

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
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">最小化收集</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            当前阶段不需要用户账号。后续如启用纠错、提醒或邮件功能，也应只收集完成该功能所需的最少信息。
          </p>
        </article>
        <article className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">敏感信息</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            请不要提交护照号、A-Number、I-94、完整住址、雇佣合同或其他敏感个人文件。需要法律判断时请咨询专业人士。
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">联系</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          隐私或纠错请求可先发送至 {siteConfig.contactEmail}
          。正式上线前，隐私文案仍需 owner 和法律专业人士审阅。
        </p>
      </section>
    </PageShell>
  );
}
