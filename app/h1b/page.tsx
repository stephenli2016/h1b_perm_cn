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
import { searchPostgresH1BRecords } from "@/lib/db/postgres-directory-queries";
import type { PublicDisclosureRecordRow } from "@/lib/db/public-query-repository";
import { waitForRuntimeDataRequestBoundary } from "@/lib/db/runtime-rendering";
import { getRuntimePublicQueryRepository } from "@/lib/db/runtime-public-query-repository";
import {
  activeFilterCount,
  formatCurrency,
  h1bStatusLabels,
  parseDirectorySearchParams,
  statusLabel,
  type RawSearchParams,
} from "@/lib/directory-search";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

type H1BPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: H1BPageProps): Promise<Metadata> {
  const parsed = parseDirectorySearchParams(await searchParams);
  const filterCount = activeFilterCount(parsed.values);

  return buildSeoMetadata({
    title: filterCount > 0 ? "H-1B 公司搜索结果" : "H-1B 公司数据库",
    description:
      "按雇主、年份、州/城市、职位/SOC 和 case status 查询官方 H-1B LCA 公开记录样本。",
    path: "/h1b",
    index: false,
    pageType: "data",
  });
}

const h1bColumns: DataTableColumn<PublicDisclosureRecordRow>[] = [
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
          {statusLabel(row.caseStatus, h1bStatusLabels)}
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
    header: "年化工资",
    align: "right",
    render: (row) => formatCurrency(row.wageAmount, row.wageUnit),
  },
  {
    key: "decision",
    header: "Decision date",
    render: (row) => row.decisionDate,
  },
];

export default async function H1BPage({ searchParams }: H1BPageProps) {
  await waitForRuntimeDataRequestBoundary();

  const parsed = parseDirectorySearchParams(await searchParams);
  const result =
    getRuntimeDataMode() === "postgres"
      ? await searchPostgresH1BRecords(parsed.input)
      : (await getRuntimePublicQueryRepository()).searchH1BRecords(
          parsed.input,
        );
  const availableFilters = result.ok
    ? result.data.availableFilters
    : { caseStatuses: [], fiscalYears: [], states: [] };

  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "H-1B" }]}
      canonicalPath="/h1b"
      description="按雇主、年份、地区、职位/SOC 和 case status 查看官方 H-1B LCA 公开记录样本。本目录和筛选 URL 在公开上线前保持 noindex。"
      eyebrow={siteConfig.tagline}
      structuredData={buildWebPageJsonLd({
        title: "H-1B 公司数据库",
        description:
          "基于 DOL OFLC LCA 和 USCIS Employer Data Hub 的 H-1B 雇主公开数据信号入口。",
        path: "/h1b",
      })}
      title="H-1B 公司数据库"
    >
      <div className="space-y-6">
        <DirectoryFilterForm
          action="/h1b"
          caseStatusLabels={h1bStatusLabels}
          caseStatuses={availableFilters.caseStatuses}
          fiscalYears={availableFilters.fiscalYears}
          states={availableFilters.states}
          submitLabel="搜索 H-1B 记录"
          values={parsed.values}
        />

        {result.ok ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                description="基于当前筛选条件的 LCA 记录数。"
                label="匹配记录"
                value={result.data.pagination.totalResults}
              />
              <MetricCard
                description="筛选 URL 默认 noindex，避免参数组合造成 SEO 垃圾页。"
                label="索引策略"
                value="noindex"
              />
              <MetricCard
                description="来自官方公开数据导入；展示当前数据库覆盖的最新日期。"
                label="最新数据日期"
                value={result.data.latestDataDate ?? "待接入"}
              />
            </section>

            <DataTable
              caption="H-1B LCA 搜索结果"
              columns={h1bColumns}
              emptyDescription="当前筛选条件没有匹配的 H-1B LCA 公开记录样本。可以减少筛选条件或回到全部记录。"
              emptyTitle="没有找到 H-1B 记录"
              getRowKey={(row) => row.id}
              rows={result.data.records}
            />

            <Pagination
              basePath="/h1b"
              currentParams={parsed.currentParams}
              pagination={result.data.pagination}
            />

            <InterpretationPanel title="如何解读 H-1B 搜索结果">
              <p>
                LCA 是劳工条件申请记录，Certified LCA
                只表示该劳工条件申请在公开数据中显示为 certified，不等于 H-1B
                petition 批准、雇主实际录用或未来 sponsor
                承诺。工资字段使用公开记录中的年化展示，仍需结合
                SOC、worksite、职位职责和当年 prevailing wage 理解。
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
              ? `当前官方公开数据最新日期：${result.data.latestDataDate ?? "待接入真实数据"}。筛选 URL 默认 noindex。`
              : undefined
          }
          names={[
            "DOL OFLC LCA / H-1B disclosure data",
            "USCIS H-1B Employer Data Hub",
          ]}
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
