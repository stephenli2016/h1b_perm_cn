import Link from "next/link";
import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { SourceNote } from "@/components/source-note";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";
import {
  COMPANY_IMMIGRATION_SIGNAL_DIMENSIONS,
  type CompanyImmigrationSignalDimension,
} from "@/lib/company-immigration-signals";
import { getRuntimePublicQueryRepository } from "@/lib/db/runtime-public-query-repository";
import { buildWebApplicationJsonLd } from "@/lib/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

type MethodologyRow = (typeof COMPANY_IMMIGRATION_SIGNAL_DIMENSIONS)[number];

const methodologyColumns: DataTableColumn<MethodologyRow>[] = [
  {
    key: "dimension",
    header: "维度",
    render: (row) => (
      <div>
        <p className="font-medium text-slate-950">{row.labelZh}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{row.key}</p>
      </div>
    ),
  },
  {
    key: "max",
    header: "最高分",
    align: "right",
    render: (row) => row.maxScore,
  },
  {
    key: "description",
    header: "看什么",
    render: (row) => row.descriptionZh,
  },
];

const exampleColumns: DataTableColumn<CompanyImmigrationSignalDimension>[] = [
  {
    key: "dimension",
    header: "示例维度",
    render: (row) => row.labelZh,
  },
  {
    key: "score",
    header: "示例分",
    align: "right",
    render: (row) => `${row.score} / ${row.maxScore}`,
  },
  {
    key: "evidence",
    header: "示例证据",
    render: (row) => row.evidenceZh.join("；"),
  },
];

export const metadata: Metadata = buildSeoMetadata({
  title: "公司职业移民公开数据友好度信号方法说明",
  description:
    "解释 VisaRadar CN 如何用官方 H-1B LCA、PERM、USCIS Employer Data Hub 和工资公开数据生成谨慎的公司公开数据友好度信号。",
  path: "/tools/company-immigration-score",
  pageType: "tool",
});

export default async function CompanyImmigrationScorePage() {
  const repo = await getRuntimePublicQueryRepository();
  const example = repo.getCompanyProfileBySlug({
    slug: "brightline-health",
  });
  const exampleSignal = example.ok ? example.data.immigrationSignal : undefined;

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/tools", label: "工具" },
        { label: "公开数据友好度信号" },
      ]}
      canonicalPath="/tools/company-immigration-score"
      description="这个页面解释公司页里的“公开数据友好度信号”怎么计算、能看什么、不能看什么。它衡量官方公开数据的覆盖和可解释程度，不是 sponsor 获批概率。"
      eyebrow="方法说明"
      structuredData={buildWebApplicationJsonLd({
        title: "公司职业移民公开数据友好度信号",
        description:
          "解释公司页公开数据友好度信号如何按 H-1B、PERM、跨年记录、来源、职位地点和工资上下文生成。",
        path: "/tools/company-immigration-score",
        dateModified: "2026-05-16",
      })}
      title="公司职业移民公开数据友好度信号"
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            description="只衡量公开数据覆盖、连续性、来源和上下文，不代表个案结果。"
            label="信号对象"
            value="公开数据"
          />
          <MetricCard
            description="低样本公司会被明确标记，综合信号也会受到限制。"
            label="低样本规则"
            trend="谨慎"
            trendTone="warning"
            value="< 3 条记录"
          />
          <MetricCard
            description="所有维度都来自官方公开数据或本地官方来源 fixture。"
            label="最高分"
            value="100"
          />
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">先说边界</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            公开数据友好度信号不是 H-1B 或绿卡获批概率、雇主承诺或法律结论。
            它只回答一个更窄的问题：这个公司在官方公开数据里是否有足够多、足够清楚、足够可解释的职业移民相关记录，方便求职者做背景研究。
          </p>
        </section>

        <DataTable
          caption="公开数据友好度信号方法维度"
          columns={methodologyColumns}
          getRowKey={(row) => row.key}
          rows={COMPANY_IMMIGRATION_SIGNAL_DIMENSIONS}
        />

        {exampleSignal ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Fixture 示例</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                以下示例来自本地 fixture 公司 Brightline
                Health，用来展示维度如何展开。示例不是排名，也不是推荐。
              </p>
            </div>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                description={exampleSignal.interpretationNoteZh}
                label="示例综合信号"
                value={`${exampleSignal.score} / ${exampleSignal.maxScore}`}
              />
              <MetricCard label="示例标签" value={exampleSignal.bandLabelZh} />
              <MetricCard
                description={
                  exampleSignal.lowSample.messageZh ??
                  "样本达到当前展示阈值，但仍不能推断个案结果。"
                }
                label="样本提示"
                trend={exampleSignal.lowSample.flagged ? "低样本" : "可比较"}
                trendTone={
                  exampleSignal.lowSample.flagged ? "warning" : "positive"
                }
                value={exampleSignal.lowSample.flagged ? "需谨慎" : "已提示"}
              />
            </section>
            <DataTable
              caption="公开数据友好度信号 fixture 示例"
              columns={exampleColumns}
              getRowKey={(row) => row.key}
              rows={exampleSignal.dimensions}
            />
            <Link
              className="inline-flex text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
              href="/perm/company/brightline-health"
            >
              查看 Brightline Health 公司页
            </Link>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">为什么不叫获批概率</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              公开 LCA、PERM 和 USCIS employer-level
              数据不是同一个流程节点，也没有覆盖一个人的完整移民路径。把这些数字叫获批概率会误导用户，所以本站只展示信号维度和证据。
            </p>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">低样本怎么处理</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              近 5 个 fiscal years 少于 3
              条相关公开记录时，页面会标记低样本，并限制综合信号标签。低样本不等于公司不好，只说明公开数据不足。
            </p>
          </article>
        </section>

        <SourceNote
          latestDataLabel="方法页使用当前本地官方来源 fixture 和公开查询层示例；生产数据接入后仍使用相同的谨慎解释边界。"
          names={[
            "DOL OFLC LCA / H-1B disclosure data",
            "DOL OFLC PERM disclosure data",
            "USCIS H-1B Employer Data Hub",
            "DOL / FLAG prevailing wage data",
          ]}
        />

        <RelatedLinks
          items={[
            {
              title: "公司目录",
              href: "/companies",
              description: "按公司、职位、地点和状态查公开记录。",
              meta: "数据入口",
            },
            {
              title: "H-1B 公司数据库",
              href: "/h1b",
              description: "查看 LCA 和 USCIS Employer Data Hub 信号。",
              meta: "H-1B",
            },
            {
              title: "PERM / 绿卡公司数据库",
              href: "/perm",
              description: "查看 PERM disclosure records 信号。",
              meta: "PERM",
            },
            {
              title: "H-1B 工资 Level 中文判断",
              href: "/tools/h1b-wage-level-checker",
              description: "用 DOL/FLAG prevailing wage 数据做工资背景对照。",
              meta: "相关工具",
            },
          ]}
          title="相关数据页"
        />

        <DisclaimerBox>
          <p>{siteConfig.fullDisclaimer}</p>
        </DisclaimerBox>

        <p className="text-xs text-[var(--muted)]">Last reviewed: 2026-05-16</p>
      </div>
    </PageShell>
  );
}
