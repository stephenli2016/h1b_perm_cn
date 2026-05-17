import Link from "next/link";
import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { DirectoryFilterForm } from "@/components/search/directory-filter-form";
import { InterpretationPanel } from "@/components/search/interpretation-panel";
import { Pagination } from "@/components/search/pagination";
import { SourceNote } from "@/components/source-note";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { ErrorState } from "@/components/ui/feedback-state";
import { MetricCard } from "@/components/ui/metric-card";
import { getRuntimeDataMode } from "@/lib/db/postgres-fixture-data";
import { searchPostgresPermRecords } from "@/lib/db/postgres-directory-queries";
import type { PublicDisclosureRecordRow } from "@/lib/db/public-query-repository";
import { waitForRuntimeDataRequestBoundary } from "@/lib/db/runtime-rendering";
import { getRuntimePublicQueryRepository } from "@/lib/db/runtime-public-query-repository";
import {
  activeFilterCount,
  formatCurrency,
  parseDirectorySearchParams,
  permStatusLabels,
  statusLabel,
  type RawSearchParams,
} from "@/lib/directory-search";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

type PermPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: PermPageProps): Promise<Metadata> {
  const parsed = parseDirectorySearchParams(await searchParams);
  const filterCount = activeFilterCount(parsed.values);

  return buildSeoMetadata({
    title:
      filterCount > 0 ? "PERM / 绿卡公司搜索结果" : "PERM / 绿卡公司数据库",
    description:
      "查询公司 PERM 劳工认证公开记录，按雇主、职位、地点和状态理解绿卡 sponsor 历史信号。",
    path: "/perm",
    index: filterCount === 0,
    pageType: "data",
  });
}

const permColumns: DataTableColumn<PublicDisclosureRecordRow>[] = [
  {
    key: "employer",
    header: "雇主",
    render: (row) => (
      <div>
        <Link
          className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
          href={row.companyHref}
        >
          {row.employer.displayName}
        </Link>
        <p className="mt-1 text-xs text-[var(--muted)]">{row.caseNumber}</p>
      </div>
    ),
  },
  {
    key: "year-status",
    header: "年份 / 状态",
    render: (row) => (
      <div>
        <p className="font-medium">FY{row.fiscalYear}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {statusLabel(row.caseStatus, permStatusLabels)}
        </p>
      </div>
    ),
  },
  {
    key: "job",
    header: "职位 / SOC",
    render: (row) => (
      <div>
        <p className="font-medium">{row.jobTitle}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {row.socCode} · {row.socTitle}
        </p>
      </div>
    ),
  },
  {
    key: "location",
    header: "Worksite",
    render: (row) => `${row.city}, ${row.state}`,
  },
  {
    key: "wage",
    header: "Offer wage",
    align: "right",
    render: (row) => formatCurrency(row.wageAmount, row.wageUnit),
  },
  {
    key: "decision",
    header: "Decision date",
    render: (row) => row.decisionDate,
  },
];

export default async function PermPage({ searchParams }: PermPageProps) {
  await waitForRuntimeDataRequestBoundary();

  const parsed = parseDirectorySearchParams(await searchParams);
  const filterCount = activeFilterCount(parsed.values);
  const result =
    getRuntimeDataMode() === "postgres"
      ? await searchPostgresPermRecords(parsed.input)
      : (await getRuntimePublicQueryRepository()).searchPermRecords(
          parsed.input,
        );
  const availableFilters = result.ok
    ? result.data.availableFilters
    : { caseStatuses: [], fiscalYears: [], states: [] };

  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "PERM" }]}
      canonicalPath="/perm"
      description="查询公司 PERM 劳工认证公开记录，按雇主、职位、地点和状态理解绿卡 sponsor 历史信号。PERM 记录不等于 I-140、I-485 或绿卡结果。"
      eyebrow={siteConfig.tagline}
      structuredData={buildWebPageJsonLd({
        title: "PERM / 绿卡公司数据库",
        description:
          "基于 DOL OFLC PERM disclosure data 的雇主职业移民公开数据信号入口。",
        path: "/perm",
      })}
      title="PERM / 绿卡公司数据库"
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">PERM 是劳工认证节点</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              PERM certified 不等于 I-140 approved，也不等于 I-485
              可提交或绿卡获批。
            </p>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">看职位和地点</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              PERM 围绕具体 permanent job
              opportunity。公司总数之外，更要看职位、地点和年份。
            </p>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">用来问政策</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              把公开记录当作向 HR
              询问绿卡启动时间、岗位要求和律师流程的准备材料。
            </p>
          </article>
        </section>

        <DirectoryFilterForm
          action="/perm"
          caseStatusLabels={permStatusLabels}
          caseStatuses={availableFilters.caseStatuses}
          fiscalYears={availableFilters.fiscalYears}
          states={availableFilters.states}
          submitLabel="搜索 PERM 记录"
          values={parsed.values}
        />

        {result.ok ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                description="基于当前筛选条件的 PERM 公开记录数。"
                label="匹配记录"
                value={result.data.pagination.totalResults}
              />
              <MetricCard
                description={
                  filterCount > 0
                    ? "筛选结果页不收录，避免参数组合造成低价值页面。"
                    : "PERM 入口页已开放索引；公司页按数据质量阈值判断。"
                }
                label="页面收录"
                value={filterCount > 0 ? "筛选页 noindex" : "入口页 index"}
              />
              <MetricCard
                description="来自官方公开数据导入；展示当前数据库覆盖的最新日期。"
                label="最新数据日期"
                value={result.data.latestDataDate ?? "暂无来源日期"}
              />
            </section>

            <DataTable
              caption="PERM 搜索结果"
              columns={permColumns}
              emptyDescription="当前筛选条件没有匹配的 PERM 公开记录样本。可以减少筛选条件或回到全部记录。"
              emptyTitle="没有找到 PERM 记录"
              getRowKey={(row) => row.id}
              rows={result.data.records}
            />

            <Pagination
              basePath="/perm"
              currentParams={parsed.currentParams}
              pagination={result.data.pagination}
            />

            <InterpretationPanel title="如何解读 PERM 搜索结果">
              <p>
                PERM disclosure data 反映 DOL 劳工认证公开记录。Certified PERM
                不等于 I-140 批准、I-485 可提交或绿卡获批；Denied/Withdrawn
                也不能直接推断个案细节。请把这些记录看作雇主历史活动和职位/地区分布信号。
              </p>
            </InterpretationPanel>
          </>
        ) : (
          <ErrorState
            description={result.error.hintZh ?? result.error.messageZh}
            title={result.error.messageZh}
          />
        )}

        <SourceNote
          latestDataLabel={
            result.ok
              ? `当前官方公开数据最新日期：${result.data.latestDataDate ?? "暂无来源日期"}。筛选结果页默认 noindex，入口页和合格公司页可被收录。`
              : undefined
          }
          names={["DOL OFLC PERM disclosure data"]}
        />

        <DisclaimerBox compact>
          <p>
            {result.ok
              ? result.data.interpretationNoteZh
              : siteConfig.shortDisclaimer}
          </p>
        </DisclaimerBox>
      </div>
    </PageShell>
  );
}
