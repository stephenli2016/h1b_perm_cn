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
import { searchPostgresCompanyDirectory } from "@/lib/db/postgres-directory-queries";
import type { PublicCompanyDirectoryResult } from "@/lib/db/public-query-repository";
import { waitForRuntimeDataRequestBoundary } from "@/lib/db/runtime-rendering";
import { getRuntimePublicQueryRepository } from "@/lib/db/runtime-public-query-repository";
import {
  activeFilterCount,
  combinedStatusLabels,
  parseDirectorySearchParams,
  type RawSearchParams,
} from "@/lib/directory-search";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

type CompaniesPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: CompaniesPageProps): Promise<Metadata> {
  const parsed = parseDirectorySearchParams(await searchParams);
  const filterCount = activeFilterCount(parsed.values);

  return buildSeoMetadata({
    title: filterCount > 0 ? "公司目录搜索结果" : "H-1B / PERM 公司目录",
    description:
      "搜索公司 H-1B、PERM、职位、地点和公开数据覆盖情况，用中文理解雇主 sponsor 历史信号。",
    path: "/companies",
    index: filterCount === 0,
    pageType: "data",
  });
}

const companyColumns: DataTableColumn<PublicCompanyDirectoryResult>[] = [
  {
    key: "employer",
    header: "公司",
    render: (row) => (
      <div>
        <p className="font-semibold text-slate-950">
          {row.employer.displayName}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Link
            className="rounded-md border border-[var(--line)] px-2 py-1 font-semibold"
            href={`/h1b/company/${row.employer.slug}`}
          >
            H-1B 页
          </Link>
          <Link
            className="rounded-md border border-[var(--line)] px-2 py-1 font-semibold"
            href={`/perm/company/${row.employer.slug}`}
          >
            PERM 页
          </Link>
        </div>
      </div>
    ),
  },
  {
    key: "records",
    header: "匹配记录",
    render: (row) => (
      <div>
        <p className="font-medium">{row.matchedRecordCount} 条</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          H-1B {row.h1bRecordCount} · PERM {row.permRecordCount}
        </p>
      </div>
    ),
  },
  {
    key: "latest-year",
    header: "最新 FY",
    render: (row) => `FY${row.latestFiscalYear}`,
  },
  {
    key: "top-job",
    header: "主要职位",
    render: (row) => row.topJobTitles[0]?.value ?? "暂无",
  },
  {
    key: "top-location",
    header: "主要地点",
    render: (row) => row.topLocations[0]?.value ?? "暂无",
  },
  {
    key: "indexing",
    header: "页面索引",
    render: (row) =>
      row.indexable ? (
        <span className="font-medium text-[var(--accent-strong)]">
          达到阈值
        </span>
      ) : (
        <span className="text-[var(--muted)]">noindex</span>
      ),
  },
];

export default async function CompaniesPage({
  searchParams,
}: CompaniesPageProps) {
  await waitForRuntimeDataRequestBoundary();

  const parsed = parseDirectorySearchParams(await searchParams);
  const filterCount = activeFilterCount(parsed.values);
  const result =
    getRuntimeDataMode() === "postgres"
      ? await searchPostgresCompanyDirectory(parsed.input)
      : (await getRuntimePublicQueryRepository()).searchCompanyDirectory(
          parsed.input,
        );
  const availableFilters = result.ok
    ? result.data.availableFilters
    : { caseStatuses: [], fiscalYears: [], states: [] };

  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "公司目录" }]}
      canonicalPath="/companies"
      description="搜索公司 H-1B、PERM、职位、地点和公开数据覆盖情况。适合投递前、面试前或 offer 沟通前做背景研究。"
      eyebrow={siteConfig.tagline}
      structuredData={buildWebPageJsonLd({
        title: "H-1B / PERM 公司目录",
        description: "搜索公司 H-1B、PERM、职位、地点和公开数据覆盖情况。",
        path: "/companies",
        pageType: "CollectionPage",
      })}
      title="H-1B / PERM 公司目录"
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">适合什么时候用</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              拿到面试或 offer 前，先确认公司是否在官方公开数据里有 H-1B 或 PERM
              历史记录。
            </p>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">不要只看总数</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              同一家公司不同实体、地点和职位差异很大。请继续打开公司页看别名、年份、职位和地点。
            </p>
          </article>
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">没有记录怎么理解</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              没有公开记录不等于一定不能
              sponsor，只说明当前数据覆盖下没有找到可展示样本。
            </p>
          </article>
        </section>

        <DirectoryFilterForm
          action="/companies"
          caseStatusLabels={combinedStatusLabels}
          caseStatuses={availableFilters.caseStatuses}
          fiscalYears={availableFilters.fiscalYears}
          states={availableFilters.states}
          submitLabel="搜索公司"
          values={parsed.values}
        />

        {result.ok ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                description="基于当前筛选条件聚合后的公司数。"
                label="匹配公司"
                value={result.data.pagination.totalResults}
              />
              <MetricCard
                description={
                  filterCount > 0
                    ? "筛选结果页不收录，避免把参数组合提交给搜索引擎。"
                    : "公司目录入口页已开放索引；具体公司页按质量阈值判断。"
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
              caption="公司目录搜索结果"
              columns={companyColumns}
              emptyDescription="当前筛选条件没有匹配公司。可以减少筛选条件或回到全部公司。"
              emptyTitle="没有找到公司"
              getRowKey={(row) => row.employer.id}
              rows={result.data.results}
            />

            <Pagination
              basePath="/companies"
              currentParams={parsed.currentParams}
              pagination={result.data.pagination}
            />

            <InterpretationPanel title="如何解读公司目录">
              <p>
                这里的公司匹配来自 H-1B LCA 和 PERM
                公开记录的聚合。记录数量、职位和地点分布可以作为历史活动信号，但不能直接推出雇主当前招聘政策、未来
                sponsor 承诺或个案结果。公司页是否 index
                仍会按数据量和质量阈值单独判断。
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
          names={[
            "DOL OFLC LCA / H-1B disclosure data",
            "DOL OFLC PERM disclosure data",
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
