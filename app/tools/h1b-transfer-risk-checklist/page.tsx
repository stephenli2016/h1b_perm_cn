import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { SourceNote } from "@/components/source-note";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";
import {
  buildH1BTransferChecklist,
  companyDataFocusOptions,
  h1bTransferScenarios,
  h1bTransferStartTimings,
  type CompanyDataFocus,
  type H1BTransferScenario,
  type H1BTransferStartTiming,
} from "@/lib/career-decision-tools";
import type { RawSearchParams } from "@/lib/directory-search";
import { siteConfig } from "@/lib/site";

type H1BTransferChecklistPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export const metadata: Metadata = {
  title: "H-1B Transfer 风险清单",
  description:
    "用通用场景核对 H-1B 换雇主前需要问 HR、律师和新雇主 immigration team 的问题，并连接公司 H-1B/PERM 公开数据。",
  alternates: {
    canonical: "/tools/h1b-transfer-risk-checklist",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function H1BTransferRiskChecklistPage({
  searchParams,
}: H1BTransferChecklistPageProps) {
  const params = await searchParams;
  const result = buildH1BTransferChecklist({
    scenario: normalizeOption(
      h1bTransferScenarios,
      firstValue(params?.scenario),
    ),
    startTiming: normalizeOption(
      h1bTransferStartTimings,
      firstValue(params?.startTiming),
    ),
    companyDataFocus: normalizeOption(
      companyDataFocusOptions,
      firstValue(params?.companyDataFocus),
    ),
  });

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/tools", label: "工具" },
        { label: "H-1B Transfer 风险清单" },
      ]}
      description="选择一个通用场景，生成 H-1B transfer 前的核对清单。页面不要求输入身份日期、receipt number、工资或雇主名称。"
      eyebrow="H-1B 工具"
      title="H-1B Transfer 风险清单"
    >
      <div className="space-y-6">
        <TransferScenarioForm values={result.input} />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="当前场景"
            value={
              <span className="block text-lg leading-snug">
                {result.labelZh}
              </span>
            }
          />
          <MetricCard
            description="这只是核对强度，不是法律风险评级。"
            label="核对强度"
            trend={
              result.reviewIntensity === "attorney-review" ? "重点" : "清单"
            }
            trendTone={
              result.reviewIntensity === "standard" ? "positive" : "warning"
            }
            value={
              <span className="block text-lg leading-snug">
                {result.reviewLabelZh}
              </span>
            }
          />
          <MetricCard
            description={result.privacyNoteZh}
            label="隐私输入"
            value="不收集敏感信息"
          />
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">如何使用这个清单</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {result.summaryZh}
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {result.checklistSections.map((section) => (
            <article
              className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
              key={section.title}
            >
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {section.description}
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                {section.items.map((item) => (
                  <li className="border-t border-slate-100 pt-3" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">常见误区</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li>有 LCA 历史记录，不等于新岗位会自动 filed 或 approved。</li>
              <li>
                Transfer
                不是只看公司名，还要核对职位、worksite、工资和开始日期。
              </li>
              <li>
                公开数据只能帮你准备问题，不能替代雇主 immigration team
                或律师确认。
              </li>
            </ul>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">适合问 HR / 律师的问题</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li>谁会提交 Form I-129，预计 requested start date 是什么？</li>
              <li>实际 worksite、远程安排和 LCA 覆盖范围如何处理？</li>
              <li>
                如果 petition 被 RFE、denied 或需要 amended
                filing，雇主政策是什么？
              </li>
            </ul>
          </article>
        </section>

        <RelatedLinks items={result.relatedLinks} title="相关公司数据入口" />

        <SourceNote
          latestDataLabel="本页用官方 H-1B/LCA 规则来源做教育性核对清单，并把公司公开数据作为背景入口；它不读取或保存个人身份信息。"
          names={result.officialSources.map((source) => source.title)}
        />

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">官方来源入口</h2>
          <ul className="mt-4 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
            {result.officialSources.map((source) => (
              <li key={source.url}>
                <a
                  className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
                  href={source.url}
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <DisclaimerBox>
          <p>{result.interpretationNoteZh}</p>
          <p className="mt-3">{siteConfig.fullDisclaimer}</p>
        </DisclaimerBox>

        <p className="text-xs text-[var(--muted)]">Last reviewed: 2026-05-16</p>
      </div>
    </PageShell>
  );
}

function TransferScenarioForm({
  values,
}: {
  values: {
    scenario: H1BTransferScenario;
    startTiming: H1BTransferStartTiming;
    companyDataFocus: CompanyDataFocus;
  };
}) {
  return (
    <form
      action="/tools/h1b-transfer-risk-checklist"
      className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
      method="get"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          <span>通用场景</span>
          <select
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.scenario}
            name="scenario"
          >
            {h1bTransferScenarios.map((scenario) => (
              <option key={scenario.value} value={scenario.value}>
                {scenario.labelZh}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>开始节点偏好</span>
          <select
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.startTiming}
            name="startTiming"
          >
            {h1bTransferStartTimings.map((timing) => (
              <option key={timing.value} value={timing.value}>
                {timing.labelZh}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>公开数据重点</span>
          <select
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.companyDataFocus}
            name="companyDataFocus"
          >
            {companyDataFocusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.labelZh}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        className="mt-5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
        type="submit"
      >
        生成清单
      </button>
    </form>
  );
}

function firstValue(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const trimmed = candidate?.trim();

  return trimmed || undefined;
}

function normalizeOption<Option extends { value: string }>(
  options: readonly Option[],
  value: string | undefined,
): Option["value"] | undefined {
  return options.find((option) => option.value === value)?.value;
}
