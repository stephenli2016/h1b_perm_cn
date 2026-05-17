import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
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
      <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">本站定位</h2>
        <p className="mt-4 leading-8 text-[var(--muted)]">
          {siteConfig.fullDisclaimer}
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">不会提供的内容</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)]">
          <li>不会承诺某家公司一定办理 H-1B 或绿卡。</li>
          <li>不会把 LCA、PERM 或排期公开记录解释成个案批准保证。</li>
          <li>不会要求用户提交敏感移民细节来给出个性化法律建议。</li>
        </ul>
      </section>
    </PageShell>
  );
}
