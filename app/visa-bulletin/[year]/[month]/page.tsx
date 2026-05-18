import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/page-shell";
import { SourceNote } from "@/components/source-note";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { MetricCard } from "@/components/ui/metric-card";
import { getPostgresVisaBulletinDates } from "@/lib/db/postgres-directory-queries";
import { getRuntimeDataMode } from "@/lib/db/postgres-fixture-data";
import type {
  PublicQueryResult,
  PublicVisaBulletinDatesPayload,
} from "@/lib/db/public-query-repository";
import { waitForRuntimeDataRequestBoundary } from "@/lib/db/runtime-rendering";
import { getRuntimePublicQueryRepository } from "@/lib/db/runtime-public-query-repository";
import { chartTypeLabelZh, formatVisaCutoff } from "@/lib/priority-date-tool";
import { buildDatasetJsonLd } from "@/lib/seo/json-ld";
import { buildNoIndexSeoMetadata, buildSeoMetadata } from "@/lib/seo/metadata";
import { shouldGenerateRuntimeStaticParams } from "@/lib/seo/company-static-generation";

type VisaBulletinMonthPageProps = {
  params: Promise<{
    year: string;
    month: string;
  }>;
};

type VisaBulletinMonthRow = PublicVisaBulletinDatesPayload["rows"][number];

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  if (!shouldGenerateRuntimeStaticParams()) {
    return [];
  }

  const repo = await getRuntimePublicQueryRepository();

  return repo.listVisaBulletinMonths().map((month) => ({
    year: String(month.bulletinYear),
    month: String(month.bulletinMonth).padStart(2, "0"),
  }));
}

export async function generateMetadata({
  params,
}: VisaBulletinMonthPageProps): Promise<Metadata> {
  const { year, month } = await params;
  const monthKey = toMonthKey(year, month);

  if (getRuntimeDataMode() === "postgres" && monthKey) {
    return buildSeoMetadata({
      title: `${monthKey} 中国职业移民排期 EB-1 / EB-2 / EB-3`,
      description: `查看 ${monthKey} 中国大陆出生 EB-1、EB-2、EB-3 的最终裁定表、递件排期表与 USCIS 当月 I-485 用表公开数据。`,
      path: `/visa-bulletin/${year}/${month}`,
      pageType: "data",
    });
  }

  const result = monthKey ? await getVisaBulletinPayload(monthKey) : undefined;

  if (!result?.ok) {
    return buildNoIndexSeoMetadata({
      title: "未找到 Visa Bulletin 月度页面",
      description: "当前数据快照中没有这个月份的中国职业移民排期数据。",
      path: `/visa-bulletin/${year}/${month}`,
    });
  }

  return buildSeoMetadata({
    title: `${result.data.month.monthKey} 中国职业移民排期 EB-1 / EB-2 / EB-3`,
    description: `查看 ${result.data.month.monthKey} 中国大陆出生 EB-1、EB-2、EB-3 的最终裁定表、递件排期表与 USCIS 当月 I-485 用表公开数据。`,
    path: `/visa-bulletin/${year}/${month}`,
    pageType: "data",
  });
}

export default async function VisaBulletinMonthPage({
  params,
}: VisaBulletinMonthPageProps) {
  await waitForRuntimeDataRequestBoundary();

  const { year, month } = await params;
  const monthKey = toMonthKey(year, month);

  if (!monthKey) {
    notFound();
  }

  const result = await getVisaBulletinPayload(monthKey);

  if (!result.ok) {
    notFound();
  }

  const payload = result.data;
  const tableColumns: DataTableColumn<VisaBulletinMonthRow>[] = [
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
    {
      key: "uscis-chart",
      header: "USCIS 当月对照",
      render: (row) => {
        const selected =
          payload.month.uscisFilingChart === "dates_for_filing"
            ? row.datesForFiling
            : row.finalAction;

        return (
          <span className="font-medium text-slate-950">
            {formatVisaCutoff(selected)}
          </span>
        );
      },
    },
  ];

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/visa-bulletin", label: "排期" },
        { label: payload.month.monthKey },
      ]}
      canonicalPath={`/visa-bulletin/${year}/${month}`}
      description={`${payload.month.monthKey} 中国大陆出生 EB-1、EB-2、EB-3 的 Visa Bulletin 官方来源数据快照，以及 USCIS 当月职业移民 I-485 用表选择。`}
      eyebrow="Visa Bulletin 月度页"
      structuredData={buildDatasetJsonLd({
        name: `${payload.month.monthKey} 中国职业移民排期`,
        description: `${payload.month.monthKey} 中国大陆出生 EB-1、EB-2、EB-3 的 Visa Bulletin 官方来源数据快照，以及 USCIS 当月职业移民 I-485 用表选择。`,
        path: `/visa-bulletin/${year}/${month}`,
        dateModified: payload.month.publishedAt,
        sources: [
          "U.S. Department of State Visa Bulletin",
          "USCIS Adjustment of Status filing chart",
        ],
      })}
      title={`${payload.month.monthKey} 中国职业移民排期`}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="月份" value={payload.month.monthKey} />
          <MetricCard
            description="该字段来自 USCIS Adjustment of Status Filing Charts 官方页面。"
            label="USCIS 当月 I-485 用表"
            value={chartTypeLabelZh(payload.month.uscisFilingChart)}
          />
          <MetricCard label="来源发布时间" value={payload.month.publishedAt} />
        </section>

        <DataTable
          caption={`${payload.month.monthKey} 中国大陆出生 EB 排期表`}
          columns={tableColumns}
          emptyDescription="当前月份没有可展示的排期行。"
          emptyTitle="暂无排期数据"
          getRowKey={(row) => row.category}
          rows={payload.rows}
        />

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">本月 I-485 用表提醒</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              USCIS 官方页面显示本月职业移民调整身份对照{" "}
              {chartTypeLabelZh(payload.month.uscisFilingChart)}。这只说明 USCIS
              当月公开用表选择，不代表任何个人一定可以提交 I-485。
            </p>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">用优先日计算</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              可以把优先日（priority
              date）、类别和本月排期表带入工具页，查看公开日期对照结果。
            </p>
            <Link
              className="mt-4 inline-flex text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
              href={`/tools/eb2-eb3-china-priority-date-calculator?category=EB-2&chargeabilityArea=china-mainland&priorityDate=2021-08-31&chartType=${payload.month.uscisFilingChart}&monthKey=${payload.month.monthKey}`}
            >
              打开优先日排期计算器
            </Link>
          </article>
        </section>

        <SourceNote
          latestDataLabel={`本页使用 ${payload.month.monthKey} Department of State Visa Bulletin 与 USCIS 当月 I-485 用表官方来源数据快照，来源发布日期 ${payload.month.publishedAt}。`}
          names={[
            "U.S. Department of State Visa Bulletin",
            "USCIS Adjustment of Status filing chart",
          ]}
        />

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">官方来源</h2>
          <a
            className="mt-3 inline-flex text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
            href={payload.sourceUrl}
          >
            打开 Department of State {payload.month.monthKey} 原始月份页面
          </a>
        </section>

        <DisclaimerBox>
          <p>
            {payload.interpretationNoteZh}
            本站内容仅供信息参考，不构成法律、移民、税务或职业建议。
          </p>
        </DisclaimerBox>

        <p className="text-xs text-[var(--muted)]">Last reviewed: 2026-05-16</p>
      </div>
    </PageShell>
  );
}

function toMonthKey(year: string, month: string) {
  if (!/^\d{4}$/.test(year) || !/^(0[1-9]|1[0-2])$/.test(month)) {
    return undefined;
  }

  return `${year}-${month}`;
}

async function getVisaBulletinPayload(
  monthKey: string,
): Promise<PublicQueryResult<PublicVisaBulletinDatesPayload>> {
  if (getRuntimeDataMode() === "postgres") {
    return getPostgresVisaBulletinDates({ monthKey });
  }

  const repo = await getRuntimePublicQueryRepository();
  return repo.getVisaBulletinDates({ monthKey });
}
