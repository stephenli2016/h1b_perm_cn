import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { SourceNote } from "@/components/source-note";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { getPostgresVisaBulletinDates } from "@/lib/db/postgres-directory-queries";
import { getRuntimeDataMode } from "@/lib/db/postgres-fixture-data";
import type { PublicVisaBulletinDatesPayload } from "@/lib/db/public-query-repository";
import { waitForRuntimeDataRequestBoundary } from "@/lib/db/runtime-rendering";
import { getRuntimePublicQueryRepository } from "@/lib/db/runtime-public-query-repository";
import { buildDatasetJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildRouteSeoMetadata("/visa-bulletin");

type VisaBulletinRow = PublicVisaBulletinDatesPayload["rows"][number];

export default async function VisaBulletinPage() {
  await waitForRuntimeDataRequestBoundary();

  const result =
    getRuntimeDataMode() === "postgres"
      ? await getPostgresVisaBulletinDates()
      : await getRuntimePublicQueryRepository().then((repo) => {
          const latestMonth = repo.listVisaBulletinMonths()[0];
          return latestMonth
            ? repo.getVisaBulletinDates({ monthKey: latestMonth.monthKey })
            : undefined;
        });
  const latestMonth = result?.ok ? result.data.month : undefined;
  const rows = result?.ok ? result.data.rows : [];
  const tableColumns: DataTableColumn<VisaBulletinRow>[] = [
    {
      key: "category",
      header: "类别",
      render: (row) => (
        <span className="font-medium text-slate-950">{row.category}</span>
      ),
    },
    {
      key: "final-action",
      header: "Final Action Date",
      render: (row) => formatCutoff(row.finalAction),
    },
    {
      key: "dates-for-filing",
      header: "Dates for Filing",
      render: (row) => formatCutoff(row.datesForFiling),
    },
    {
      key: "selected-chart",
      header: "当月 I-485 对照表",
      render: (row) => {
        const selected =
          latestMonth?.uscisFilingChart === "dates_for_filing"
            ? row.datesForFiling
            : row.finalAction;

        return (
          <span className="font-medium text-slate-950">
            {formatCutoff(selected)}
          </span>
        );
      },
    },
  ];

  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "排期" }]}
      canonicalPath="/visa-bulletin"
      description="中国大陆出生 EB-1、EB-2、EB-3 的 Department of State Visa Bulletin 官方来源数据快照，以及 USCIS 当月 filing chart 选择。"
      eyebrow="Visa Bulletin"
      structuredData={buildDatasetJsonLd({
        name: "中国职业移民排期",
        description:
          "中国大陆出生 EB-1、EB-2、EB-3 的 Department of State Visa Bulletin 官方来源数据快照，以及 USCIS 当月 filing chart 选择。",
        path: "/visa-bulletin",
        dateModified: latestMonth?.publishedAt,
        sources: [
          "U.S. Department of State Visa Bulletin",
          "USCIS Adjustment of Status filing chart",
        ],
      })}
      title="中国职业移民排期"
    >
      {latestMonth ? (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="月份" value={latestMonth.monthKey} />
            <MetricCard
              label="USCIS filing chart"
              value={chartLabelZh(latestMonth.uscisFilingChart)}
            />
            <MetricCard label="最近来源日期" value={latestMonth.publishedAt} />
          </div>

          <DataTable
            caption={`${latestMonth.monthKey} 中国大陆出生 EB 排期表`}
            columns={tableColumns}
            emptyDescription="当前月份没有可展示的排期行。"
            emptyTitle="暂无排期数据"
            getRowKey={(row) => row.category}
            rows={rows}
          />

          <DisclaimerBox compact>
            <p>
              日期对照只表示公开表格中的 cut-off date。是否能提交 I-485 还要看
              USCIS
              当月选择、个人类别、chargeability、身份和案件事实。本站内容仅供信息参考，不构成法律、移民、税务或职业建议。
            </p>
          </DisclaimerBox>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              href={`/visa-bulletin/${latestMonth.bulletinYear}/${String(
                latestMonth.bulletinMonth,
              ).padStart(2, "0")}`}
            >
              查看本月详情
            </Link>
            <Link
              className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-slate-50"
              href={`/tools/eb2-eb3-china-priority-date-calculator?category=EB-2&chargeabilityArea=china-mainland&priorityDate=2021-08-31&chartType=${latestMonth.uscisFilingChart}&monthKey=${latestMonth.monthKey}`}
            >
              用优先日计算
            </Link>
          </div>
        </section>
      ) : (
        <EmptyState
          description="请先导入 Department of State Visa Bulletin 与 USCIS filing chart 官方来源数据。"
          title="暂无 Visa Bulletin 数据"
          tone="warning"
        />
      )}

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="border-t border-slate-200 pt-4">
          <h2 className="text-base font-semibold text-slate-950">
            Final Action Date
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            通常用于判断是否有移民签证名额可用于最终批准或签证签发。
          </p>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <h2 className="text-base font-semibold text-slate-950">
            Dates for Filing
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            通常用于国务院/NVC 文件准备；在美国境内调整身份时，还要看 USCIS
            当月是否允许使用。
          </p>
        </div>
      </section>

      <div className="mt-6">
        <SourceNote
          latestDataLabel={
            latestMonth
              ? `本页使用 ${latestMonth.monthKey} Department of State Visa Bulletin 与 USCIS filing chart 官方来源数据快照，来源发布日期 ${latestMonth.publishedAt}。`
              : "本页尚无 Visa Bulletin 数据。"
          }
          names={[
            "U.S. Department of State Visa Bulletin",
            "USCIS Adjustment of Status filing chart",
          ]}
        />
      </div>
    </PageShell>
  );
}

function chartLabelZh(chart: "final_action" | "dates_for_filing") {
  return chart === "final_action" ? "Final Action Dates" : "Dates for Filing";
}

function formatCutoff(
  date:
    | {
        cutoffDate?: string;
        cutoffStatus: "date" | "current" | "unavailable";
        rawValue: string;
      }
    | undefined,
) {
  if (!date) {
    return "暂无";
  }
  if (date.cutoffStatus === "current") {
    return "Current";
  }
  if (date.cutoffStatus === "unavailable") {
    return "Unavailable";
  }
  return date.cutoffDate ?? date.rawValue;
}
