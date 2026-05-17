import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { SourceNote } from "@/components/source-note";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";
import {
  buildPermRestartTimeline,
  companyDataFocusOptions,
  permRestartScenarios,
  permStages,
  type CompanyDataFocus,
  type PermRestartScenario,
  type PermStage,
} from "@/lib/career-decision-tools";
import type { RawSearchParams } from "@/lib/directory-search";
import { buildWebApplicationJsonLd } from "@/lib/seo/json-ld";
import { buildSeoMetadata, hasSubmittedSearchParams } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

type PermRestartTimelineEstimatorPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: PermRestartTimelineEstimatorPageProps): Promise<Metadata> {
  const hasQuery = hasSubmittedSearchParams(await searchParams);

  return buildSeoMetadata({
    title: hasQuery
      ? "跳槽后 PERM 重办时间线结果"
      : "跳槽后 PERM 重办时间线估算器",
    description:
      "用通用教育性场景理解跳槽、换职位或换地点后 PERM 可能涉及的重新规划节点，并连接公司 PERM/H-1B 公开数据。",
    path: "/tools/perm-restart-timeline-estimator",
    index: !hasQuery,
    pageType: "tool",
  });
}

export default async function PermRestartTimelineEstimatorPage({
  searchParams,
}: PermRestartTimelineEstimatorPageProps) {
  const params = await searchParams;
  const result = buildPermRestartTimeline({
    scenario: normalizeOption(
      permRestartScenarios,
      firstValue(params?.scenario),
    ),
    stage: normalizeOption(permStages, firstValue(params?.stage)),
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
        { label: "跳槽后 PERM 重办时间线估算器" },
      ]}
      canonicalPath="/tools/perm-restart-timeline-estimator"
      description="选择一个通用场景，查看 PERM 相关节点的相对顺序。页面不要求输入 priority date、I-140 receipt、工资、身份日期或雇主名称。"
      eyebrow="PERM 工具"
      structuredData={buildWebApplicationJsonLd({
        title: "跳槽后 PERM 重办时间线估算器",
        description:
          "用通用教育性场景理解跳槽、换职位或换地点后 PERM 可能涉及的重新规划节点，并连接公司 PERM/H-1B 公开数据。",
        path: "/tools/perm-restart-timeline-estimator",
        dateModified: "2026-05-16",
      })}
      title="跳槽后 PERM 重办时间线估算器"
    >
      <div className="space-y-6">
        <PermScenarioForm values={result.input} />

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
            description="这是教育性流程提示，不是个案法律结论。"
            label="重启判断口径"
            trend={result.restartSignal === "background-only" ? "背景" : "重点"}
            trendTone={
              result.restartSignal === "background-only"
                ? "positive"
                : "warning"
            }
            value={
              <span className="block text-lg leading-snug">
                {result.restartLabelZh}
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
          <h2 className="text-lg font-semibold">如何理解这个时间线</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {result.summaryZh}
          </p>
        </section>

        <section className="space-y-4">
          {result.timelineSteps.map((step) => (
            <article
              className="grid gap-4 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm md:grid-cols-[4rem_1fr]"
              key={step.step}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-lg font-semibold text-[var(--accent-strong)]">
                {step.step}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {step.description}
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                  {step.checkpoints.map((checkpoint) => (
                    <li
                      className="border-t border-slate-100 pt-3"
                      key={checkpoint}
                    >
                      {checkpoint}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">常见误区</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li>PERM certified 不等于 I-140 或绿卡已经批准。</li>
              <li>
                新雇主的 PERM 通常围绕新雇主和新的 permanent job opportunity
                重新规划。
              </li>
              <li>
                公司有 PERM
                历史记录，只能说明公开数据背景，不代表会为你的岗位启动流程。
              </li>
            </ul>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">适合问 HR / 律师的问题</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li>新岗位是否是新的 permanent job opportunity？</li>
              <li>现有 PERM、I-140 和 priority date 在跳槽计划中如何处理？</li>
              <li>雇主是否已有类似职位、地点和 PERM filing 的公开历史？</li>
            </ul>
          </article>
        </section>

        <RelatedLinks items={result.relatedLinks} title="相关公司数据入口" />

        <SourceNote
          latestDataLabel="本页用官方 PERM 流程来源做教育性时间线，并把公司 PERM/H-1B 公开数据作为背景入口；它不读取或保存个人身份信息。"
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

function PermScenarioForm({
  values,
}: {
  values: {
    scenario: PermRestartScenario;
    stage: PermStage;
    companyDataFocus: CompanyDataFocus;
  };
}) {
  return (
    <form
      action="/tools/perm-restart-timeline-estimator"
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
            {permRestartScenarios.map((scenario) => (
              <option key={scenario.value} value={scenario.value}>
                {scenario.labelZh}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>当前 PERM 阶段</span>
          <select
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.stage}
            name="stage"
          >
            {permStages.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.labelZh}
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
        生成时间线
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
