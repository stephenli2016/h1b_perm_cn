import type { Metadata } from "next";

import { LegalDraftNotice } from "@/components/compliance/legal-draft-notice";
import { PageShell } from "@/components/page-shell";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildRouteSeoMetadata("/terms");

export default function TermsPage() {
  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "使用条款" }]}
      canonicalPath="/terms"
      description="说明本站的公开数据定位、可接受使用、纠错路径和责任边界。"
      eyebrow="合规"
      structuredData={buildWebPageJsonLd({
        title: "使用条款",
        description: "说明本站公开数据定位和责任边界。",
        path: "/terms",
      })}
      title="使用条款"
    >
      <div className="space-y-6">
        <LegalDraftNotice />

        <section className="grid gap-4 md:grid-cols-2">
          <TermsSection
            title="服务定位"
            items={[
              "本站整理官方公开数据，帮助中文用户理解 H-1B、PERM、工资和职业移民排期背景。",
              "本站不是律师事务所，不建立律师-客户关系，不提供个案法律、移民、税务、职业或财务建议。",
              "任何工具输出都只是基于用户输入和公开数据的机械说明，不替代专业判断。",
            ]}
          />
          <TermsSection
            title="数据使用边界"
            items={[
              "用户不得把本站数据用于骚扰、歧视、识别个人、规避法律或误导求职者。",
              "引用本站内容时应保留官方来源、覆盖期和免责声明。",
              "不得通过自动化方式批量抓取本站页面，除非已获得明确许可。",
            ]}
          />
          <TermsSection
            title="准确性与可用性"
            items={[
              "官方公开数据可能存在延迟、字段变化、雇主输入错误或后续状态变化。",
              "本站会尽力保留来源日期、财政年度和方法说明，但不保证页面永远完整、实时或无误。",
              "如发现错误，请使用纠错流程提交可核验线索。",
            ]}
          />
          <TermsSection
            title="纠错与隐私"
            items={[
              "纠错请求应尽量提供页面 URL、字段、官方来源或简短原因。",
              "请勿提交证件号码、完整住址、移民 receipt number、雇佣合同或个人案情细节。",
              "本站会优先复核可核验的官方来源和隐私风险，但不会通过纠错渠道提供个案建议。",
            ]}
          />
        </section>

        <DisclaimerBox>
          <p>{siteConfig.fullDisclaimer}</p>
        </DisclaimerBox>

        <p className="text-xs text-[var(--muted)]">Last reviewed: 2026-05-17</p>
      </div>
    </PageShell>
  );
}

function TermsSection({
  items,
  title,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
