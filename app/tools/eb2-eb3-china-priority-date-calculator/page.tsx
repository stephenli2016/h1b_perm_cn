import Link from "next/link";
import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { SourceNote } from "@/components/source-note";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { ErrorState } from "@/components/ui/feedback-state";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";
import type { PublicVisaBulletinPriorityDatePayload } from "@/lib/db/public-query-repository";
import { waitForRuntimeDataRequestBoundary } from "@/lib/db/runtime-rendering";
import { getRuntimePublicQueryRepository } from "@/lib/db/runtime-public-query-repository";
import type { RawSearchParams } from "@/lib/directory-search";
import {
  chargeabilityAreaLabelZh,
  chartTypeLabelZh,
  defaultPriorityDateExample,
  formatVisaCutoff,
  parsePriorityDateSearchParams,
  priorityDateCategories,
  priorityDateResultLabel,
  priorityDateValuesWithDefaults,
} from "@/lib/priority-date-tool";
import { buildWebApplicationJsonLd } from "@/lib/seo/json-ld";
import { buildSeoMetadata, hasSubmittedSearchParams } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

type PriorityDateCalculatorPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

type VisaBulletinRow = PublicVisaBulletinPriorityDatePayload["rows"][number];

export async function generateMetadata({
  searchParams,
}: PriorityDateCalculatorPageProps): Promise<Metadata> {
  const hasQuery = hasSubmittedSearchParams(await searchParams);

  return buildSeoMetadata({
    title: hasQuery
      ? "中国 EB-2 / EB-3 优先日排期查询结果"
      : "中国 EB-2 / EB-3 优先日排期计算器",
    description:
      "输入职业移民类别、优先日（priority date）、最终裁定表或递件排期表，对照 Department of State Visa Bulletin 和 USCIS 当月 I-485 用表公开信息。",
    path: "/tools/eb2-eb3-china-priority-date-calculator",
    index: !hasQuery,
    pageType: "tool",
  });
}

const bulletinColumns: DataTableColumn<VisaBulletinRow>[] = [
  {
    key: "category",
    header: "类别",
    render: (row) => (
      <span className="font-medium text-slate-950">{row.category}</span>
    ),
  },
  {
    key: "final-action",
    header: "最终裁定表（Final Action Date）",
    render: (row) => formatVisaCutoff(row.finalAction),
  },
  {
    key: "dates-for-filing",
    header: "递件排期表（Dates for Filing）",
    render: (row) => formatVisaCutoff(row.datesForFiling),
  },
];

export default async function PriorityDateCalculatorPage({
  searchParams,
}: PriorityDateCalculatorPageProps) {
  await waitForRuntimeDataRequestBoundary();

  const repo = await getRuntimePublicQueryRepository();
  const months = repo.listVisaBulletinMonths();
  const latestMonthKey = months[0]?.monthKey;
  const parsed = parsePriorityDateSearchParams(await searchParams);
  const formValues = priorityDateValuesWithDefaults(
    parsed.values,
    latestMonthKey,
  );
  const lookupInput = parsed.hasSubmittedValues
    ? parsed.input
    : {
        ...defaultPriorityDateExample,
        monthKey: latestMonthKey,
      };
  const result = repo.checkVisaBulletinPriorityDate(lookupInput);
  const resultLabel = parsed.hasSubmittedValues ? "查询结果" : "示例结果";

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/tools", label: "工具" },
        { label: "EB 优先日排期计算器" },
      ]}
      canonicalPath="/tools/eb2-eb3-china-priority-date-calculator"
      description="输入优先日（priority date）后，对照中国大陆出生 EB-1、EB-2、EB-3 在所选月份和所选排期表中的公开日期。结果只解释公开表格关系，不判断个人 I-485 或签证资格。"
      eyebrow="Visa Bulletin 工具"
      structuredData={buildWebApplicationJsonLd({
        title: "中国 EB-2 / EB-3 优先日排期计算器",
        description:
          "输入职业移民类别、优先日（priority date）、最终裁定表或递件排期表，对照 Department of State Visa Bulletin 和 USCIS 当月 I-485 用表公开信息。",
        path: "/tools/eb2-eb3-china-priority-date-calculator",
        dateModified: "2026-05-16",
      })}
      title="中国 EB-2 / EB-3 优先日排期计算器"
    >
      <div className="space-y-6">
        <PriorityDateForm months={months} values={formValues} />

        {result.ok ? (
          <PriorityDateResult
            isExample={!parsed.hasSubmittedValues}
            label={resultLabel}
            payload={result.data}
          />
        ) : (
          <ErrorState
            action={
              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-red-900 ring-1 ring-red-200 hover:bg-red-100"
                  href="/tools/eb2-eb3-china-priority-date-calculator"
                >
                  重新开始
                </Link>
                <Link
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-red-900 ring-1 ring-red-200 hover:bg-red-100"
                  href="/visa-bulletin"
                >
                  查看月度排期
                </Link>
              </div>
            }
            description={result.error.hintZh ?? result.error.messageZh}
            title={result.error.messageZh}
          />
        )}

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">如何理解日期对照</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[var(--muted)]">
              <li>
                优先日早于截止日期（cut-off
                date）时，公开表格通常显示该表下排期已到。
              </li>
              <li>优先日等于截止日期时，本工具按未早于处理。</li>
              <li>
                递件排期表（Dates for Filing）能否用于 I-485，还要看 USCIS
                当月职业移民 I-485 用表选择。
              </li>
              <li>
                无排期（Current）和暂不可用（Unavailable）是 Visa Bulletin
                的特殊状态，不代表个人案件结论。
              </li>
            </ol>
          </article>

          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">常见误区</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li>排期已到不等于 I-485 一定可以提交或一定会批准。</li>
              <li>排期未到不等于雇主、PERM、I-140 或身份路径没有价值。</li>
              <li>
                排期月份、USCIS 当月 I-485 用表选择和个人类别必须同时核对。
              </li>
            </ul>
          </article>
        </section>

        <SourceNote
          latestDataLabel={
            result.ok
              ? `当前结果使用 ${result.data.month.monthKey} Visa Bulletin 与 USCIS 当月 I-485 用表官方来源数据快照，来源发布日期 ${result.data.month.publishedAt}。`
              : "本页使用 Department of State Visa Bulletin 与 USCIS Adjustment of Status Filing Charts 官方来源；当前输入未能匹配到可展示记录。"
          }
          names={
            result.ok
              ? result.data.sourceNames
              : [
                  "U.S. Department of State Visa Bulletin",
                  "USCIS Adjustment of Status filing chart",
                ]
          }
        />

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">官方来源入口</h2>
          <ul className="mt-4 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
            <li>
              <a
                className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
                href="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html"
              >
                Department of State Visa Bulletin
              </a>
            </li>
            <li>
              <a
                className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
                href="https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin"
              >
                USCIS Adjustment of Status Filing Charts
              </a>
            </li>
          </ul>
        </section>

        <RelatedLinks
          items={[
            {
              title: "中国职业移民排期",
              href: "/visa-bulletin",
              description: "查看最新月份的 EB-1、EB-2、EB-3 两张表。",
              meta: "排期入口",
            },
            {
              title: "2026 年 6 月排期",
              href: "/visa-bulletin/2026/06",
              description: "按月份查看可索引的 Visa Bulletin 数据页。",
              meta: "月度页",
            },
            {
              title: "H-1B 工资等级中文判断",
              href: "/tools/h1b-wage-level-checker",
              description:
                "用 DOL/FLAG 通行工资（prevailing wage）数据做工资等级背景对照。",
              meta: "相关工具",
            },
            {
              title: "免责声明",
              href: "/disclaimer",
              description: "了解本站公开数据解释的边界。",
              meta: "合规",
            },
          ]}
          title="相关工具与数据页"
        />

        <DisclaimerBox>
          <p>
            {result.ok
              ? result.data.interpretationNoteZh
              : siteConfig.fullDisclaimer}
          </p>
        </DisclaimerBox>

        <p className="text-xs text-[var(--muted)]">Last reviewed: 2026-05-16</p>
      </div>
    </PageShell>
  );
}

function PriorityDateForm({
  months,
  values,
}: {
  months: PublicVisaBulletinPriorityDatePayload["month"][];
  values: Required<ReturnType<typeof priorityDateValuesWithDefaults>>;
}) {
  return (
    <form
      action="/tools/eb2-eb3-china-priority-date-calculator"
      className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
      method="get"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          <span>职业移民类别</span>
          <select
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.category}
            name="category"
          >
            {priorityDateCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>出生地 / Chargeability</span>
          <select
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.chargeabilityArea}
            name="chargeabilityArea"
          >
            <option value="china-mainland">中国大陆出生</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>优先日</span>
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.priorityDate}
            name="priorityDate"
            type="date"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>排期表</span>
          <select
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.chartType}
            name="chartType"
          >
            <option value="final_action">
              最终裁定表（Final Action Dates）
            </option>
            <option value="dates_for_filing">
              递件排期表（Dates for Filing）
            </option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>排期月份（Visa Bulletin）</span>
          <select
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.monthKey}
            name="monthKey"
          >
            {months.map((month) => (
              <option key={month.monthKey} value={month.monthKey}>
                {month.monthKey}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          type="submit"
        >
          对照排期
        </button>
        <Link
          className="text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
          href="/tools/eb2-eb3-china-priority-date-calculator?category=EB-2&chargeabilityArea=china-mainland&priorityDate=2021-08-31&chartType=final_action&monthKey=2026-06"
        >
          查看示例
        </Link>
      </div>
    </form>
  );
}

function PriorityDateResult({
  isExample,
  label,
  payload,
}: {
  isExample: boolean;
  label: string;
  payload: PublicVisaBulletinPriorityDatePayload;
}) {
  const resultIsWarning =
    payload.resultStatus === "not_current" ||
    payload.resultStatus === "unavailable";

  return (
    <section className="space-y-5" aria-label={label}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{label}</h2>
        {isExample ? (
          <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-[var(--muted)]">
            默认示例
          </span>
        ) : null}
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          description={payload.interpretationNoteZh}
          label="日期对照结果"
          trend={resultIsWarning ? "需等待" : "公开表已到"}
          trendTone={resultIsWarning ? "warning" : "positive"}
          value={priorityDateResultLabel(payload.resultStatus)}
        />
        <MetricCard
          description={`${payload.input.category} · ${chargeabilityAreaLabelZh(payload.input.chargeabilityArea)} · ${chartTypeLabelZh(payload.input.chartType)}`}
          label="所选表格日期"
          value={formatVisaCutoff(payload.selectedDate)}
        />
        <MetricCard
          description={payload.uscisFilingChartNoteZh}
          label="USCIS 当月 I-485 用表"
          trend={
            payload.selectedChartUsableForAdjustment ? "同一张表" : "所选表不同"
          }
          trendTone={
            payload.selectedChartUsableForAdjustment ? "positive" : "warning"
          }
          value={chartTypeLabelZh(payload.month.uscisFilingChart)}
        />
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">结果怎么读</h3>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
          <li>先看“日期对照结果”：它只回答优先日和所选公开表格的机械关系。</li>
          <li>
            再看 USCIS 当月 I-485
            用表：如果你在美国境内考虑调整身份，所选表格还要和 USCIS
            当月选择一致。
          </li>
          <li>
            最后把类别、出生地、I-140、身份状态和个案事实交给雇主或律师核对。
          </li>
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">输入摘要</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">优先日</dt>
              <dd className="mt-1 font-semibold">
                {payload.input.priorityDate}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">月份</dt>
              <dd className="mt-1 font-semibold">{payload.month.monthKey}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">来源发布时间</dt>
              <dd className="mt-1 font-semibold">
                {payload.month.publishedAt}
              </dd>
            </div>
          </dl>
          <a
            className="mt-5 inline-flex text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
            href={payload.sourceUrl}
          >
            打开 Department of State 原始月份页面
          </a>
        </article>

        <DataTable
          caption={`${payload.month.monthKey} 中国大陆出生 EB 排期表`}
          columns={bulletinColumns}
          emptyDescription="当前月份没有可展示的排期行。"
          emptyTitle="暂无排期数据"
          getRowKey={(row) => row.category}
          rows={payload.rows}
        />
      </section>
    </section>
  );
}
