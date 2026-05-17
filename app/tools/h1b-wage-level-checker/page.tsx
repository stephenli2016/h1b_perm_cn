import Link from "next/link";
import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { SourceNote } from "@/components/source-note";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { ErrorState } from "@/components/ui/feedback-state";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";
import type {
  PublicH1BWageLevelCheckPayload,
  PublicWageLevelRow,
} from "@/lib/db/public-query-repository";
import { waitForRuntimeDataRequestBoundary } from "@/lib/db/runtime-rendering";
import { getRuntimePublicQueryRepository } from "@/lib/db/runtime-public-query-repository";
import type { RawSearchParams } from "@/lib/directory-search";
import {
  defaultWageLevelExample,
  parseWageLevelSearchParams,
  wageLevelValuesWithDefaults,
} from "@/lib/wage-level-tool";
import { buildWebApplicationJsonLd } from "@/lib/seo/json-ld";
import { buildSeoMetadata, hasSubmittedSearchParams } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

type H1BWageLevelCheckerPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

type RelatedCompanyRow =
  PublicH1BWageLevelCheckPayload["related"]["companies"][number];

export async function generateMetadata({
  searchParams,
}: H1BWageLevelCheckerPageProps): Promise<Metadata> {
  const hasQuery = hasSubmittedSearchParams(await searchParams);

  return buildSeoMetadata({
    title: hasQuery
      ? "H-1B 工资 Level 查询结果"
      : "H-1B 工资 Level 中文判断工具",
    description:
      "输入 SOC 或职位、worksite、offered wage 和 wage year，对照 DOL/FLAG prevailing wage level 公开数据，并查看相关 H-1B 工资样本。",
    path: "/tools/h1b-wage-level-checker",
    index: !hasQuery,
    pageType: "tool",
  });
}

const wageLevelColumns: DataTableColumn<PublicWageLevelRow>[] = [
  {
    key: "level",
    header: "Level",
    render: (row) => `Level ${row.level}`,
  },
  {
    key: "amount",
    header: "公开工资数值",
    align: "right",
    render: (row) => formatWageAmount(row.amount, "Year"),
  },
];

const relatedCompanyColumns: DataTableColumn<RelatedCompanyRow>[] = [
  {
    key: "company",
    header: "相关公司",
    render: (row) => (
      <Link
        className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
        href={row.href}
      >
        {row.employer.displayName}
      </Link>
    ),
  },
  {
    key: "records",
    header: "同 SOC 样本",
    align: "right",
    render: (row) => row.recordCount,
  },
  {
    key: "median",
    header: "年化中位数",
    align: "right",
    render: (row) =>
      row.medianAnnualWage
        ? formatWageAmount(row.medianAnnualWage, "Year")
        : "样本不足",
  },
];

export default async function H1BWageLevelCheckerPage({
  searchParams,
}: H1BWageLevelCheckerPageProps) {
  await waitForRuntimeDataRequestBoundary();

  const repo = await getRuntimePublicQueryRepository();
  const parsed = parseWageLevelSearchParams(await searchParams);
  const formValues = wageLevelValuesWithDefaults(parsed.values);
  const lookupInput = parsed.hasSubmittedValues
    ? parsed.input
    : defaultWageLevelExample;
  const result = repo.checkH1BWageLevel(lookupInput);
  const resultLabel = parsed.hasSubmittedValues ? "查询结果" : "示例结果";

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/tools", label: "工具" },
        { label: "H-1B 工资 Level" },
      ]}
      canonicalPath="/tools/h1b-wage-level-checker"
      description="输入 SOC 或英文职位关键词、worksite、工资和年份，把 offer wage 与 DOL/FLAG prevailing wage level 公开数值做近似对照。输出只解释公开数据位置，不判断个案是否合规。"
      eyebrow="H-1B 工具"
      structuredData={buildWebApplicationJsonLd({
        title: "H-1B 工资 Level 中文判断工具",
        description:
          "输入 SOC 或职位、worksite、offered wage 和 wage year，对照 DOL/FLAG prevailing wage level 公开数据，并查看相关 H-1B 工资样本。",
        path: "/tools/h1b-wage-level-checker",
        dateModified: "2026-05-16",
      })}
      title="H-1B 工资 Level 中文判断工具"
    >
      <div className="space-y-6">
        <WageLevelForm values={formValues} />

        {result.ok ? (
          <WageLevelResult
            isExample={!parsed.hasSubmittedValues}
            label={resultLabel}
            payload={result.data}
          />
        ) : (
          <ErrorState
            description={result.error.hintZh ?? result.error.messageZh}
            title={result.error.messageZh}
          />
        )}

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">如何使用这个结果</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[var(--muted)]">
              <li>
                先确认 SOC code 是否接近岗位职责；职位名称相同不代表 SOC
                一定相同。
              </li>
              <li>用实际 worksite 所在城市/州和对应 wage year 对照。</li>
              <li>如果只匹配到州级或 metro area，按较弱信号处理。</li>
              <li>
                把结果作为和雇主、律师沟通前的公开数据准备，不作为 filing 决策。
              </li>
            </ol>
          </article>

          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">常见误区</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li>工资高于某个 level，不等于 H-1B 一定合规或一定批准。</li>
              <li>
                LCA 上的 wage level 与职位职责、经验要求、地点和正式 prevailing
                wage 判断有关。
              </li>
              <li>
                公开 H-1B 工资样本是历史记录，不代表当前岗位 offer 或未来
                sponsor 承诺。
              </li>
            </ul>
          </article>
        </section>

        <SourceNote
          latestDataLabel={
            result.ok
              ? `当前相关来源最新日期：${result.data.latestDataDate ?? "暂无来源日期"}。本页使用官方来源或本地官方来源数据快照，不使用竞争网站数据。`
              : "本页使用 DOL/FLAG prevailing wage 与 DOL OFLC LCA 官方来源；当前查询未能匹配到可展示记录。"
          }
          names={
            result.ok && result.data.sourceNames.length > 0
              ? result.data.sourceNames
              : [
                  "DOL / FLAG prevailing wage data",
                  "DOL OFLC LCA / H-1B disclosure data",
                ]
          }
        />

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">官方来源入口</h2>
          <ul className="mt-4 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
            <li>
              <a
                className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
                href="https://flag.dol.gov/wage-data"
              >
                DOL/FLAG Wage Data
              </a>
            </li>
            <li>
              <a
                className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
                href="https://www.dol.gov/agencies/eta/foreign-labor/performance"
              >
                DOL OFLC Performance Data
              </a>
            </li>
          </ul>
        </section>

        <RelatedLinks
          items={[
            {
              title: "H-1B 公司数据库",
              href: "/h1b",
              description: "按公司、职位、SOC 和地区查看 LCA 公开记录。",
              meta: "数据入口",
            },
            {
              title: "公司目录",
              href: "/companies",
              description: "合并查看公司 H-1B 与 PERM 公开数据信号。",
              meta: "相关数据",
            },
            {
              title: "职业移民中文指南",
              href: "/guides",
              description: "后续会发布 wage level、LCA、PERM 和排期解释页。",
              meta: "学习",
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

function WageLevelForm({
  values,
}: {
  values: Required<ReturnType<typeof wageLevelValuesWithDefaults>>;
}) {
  return (
    <form
      action="/tools/h1b-wage-level-checker"
      className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
      method="get"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          <span>SOC code 或英文职位</span>
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.socOrJobTitle}
            name="socOrJobTitle"
            placeholder="15-1252 或 Software Engineer"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>城市</span>
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.city}
            name="city"
            placeholder="Seattle"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>州</span>
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2 uppercase"
            defaultValue={values.state}
            maxLength={2}
            name="state"
            placeholder="WA"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>Offered wage</span>
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.offeredWage}
            inputMode="decimal"
            name="offeredWage"
            placeholder="119600"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>工资单位</span>
          <select
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.wageUnit}
            name="wageUnit"
          >
            <option value="Year">Year / 年薪</option>
            <option value="Hour">Hour / 时薪</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>Wage year</span>
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2"
            defaultValue={values.wageYear}
            inputMode="numeric"
            name="wageYear"
            placeholder="2025"
          />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          type="submit"
        >
          对照 wage level
        </button>
        <Link
          className="text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
          href="/tools/h1b-wage-level-checker?socOrJobTitle=Software+Engineer&city=Seattle&state=WA&offeredWage=119600&wageUnit=Year&wageYear=2025"
        >
          查看示例
        </Link>
      </div>
    </form>
  );
}

function WageLevelResult({
  isExample,
  label,
  payload,
}: {
  isExample: boolean;
  label: string;
  payload: PublicH1BWageLevelCheckPayload;
}) {
  const comparison = payload.comparison;
  const wageRecord = payload.wageRecord;

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

      {comparison && wageRecord ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard
              description={comparison.messageZh}
              label="近似区间"
              trendTone={
                comparison.cautionLevel === "high" ? "warning" : "positive"
              }
              trend={comparison.cautionLevel === "high" ? "需核对" : "参考"}
              value={comparison.labelZh}
            />
            <MetricCard
              description={`${payload.resolvedSoc.socCode} · ${payload.resolvedSoc.socTitle}`}
              label="匹配 SOC"
              value={payload.resolvedSoc.matchedLabel}
            />
            <MetricCard
              description={`${matchScopeLabel(payload.matchScope)}；${wageRecord.areaName}`}
              label="匹配范围"
              value={`Wage year ${wageRecord.effectiveYear}`}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">对照明细</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-4 text-sm leading-6">
                <p className="font-semibold">输入工资</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  {formatWageAmount(
                    payload.input.offeredWage,
                    payload.input.wageUnit,
                  )}
                </p>
                {payload.unitConversion ? (
                  <p className="mt-2 text-[var(--muted)]">
                    {payload.unitConversion.noteZh} 换算后：
                    {formatWageAmount(
                      payload.unitConversion.comparisonAmount,
                      payload.unitConversion.comparisonUnit,
                    )}
                  </p>
                ) : (
                  <p className="mt-2 text-[var(--muted)]">
                    与 wage table 使用相同单位：
                    {formatWageAmount(
                      comparison.offeredWageForComparison,
                      comparison.offeredWageUnitForComparison,
                    )}
                  </p>
                )}
              </div>
              <DataTable
                caption="Prevailing wage level table"
                columns={wageLevelColumns.map((column) =>
                  column.key === "amount"
                    ? {
                        ...column,
                        render: (row: PublicWageLevelRow) =>
                          formatWageAmount(row.amount, wageRecord.wageUnit),
                      }
                    : column,
                )}
                getRowKey={(row) => String(row.level)}
                rows={wageRecord.levels}
              />
            </div>
            {payload.lookupStatus === "fallback" ? (
              <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm leading-6 text-[var(--warning)]">
                未找到精确城市记录，当前结果使用州级
                fallback。请把它当作较弱信号。
              </p>
            ) : null}
          </section>
        </>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <DataTable
          caption="Related H-1B companies"
          columns={relatedCompanyColumns}
          emptyDescription="当前数据中没有足够的同 SOC H-1B LCA 样本。"
          emptyTitle="暂无相关公司样本"
          getRowKey={(row) => row.employer.id}
          rows={payload.related.companies}
        />
        <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">相关样本背景</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            当前同 SOC / 地区 H-1B LCA 样本数：{payload.related.sampleCount}。
            {payload.related.sampleWarningZh ?? "样本只用于背景参考。"}
          </p>
          <h4 className="mt-5 text-sm font-semibold">常见职位</h4>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            {payload.related.jobTitles.map((item) => (
              <li key={item.value}>
                {item.value} · {item.count}
              </li>
            ))}
          </ul>
          <h4 className="mt-5 text-sm font-semibold">相关地点</h4>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            {payload.related.locations.map((item) => (
              <li key={item.value}>
                {item.value} · {item.count}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  );
}

function formatWageAmount(amount: number, unit: "Year" | "Hour") {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: unit === "Hour" ? 2 : 0,
    minimumFractionDigits: unit === "Hour" ? 2 : 0,
  }).format(amount);

  return `USD ${formatted}/${unit === "Year" ? "年" : "小时"}`;
}

function matchScopeLabel(scope: PublicH1BWageLevelCheckPayload["matchScope"]) {
  if (scope === "city_state") {
    return "城市精确匹配";
  }
  if (scope === "area_name") {
    return "Metro area 匹配";
  }
  if (scope === "state") {
    return "州级匹配";
  }

  return "匹配范围未知";
}
