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
import type { PublicCompanyDirectoryResult } from "@/lib/db/public-query-repository";
import { publicQueryRepository } from "@/lib/db/public-query-repository";
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
    title: filterCount > 0 ? "公司目录搜索结果" : "公司目录",
    description: "合并查看本地 H-1B LCA 与 PERM fixture 中的公司公开数据信号。",
    path: "/companies",
    index: false,
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
  const parsed = parseDirectorySearchParams(await searchParams);
  const result = publicQueryRepository.searchCompanyDirectory(parsed.input);
  const filterOptions = publicQueryRepository.searchCompanyDirectory({
    pageSize: 1,
  });
  const availableFilters = filterOptions.ok
    ? filterOptions.data.availableFilters
    : { caseStatuses: [], fiscalYears: [], states: [] };

  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "公司目录" }]}
      canonicalPath="/companies"
      description="把 H-1B LCA 与 PERM fixture 中的雇主记录合并成公司目录，方便从一个入口查看公开数据活动信号。筛选 URL 默认 noindex。"
      eyebrow={siteConfig.tagline}
      structuredData={buildWebPageJsonLd({
        title: "公司目录",
        description:
          "合并查看 H-1B LCA、PERM 和 USCIS Employer Data Hub 的雇主公开数据信号。",
        path: "/companies",
        pageType: "CollectionPage",
      })}
      title="公司目录"
    >
      <div className="space-y-6">
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
                description="目录与筛选参数组合在正式数据质量达标前不开放索引。"
                label="索引策略"
                value="noindex"
              />
              <MetricCard
                description="来自本地 fixture；后续会显示真实官方数据覆盖日期。"
                label="最新数据日期"
                value={result.data.latestDataDate ?? "待接入"}
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
              ? `当前本地数据最新日期：${result.data.latestDataDate ?? "待接入真实数据"}。筛选 URL 默认 noindex。`
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
