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
import { getCanonicalUrl, siteConfig } from "@/lib/site";

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

const fiscalYearColumns: DataTableColumn<PublicCompanyFiscalYearSummary>[] = [
  {
    key: "year",
    header: "Fiscal year",
    render: (row) => `FY${row.fiscalYear}`,
  },
  {
    key: "h1b",
    header: "H-1B / LCA",
    render: (row) =>
      row.h1bTotal === 0
        ? "暂无"
        : `${row.h1bTotal} 条（Certified ${row.h1bCertified}，Withdrawn ${row.h1bWithdrawn}，Denied ${row.h1bDenied}）`,
  },
  {
    key: "perm",
    header: "PERM",
    render: (row) =>
      row.permTotal === 0
        ? "暂无"
        : `${row.permTotal} 条（Certified ${row.permCertified}，Denied ${row.permDenied}，Withdrawn ${row.permWithdrawn}）`,
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
        <p className="mt-1 text-xs text-[var(--muted)]">FY{row.fiscalYear}</p>
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
    header: "Worksite location",
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
        <p className="mt-1 text-xs text-[var(--muted)]">FY{row.fiscalYear}</p>
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
    key: "dates",
    header: "日期",
    render: (row) => (
      <div className="text-sm">
        <p>Received: {row.receivedDate}</p>
        <p className="mt-1">Decision: {row.decisionDate}</p>
        {row.priorityDate ? (
          <p className="mt-1 text-xs text-[var(--muted)]">
            Priority date: {row.priorityDate}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    key: "wage",
    header: "Offer wage",
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
  const canonicalPath = `/${mode}/company/${profile.employer.slug}`;
  const relatedCompanyItems = profile.relatedCompanies.map((related) => ({
    description:
      related.sharedSignals.slice(0, 2).join("；") ||
      "职位、SOC 或 worksite 有重叠的公司。",
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

  return (
    <div className="space-y-8">
      <JsonLdScript data={jsonLd} id="company-faq-structured-data" />

      <section>
        <h2 className="text-xl font-semibold">雇主摘要</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          {profile.employer.displayName} 当前页面汇总官方来源数据快照中的公开
          H-1B LCA、PERM 和 USCIS Employer Data Hub
          信号。记录数量、职位、地点和工资分布只能说明历史公开数据形态，不代表雇主当前政策或个案结果。
        </p>
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
          description={`Certified ${profile.h1b.certified}，Withdrawn ${profile.h1b.withdrawn}，Denied ${profile.h1b.denied}。`}
          label="H-1B / LCA 记录"
          value={profile.h1b.total}
        />
        <MetricCard
          description={`Certified ${profile.perm.certified}，Denied ${profile.perm.denied}，Withdrawn ${profile.perm.withdrawn}。`}
          label="PERM 记录"
          value={profile.perm.total}
        />
        <MetricCard
          description={
            profile.wageDistribution
              ? `${profile.wageDistribution.count} 条 H-1B 工资样本，${profile.wageDistribution.fiscalYears.map((year) => `FY${year}`).join("、")}。`
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
          description={
            pageSeo.indexable
              ? "该公司页有足够的来源、样本和可见解释，适合公开收录。"
              : pageSeo.noindexReasonZh
          }
          label="页面质量状态"
          value={pageSeo.indexable ? "可公开收录" : "暂不收录"}
        />
      </section>

      <CompanyReadingGuide mode={mode} profile={profile} />

      <CompanyImmigrationSignalPanel signal={profile.immigrationSignal} />

      <InterpretationPanel title="如何读这个公司页">
        <p>{profile.interpretationNoteZh}</p>
        <p className="mt-3">
          LCA、PERM 和 USCIS Employer Data Hub
          的口径不同，不能互相替代。页面刻意展示状态、来源和样本限制，避免把公开记录包装成确定结论。
        </p>
      </InterpretationPanel>

      <CompanySection
        description="按 fiscal year 汇总 H-1B LCA 与 PERM 记录，帮助判断公开数据覆盖形态。"
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
        description="最近的 H-1B LCA 记录用于展示职位、worksite、状态和公开工资字段。"
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
            description="当前公司没有 H-1B LCA 工资样本，因此不显示工资分布表。"
            title="暂无 H-1B 工资样本"
            tone="muted"
          />
        )}
      </CompanySection>

      <div className="grid gap-8 xl:grid-cols-2">
        <CompanySection
          description="同一职位名称和 SOC code 会合并计数，便于看雇主公开记录集中在哪些职位。"
          title="职位 breakdown"
        >
          <DataTable
            caption={`${profile.employer.displayName} 职位 breakdown`}
            columns={jobBreakdownColumns}
            emptyDescription="当前公司没有职位 breakdown 数据。"
            emptyTitle="暂无职位分布"
            getRowKey={(row) => row.key}
            rows={profile.jobBreakdown}
          />
        </CompanySection>

        <CompanySection
          description="Worksite location 是公开记录中的工作地点字段，不一定等于总部、远程安排或实际办公地点。"
          title="Worksite location breakdown"
        >
          <DataTable
            caption={`${profile.employer.displayName} worksite location breakdown`}
            columns={locationBreakdownColumns}
            emptyDescription="当前公司没有地点 breakdown 数据。"
            emptyTitle="暂无地点分布"
            getRowKey={(row) => row.key}
            rows={profile.locationBreakdown}
          />
        </CompanySection>
      </div>

      <CompanySection
        description="PERM timeline 只反映劳工认证公开记录中的 received、priority 和 decision 字段，不等于后续 I-140/I-485 结果。"
        title="PERM timeline 与状态"
      >
        <DataTable
          caption={`${profile.employer.displayName} PERM timeline 与状态`}
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
        latestDataLabel={`当前页面最新数据日期：${profile.latestDataDate ?? "暂无来源日期"}。页面质量状态：${pageSeo.indexable ? "达到公开收录阈值" : "未达到公开收录阈值"}。`}
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

      <p className="sr-only">Canonical URL: {getCanonicalUrl(canonicalPath)}</p>
    </div>
  );
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
          offer 沟通或内部 immigration team 可以回答的问题。
        </p>
      </div>
      <ol className="mt-5 grid gap-4 md:grid-cols-3">
        <li className="rounded-md bg-slate-50 p-4">
          <p className="text-sm font-semibold">1. 先确认公司实体</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            查看页面标题和别名映射，确认它是否接近 offer、payroll 或 filing
            中会出现的雇主名称。
          </p>
        </li>
        <li className="rounded-md bg-slate-50 p-4">
          <p className="text-sm font-semibold">2. 再看相似岗位</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            优先比较 {primaryRecord}
            的职位、SOC、worksite 和年份，而不是只看公司总数。
          </p>
        </li>
        <li className="rounded-md bg-slate-50 p-4">
          <p className="text-sm font-semibold">3. 最后准备问题</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            结合 {secondaryRecord}
            、工资和 PERM timeline，整理要问 HR、recruiter 或律师的问题。
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
        title: "H-1B 工资 Level 中文判断工具",
        href: "/tools/h1b-wage-level-checker",
        description:
          "把相似 SOC、worksite 和公开工资放到 prevailing wage 背景下理解。",
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
      description:
        "把 priority date 放到指定 Visa Bulletin 月份和 chart type 下对照。",
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
        "LCA 记录说明 DOL OFLC 公开数据中出现过该雇主的劳工条件申请活动。它不等于 H-1B petition 批准、员工入职、岗位仍开放或雇主未来承诺。",
    },
    {
      question: "PERM Certified 是否等于绿卡获批？",
      answer:
        "不是。PERM certification 是职业移民流程中的劳工认证步骤之一，不等于 I-140、I-485、领馆程序或绿卡最终结果。",
    },
    {
      question: "工资分布可以直接用来判断 offer 是否合规吗？",
      answer:
        "不能。公开工资字段需要结合 SOC、worksite、职位职责、经验要求、prevailing wage 和当年规则理解，本站只提供信息参考。",
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
