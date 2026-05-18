import Link from "next/link";
import type { ReactNode } from "react";

import { CompanyImmigrationSignalPanel } from "@/components/company/company-immigration-signal";
import { InterpretationPanel } from "@/components/search/interpretation-panel";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { SourceNote } from "@/components/source-note";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";
import type {
  PublicCompanyBreakdownRow,
  PublicCompanyFiscalYearSummary,
  PublicCompanyPermTimelineRow,
  PublicCompanyProfilePayload,
  PublicDisclosureRecordRow,
} from "@/lib/db/public-query-repository";
import {
  formatCurrency,
  h1bStatusLabels,
  permStatusLabels,
  statusLabel,
} from "@/lib/directory-search";
import { getCompanyPageSeo } from "@/lib/seo/company-quality";
import { buildFaqPageJsonLd, buildJsonLdGraph } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/site";

export type CompanyProfileMode = "h1b" | "perm";

type CompanyProfileProps = {
  mode: CompanyProfileMode;
  profile: PublicCompanyProfilePayload;
};

type FaqItem = {
  question: string;
  answer: string;
};

type WageRow = {
  label: string;
  value: number;
};

type EmployerQuestionItem = {
  label: string;
  question: string;
  reason: string;
};

const fiscalYearColumns: DataTableColumn<PublicCompanyFiscalYearSummary>[] = [
  {
    key: "year",
    header: "数据年份",
    render: (row) => `${row.fiscalYear} 财年`,
  },
  {
    key: "h1b",
    header: "H-1B / LCA",
    render: (row) =>
      row.h1bTotal === 0
        ? "暂无"
        : `${row.h1bTotal} 条（已认证 ${row.h1bCertified}，已撤回 ${row.h1bWithdrawn}，未通过 ${row.h1bDenied}）`,
  },
  {
    key: "perm",
    header: "PERM",
    render: (row) =>
      row.permTotal === 0
        ? "暂无"
        : `${row.permTotal} 条（已认证 ${row.permCertified}，未通过 ${row.permDenied}，已撤回 ${row.permWithdrawn}）`,
  },
];

const h1bRecentColumns: DataTableColumn<PublicDisclosureRecordRow>[] = [
  {
    key: "status",
    header: "状态",
    render: (row) => (
      <div>
        <p className="font-medium">
          {statusLabel(row.caseStatus, h1bStatusLabels)}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {row.fiscalYear} 财年
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
    header: "工作地点",
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
    header: "决定日期",
    render: (row) => row.decisionDate,
  },
];

const jobBreakdownColumns: DataTableColumn<PublicCompanyBreakdownRow>[] = [
  {
    key: "job",
    header: "职位 / SOC",
    render: (row) => (
      <div>
        <p className="font-medium">{row.label}</p>
        {row.socCode ? (
          <p className="mt-1 text-xs text-[var(--muted)]">
            {row.socCode} · {row.socTitle}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    key: "h1b",
    header: "H-1B",
    align: "right",
    render: (row) => row.h1bCount,
  },
  {
    key: "perm",
    header: "PERM",
    align: "right",
    render: (row) => row.permCount,
  },
  {
    key: "total",
    header: "合计",
    align: "right",
    render: (row) => row.totalCount,
  },
];

const locationBreakdownColumns: DataTableColumn<PublicCompanyBreakdownRow>[] = [
  {
    key: "location",
    header: "工作地点",
    render: (row) => row.label,
  },
  {
    key: "h1b",
    header: "H-1B",
    align: "right",
    render: (row) => row.h1bCount,
  },
  {
    key: "perm",
    header: "PERM",
    align: "right",
    render: (row) => row.permCount,
  },
  {
    key: "total",
    header: "合计",
    align: "right",
    render: (row) => row.totalCount,
  },
];

const permTimelineColumns: DataTableColumn<PublicCompanyPermTimelineRow>[] = [
  {
    key: "status",
    header: "状态",
    render: (row) => (
      <div>
        <p className="font-medium">
          {statusLabel(row.caseStatus, permStatusLabels)}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {row.fiscalYear} 财年
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
    header: "工作地点",
    render: (row) => `${row.city}, ${row.state}`,
  },
  {
    key: "dates",
    header: "日期",
    render: (row) => (
      <div className="text-sm">
        <p>接收日期：{row.receivedDate}</p>
        <p className="mt-1">决定日期：{row.decisionDate}</p>
        {row.priorityDate ? (
          <p className="mt-1 text-xs text-[var(--muted)]">
            优先日：{row.priorityDate}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    key: "wage",
    header: "记录工资",
    align: "right",
    render: (row) => formatCurrency(row.wageOfferFrom, row.wageUnit),
  },
];

const wageColumns: DataTableColumn<WageRow>[] = [
  {
    key: "label",
    header: "指标",
    render: (row) => row.label,
  },
  {
    key: "value",
    header: "公开记录工资",
    align: "right",
    render: (row) => formatCurrency(row.value, "Year"),
  },
];

export function CompanyProfile({ mode, profile }: CompanyProfileProps) {
  const faqItems = buildFaqItems(profile);
  const pageSeo = getCompanyPageSeo(profile.metrics, mode);
  const relatedCompanyItems = profile.relatedCompanies.map((related) => ({
    description:
      related.sharedSignals.slice(0, 2).join("；") ||
      "职位、SOC 或工作地点有重叠的公司。",
    href: `/${mode}/company/${related.employer.slug}`,
    meta: "相关公司",
    title: related.employer.displayName,
  }));
  const relatedEntityItems = [
    ...profile.relatedJobTitles.map((job) => ({
      description: `${job.count} 条相关公开记录`,
      href: `/companies?jobOrSoc=${encodeURIComponent(job.value)}`,
      meta: "职位",
      title: job.value,
    })),
    ...profile.relatedLocations.map((location) => ({
      description: `${location.count} 条相关公开记录`,
      href: locationHref(location.value),
      meta: "地点",
      title: location.value,
    })),
  ];
  const wageRows = profile.wageDistribution
    ? [
        { label: "最低值", value: profile.wageDistribution.min },
        { label: "25 分位", value: profile.wageDistribution.p25 },
        { label: "中位数", value: profile.wageDistribution.median },
        { label: "75 分位", value: profile.wageDistribution.p75 },
        { label: "最高值", value: profile.wageDistribution.max },
      ]
    : [];
  const jsonLd = buildJsonLd(faqItems);
  const summaryBullets = buildCompanySummaryBullets(mode, profile);
  const completenessDescription = buildCompletenessDescription(
    pageSeo.indexable,
    profile,
  );

  return (
    <div className="space-y-8">
      <JsonLdScript data={jsonLd} id="company-faq-structured-data" />

      <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">先看结论</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          {profile.employer.displayName} 当前页面汇总官方来源数据快照中的公开
          H-1B LCA、PERM 和 USCIS Employer Data Hub
          记录。先用下面三点判断这个页面能不能帮助你准备问题，再往下看年份、职位、地点和工资明细。
        </p>
        <ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--muted)] md:grid-cols-3">
          {summaryBullets.map((item) => (
            <li className="rounded-md bg-slate-50 p-4" key={item}>
              {item}
            </li>
          ))}
        </ul>
        {profile.aliases.length > 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            已映射公开记录名称：
            <span className="font-medium text-[var(--foreground)]">
              {profile.aliases.join("；")}
            </span>
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description={`已认证 ${profile.h1b.certified}，已撤回 ${profile.h1b.withdrawn}，未通过 ${profile.h1b.denied}。`}
          label="H-1B / LCA 记录"
          value={profile.h1b.total}
        />
        <MetricCard
          description={`已认证 ${profile.perm.certified}，未通过 ${profile.perm.denied}，已撤回 ${profile.perm.withdrawn}。`}
          label="PERM 记录"
          value={profile.perm.total}
        />
        <MetricCard
          description={
            profile.wageDistribution
              ? `${profile.wageDistribution.count} 条 H-1B 工资样本，${profile.wageDistribution.fiscalYears.map((year) => `${year} 财年`).join("、")}。`
              : "当前公司没有 H-1B 工资样本，工资区块会显示缺失说明。"
          }
          label="H-1B 工资中位数"
          value={
            profile.wageDistribution
              ? formatCurrency(profile.wageDistribution.median, "Year")
              : "暂无"
          }
        />
        <MetricCard
          description={completenessDescription}
          label="资料完整度"
          value={pageSeo.indexable ? "较完整" : "样本偏少"}
        />
      </section>

      <CompanyReadingGuide mode={mode} profile={profile} />

      <EmployerQuestionChecklist mode={mode} profile={profile} />

      <CompanyImmigrationSignalPanel signal={profile.immigrationSignal} />

      <InterpretationPanel title="如何读这个公司页">
        <p>{profile.interpretationNoteZh}</p>
        <p className="mt-3">
          LCA、PERM 和 USCIS Employer Data Hub
          的口径不同，不能互相替代。页面刻意展示状态、来源和样本限制，避免把公开记录包装成确定结论。
        </p>
      </InterpretationPanel>

      <CompanySection
        description="按财年汇总 H-1B LCA 与 PERM 记录，帮助判断公开数据覆盖形态。"
        title="年度公开记录摘要"
      >
        <DataTable
          caption={`${profile.employer.displayName} 年度公开记录摘要`}
          columns={fiscalYearColumns}
          emptyDescription="当前公司没有可汇总的 H-1B 或 PERM 公开记录。"
          emptyTitle="暂无年度摘要"
          getRowKey={(row) => String(row.fiscalYear)}
          rows={profile.fiscalYears}
        />
      </CompanySection>

      <CompanySection
        description="最近的 H-1B LCA 记录用于展示职位、工作地点、状态和公开工资字段。"
        title="H-1B / LCA 最近记录"
      >
        <DataTable
          caption={`${profile.employer.displayName} H-1B LCA 最近记录`}
          columns={h1bRecentColumns}
          emptyDescription="当前数据快照中没有该公司的 H-1B LCA 记录；这不代表雇主一定没有或未来不会有相关记录。"
          emptyTitle="暂无 H-1B LCA 记录"
          getRowKey={(row) => row.id}
          rows={profile.h1bRecentRecords}
        />
      </CompanySection>

      <CompanySection
        description="工资分布来自 H-1B LCA 年化工资字段，低样本时只能作为很粗略的公开数据参考。"
        title="H-1B 工资分布"
      >
        {profile.wageDistribution ? (
          <div className="space-y-3">
            <DataTable
              caption={`${profile.employer.displayName} H-1B 工资分布`}
              columns={wageColumns}
              getRowKey={(row) => row.label}
              rows={wageRows}
            />
            {profile.wageDistribution.sampleWarningZh ? (
              <p className="text-sm leading-6 text-amber-700">
                {profile.wageDistribution.sampleWarningZh}
              </p>
            ) : null}
          </div>
        ) : (
          <EmptyState
            action={
              <Link
                className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
                href="/tools/h1b-wage-level-checker"
              >
                用工资等级工具核对具体岗位
              </Link>
            }
            description="当前公司没有 H-1B LCA 工资样本，因此不显示工资分布表。没有工资样本不代表 offer 一定不合规，仍要按 SOC、地点、职责和通行工资背景核对。"
            title="暂无 H-1B 工资样本"
            tone="muted"
          />
        )}
      </CompanySection>

      <div className="grid gap-8 xl:grid-cols-2">
        <CompanySection
          description="同一职位名称和 SOC 代码会合并计数，便于看雇主公开记录集中在哪些职位。"
          title="职位分布"
        >
          <DataTable
            caption={`${profile.employer.displayName} 职位分布`}
            columns={jobBreakdownColumns}
            emptyDescription="当前公司没有可展示的职位分布数据。"
            emptyTitle="暂无职位分布"
            getRowKey={(row) => row.key}
            rows={profile.jobBreakdown}
          />
        </CompanySection>

        <CompanySection
          description="工作地点来自公开记录，不一定等于总部、远程安排或实际办公地点。"
          title="工作地点分布"
        >
          <DataTable
            caption={`${profile.employer.displayName} 工作地点分布`}
            columns={locationBreakdownColumns}
            emptyDescription="当前公司没有可展示的地点分布数据。"
            emptyTitle="暂无地点分布"
            getRowKey={(row) => row.key}
            rows={profile.locationBreakdown}
          />
        </CompanySection>
      </div>

      <CompanySection
        description="PERM 时间线只反映劳工认证公开记录中的接收、优先日和决定日期字段，不等于后续 I-140/I-485 结果。"
        title="PERM 时间线与状态"
      >
        <DataTable
          caption={`${profile.employer.displayName} PERM 时间线与状态`}
          columns={permTimelineColumns}
          emptyDescription="当前数据快照中没有该公司的 PERM 记录；这不代表雇主一定没有或未来不会有相关记录。"
          emptyTitle="暂无 PERM 记录"
          getRowKey={(row) => row.id}
          rows={profile.permTimeline}
        />
      </CompanySection>

      <RelatedLinks items={buildNextStepItems(mode)} title="下一步可以查看" />
      <RelatedLinks items={relatedCompanyItems} title="相关公司" />
      <RelatedLinks items={relatedEntityItems} title="相关职位与地点" />

      <FaqSection items={faqItems} />

      <SourceNote
        latestDataLabel={`当前页面最新数据日期：${profile.latestDataDate ?? "暂无来源日期"}。公开信息量：${pageSeo.indexable ? "较完整，可继续深入阅读" : "样本仍偏少，需要谨慎解读"}。`}
        names={profile.sourceNames}
      />

      <DisclaimerBox>
        <p>{siteConfig.fullDisclaimer}</p>
        <p className="mt-3">
          需要核对雇主名称、页面展示或隐私问题时，可通过{" "}
          <Link
            className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
            href="/corrections"
          >
            数据纠错与移除请求
          </Link>{" "}
          页面提交说明。
        </p>
      </DisclaimerBox>
    </div>
  );
}

function buildCompanySummaryBullets(
  mode: CompanyProfileMode,
  profile: PublicCompanyProfilePayload,
) {
  const hasH1B = profile.h1b.total > 0;
  const hasPerm = profile.perm.total > 0;
  const primaryText =
    mode === "h1b"
      ? hasH1B
        ? `近年公开数据中有 ${profile.h1b.total} 条 H-1B/LCA 记录，适合继续核对相似职位、地点和工资。`
        : "当前快照没有 H-1B/LCA 记录；这只是公开数据缺口，不代表雇主未来不能或不会办理。"
      : hasPerm
        ? `近年公开数据中有 ${profile.perm.total} 条 PERM 记录，适合继续核对职位、地点、状态和时间线。`
        : "当前快照没有 PERM 记录；这只是公开数据缺口，不代表雇主未来不能或不会启动流程。";
  const secondaryText =
    hasH1B && hasPerm
      ? "H-1B 和 PERM 都有公开记录，可以分开看工作签证历史和绿卡劳工认证历史。"
      : hasH1B
        ? "页面主要体现 H-1B/LCA 历史；绿卡/PERM 信号较少，需要向雇主进一步确认。"
        : hasPerm
          ? "页面主要体现 PERM 历史；H-1B/LCA 信号较少，需要结合具体岗位再问。"
          : "公开样本很少时，页面更适合作为提问起点，而不是判断雇主政策的依据。";
  const wageText = profile.wageDistribution
    ? `H-1B 工资样本中位数为 ${formatCurrency(profile.wageDistribution.median, "Year")}，只能作为公开背景，不能直接判断 offer 是否合规。`
    : "当前没有足够 H-1B 工资样本；谈薪或工资合规问题仍要核对 SOC、地点和通行工资背景。";

  return [primaryText, secondaryText, wageText];
}

function buildCompletenessDescription(
  indexable: boolean,
  profile: PublicCompanyProfilePayload,
) {
  if (indexable) {
    return "公开样本、来源和解释相对完整，适合继续深入阅读。";
  }

  const gaps = [
    profile.h1b.total === 0 ? "H-1B/LCA 记录少" : null,
    profile.perm.total === 0 ? "PERM 记录少" : null,
    profile.jobBreakdown.length === 0 ? "职位分布少" : null,
    profile.locationBreakdown.length === 0 ? "地点分布少" : null,
    profile.wageDistribution ? null : "工资样本少",
  ].filter(Boolean);

  if (gaps.length === 0) {
    return "公开数据维度仍有限，适合当作提问起点，避免直接下结论。";
  }

  return `${gaps.join("，")}；适合当作提问起点，避免直接下结论。`;
}

function CompanyReadingGuide({
  mode,
  profile,
}: {
  mode: CompanyProfileMode;
  profile: PublicCompanyProfilePayload;
}) {
  const primaryRecord =
    mode === "h1b" ? "H-1B / LCA 记录" : "PERM 劳工认证记录";
  const secondaryRecord =
    mode === "h1b" ? "USCIS employer-level 数据" : "H-1B / LCA 历史";

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">建议这样读这个公司页</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          先把公开记录当作背景研究，而不是雇主承诺。最有价值的用法，是把它转成面试、
          offer 沟通或公司移民团队可以回答的问题。
        </p>
      </div>
      <ol className="mt-5 grid gap-4 md:grid-cols-3">
        <li className="rounded-md bg-slate-50 p-4">
          <p className="text-sm font-semibold">1. 先确认公司实体</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            查看页面标题和别名映射，确认它是否接近
            offer、工资单或申请材料中会出现的雇主名称。
          </p>
        </li>
        <li className="rounded-md bg-slate-50 p-4">
          <p className="text-sm font-semibold">2. 再看相似岗位</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            优先比较 {primaryRecord}
            的职位、SOC、工作地点和年份，而不是只看公司总数。
          </p>
        </li>
        <li className="rounded-md bg-slate-50 p-4">
          <p className="text-sm font-semibold">3. 最后准备问题</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            结合 {secondaryRecord}
            、工资和 PERM 时间线，整理要问
            HR、招聘方、公司移民团队或律师的问题。
          </p>
        </li>
      </ol>
      {profile.aliases.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          当前页面没有额外别名映射；如果你发现同一雇主被拆成多个名称，可以通过纠错页提交线索。
        </p>
      ) : null}
    </section>
  );
}

function EmployerQuestionChecklist({
  mode,
  profile,
}: {
  mode: CompanyProfileMode;
  profile: PublicCompanyProfilePayload;
}) {
  const questions = buildEmployerQuestionItems(mode, profile);

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">可以直接问雇主的问题</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          公司页不能替你判断这家公司“会不会办”，但可以帮你把公开记录转成更具体的问题。
          下面这些问题适合在 offer、入职前沟通或移民流程启动前确认。
        </p>
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {questions.map((item) => (
          <li
            className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
            key={item.label}
          >
            <p className="text-xs font-semibold text-[var(--accent)]">
              {item.label}
            </p>
            <p className="mt-2 font-semibold leading-6">{item.question}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {item.reason}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function buildEmployerQuestionItems(
  mode: CompanyProfileMode,
  profile: PublicCompanyProfilePayload,
): EmployerQuestionItem[] {
  const hasH1B = profile.h1b.total > 0;
  const hasPerm = profile.perm.total > 0;
  const entityQuestion =
    profile.aliases.length > 0
      ? "我的 offer 上的雇主法定实体（legal entity）会对应这里哪个公开记录名称？"
      : "我的 offer 上的雇主法定实体（legal entity）是否就是这个页面的公司名称？";
  const entityReason =
    profile.aliases.length > 0
      ? "同一集团、子公司或历史名称可能分散在不同公开记录里，先确认实体能避免把别的公司记录误当成当前岗位背景。"
      : "如果雇主名称、子公司或 payroll 实体不同，公开记录可能需要换一个名称再查。";
  const h1bQuestion = hasH1B
    ? "这个岗位的职位、SOC、工作地点和近年 H-1B/LCA 记录是否相似？"
    : "这个岗位是否会启动 H-1B/LCA，内部流程和预计时间点是什么？";
  const h1bReason = hasH1B
    ? `页面中有 ${profile.h1b.total} 条 H-1B/LCA 公开记录，但历史记录只说明背景，不代表新岗位会自动提交。`
    : "当前快照没有 H-1B/LCA 样本，更需要直接确认岗位是否支持、谁负责提交、何时提交。";
  const permQuestion = hasPerm
    ? mode === "perm"
      ? "这个岗位的 PERM 职位、地点、启动时间和公司历史 PERM 记录是否接近？"
      : "如果未来走 PERM，公司通常何时启动，是否要求入职满一定时间？"
    : "这个岗位和雇主实体是否支持 PERM，启动条件和等待时间是什么？";
  const permReason = hasPerm
    ? `页面中有 ${profile.perm.total} 条 PERM 公开记录，可以用来准备关于职位描述、地点、时间线和流程责任人的问题。`
    : "没有 PERM 记录不等于未来不能启动，但不适合推测公司绿卡政策，需要向雇主确认。";
  const wageQuestion = profile.wageDistribution
    ? "我的 offer 工资如何按 SOC、工作地点和通行工资（prevailing wage）背景核对？"
    : "如果页面没有工资样本，公司会用哪个 SOC、地点和工资年份做工资核对？";
  const wageReason = profile.wageDistribution
    ? `页面展示 ${profile.wageDistribution.count} 条 H-1B 工资样本；它们是公开背景，不能替代正式工资等级或合规判断。`
    : "工资公开样本不足时，更要把岗位职责、经验要求、地点和工资年份问清楚。";

  return [
    {
      label: "雇主实体",
      question: entityQuestion,
      reason: entityReason,
    },
    {
      label: "H-1B / LCA",
      question: h1bQuestion,
      reason: h1bReason,
    },
    {
      label: "PERM / 绿卡流程",
      question: permQuestion,
      reason: permReason,
    },
    {
      label: "工资和职位口径",
      question: wageQuestion,
      reason: wageReason,
    },
  ];
}

function CompanySection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function FaqSection({ items }: { items: readonly FaqItem[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">常见问题</h2>
      <div className="mt-4 divide-y divide-[var(--line)] rounded-lg border border-[var(--line)] bg-white shadow-sm">
        {items.map((item) => (
          <details className="group p-5" key={item.question}>
            <summary className="cursor-pointer list-none font-semibold text-[var(--foreground)]">
              {item.question}
            </summary>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function buildNextStepItems(mode: CompanyProfileMode) {
  const sharedItems = [
    {
      title: "公司目录",
      href: "/companies",
      description: "回到公司目录，按职位、地点或年份比较其他雇主。",
      meta: "比较",
    },
    {
      title: "数据纠错与移除请求",
      href: "/corrections",
      description: "发现名称归并、来源解释或隐私展示问题时提交线索。",
      meta: "纠错",
    },
  ];

  if (mode === "h1b") {
    return [
      {
        title: "H-1B 工资等级中文判断工具",
        href: "/tools/h1b-wage-level-checker",
        description:
          "把相似 SOC、工作地点和公开工资放到通行工资（prevailing wage）背景下理解。",
        meta: "工资",
      },
      {
        title: "用 H-1B 数据做谈薪参考",
        href: "/tools/wage-negotiation-with-h1b-data",
        description: "把公开工资样本转成 offer 沟通前的问题清单。",
        meta: "谈薪",
      },
      ...sharedItems,
    ];
  }

  return [
    {
      title: "跳槽后 PERM 重办时间线估算器",
      href: "/tools/perm-restart-timeline-estimator",
      description: "理解换雇主、换职位或换地点后 PERM 可能需要重新规划的节点。",
      meta: "PERM",
    },
    {
      title: "中国 EB-2 / EB-3 优先日排期计算器",
      href: "/tools/eb2-eb3-china-priority-date-calculator",
      description: "把优先日放到指定 Visa Bulletin 月份和排期表类型下对照。",
      meta: "排期",
    },
    ...sharedItems,
  ];
}

function buildFaqItems(profile: PublicCompanyProfilePayload): FaqItem[] {
  return [
    {
      question: `${profile.employer.displayName} 的 LCA 记录能说明什么？`,
      answer:
        "LCA 记录说明 DOL OFLC 公开数据中出现过该雇主的劳工条件申请活动。它不等于 H-1B 申请获批、员工入职、岗位仍开放或雇主未来承诺。",
    },
    {
      question: "PERM 已认证是否等于绿卡获批？",
      answer:
        "不是。PERM 劳工认证是职业移民流程中的步骤之一，不等于 I-140、I-485、领馆程序或绿卡最终结果。",
    },
    {
      question: "工资分布可以直接用来判断 offer 是否合规吗？",
      answer:
        "不能。公开工资字段需要结合 SOC、工作地点、职位职责、经验要求、通行工资（prevailing wage）和当年规则理解，本站只提供信息参考。",
    },
    {
      question: "为什么不同数据源的数字可能不一致？",
      answer:
        "DOL LCA、DOL PERM 和 USCIS Employer Data Hub 的统计口径、流程节点和发布时间不同，因此应分开阅读，不能简单相加成个案结论。",
    },
  ];
}

function buildJsonLd(faqItems: readonly FaqItem[]) {
  return buildJsonLdGraph([buildFaqPageJsonLd(faqItems)]);
}

function locationHref(value: string) {
  const [city, state] = value.split(",").map((part) => part.trim());
  const params = new URLSearchParams();

  if (city) {
    params.set("city", city);
  }
  if (state) {
    params.set("state", state);
  }

  return `/companies?${params.toString()}`;
}
