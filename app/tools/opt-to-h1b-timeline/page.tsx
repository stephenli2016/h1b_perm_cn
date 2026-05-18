import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { SourceNote } from "@/components/source-note";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";
import type { RawSearchParams } from "@/lib/directory-search";
import { buildWebApplicationJsonLd } from "@/lib/seo/json-ld";
import { buildSeoMetadata, hasSubmittedSearchParams } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

type OptTimelinePageProps = {
  searchParams?: Promise<RawSearchParams>;
};

const stageOptions = [
  { value: "final-semester", label: "还在最后一个学期" },
  { value: "opt-pending", label: "OPT 申请中" },
  { value: "opt-active", label: "Post-completion OPT 已开始" },
  { value: "stem-opt-active", label: "STEM OPT 已开始" },
] as const;

const employerOptions = [
  { value: "not-started", label: "还没和雇主谈 H-1B" },
  { value: "hr-conversation", label: "已和 HR/招聘方初步沟通" },
  { value: "immigration-team", label: "公司移民事务负责人已介入" },
] as const;

const capOptions = [
  { value: "before-registration", label: "还没到注册季" },
  { value: "registered", label: "已提交 H-1B 注册" },
  { value: "selected", label: "已被抽中，准备申请" },
  { value: "not-selected", label: "本轮未被抽中" },
] as const;

export async function generateMetadata({
  searchParams,
}: OptTimelinePageProps): Promise<Metadata> {
  const hasQuery = hasSubmittedSearchParams(await searchParams);

  return buildSeoMetadata({
    title: hasQuery ? "OPT 到 H-1B 时间线结果" : "OPT 到 H-1B 时间线规划器",
    description:
      "按毕业、OPT/STEM OPT、H-1B cap season 和雇主准备节点生成通用核对时间线。",
    path: "/tools/opt-to-h1b-timeline",
    index: !hasQuery,
    pageType: "tool",
  });
}

export default async function OptToH1BTimelinePage({
  searchParams,
}: OptTimelinePageProps) {
  const params = await searchParams;
  const stage = pickOption(stageOptions, firstValue(params?.stage));
  const employer = pickOption(employerOptions, firstValue(params?.employer));
  const cap = pickOption(capOptions, firstValue(params?.cap));
  const result = buildTimeline(stage.value, employer.value, cap.value);

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/tools", label: "工具" },
        { label: "OPT 到 H-1B 时间线" },
      ]}
      canonicalPath="/tools/opt-to-h1b-timeline"
      description="用通用选项整理 OPT、STEM OPT、H-1B 注册、申请和 cap-gap 相关核对点。"
      eyebrow="F-1 / H-1B 工具"
      structuredData={buildWebApplicationJsonLd({
        title: "OPT 到 H-1B 时间线规划器",
        description:
          "按毕业、OPT/STEM OPT、H-1B cap season 和雇主准备节点生成通用核对时间线。",
        path: "/tools/opt-to-h1b-timeline",
        dateModified: "2026-05-17",
      })}
      title="OPT 到 H-1B 时间线规划器"
    >
      <div className="space-y-6">
        <form
          action="/tools/opt-to-h1b-timeline"
          className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="你现在处于哪个阶段"
              name="stage"
              options={stageOptions}
              value={stage.value}
            />
            <SelectField
              label="雇主准备程度"
              name="employer"
              options={employerOptions}
              value={employer.value}
            />
            <SelectField
              label="H-1B cap 进度"
              name="cap"
              options={capOptions}
              value={cap.value}
            />
          </div>
          <button
            className="mt-5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            type="submit"
          >
            生成时间线
          </button>
        </form>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="当前阶段" value={stage.label} />
          <MetricCard label="雇主沟通" value={employer.label} />
          <MetricCard label="H-1B 节点" value={cap.label} />
        </section>

        <section className="space-y-4">
          {result.map((section, index) => (
            <article
              className="grid gap-4 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm md:grid-cols-[3.5rem_1fr]"
              key={section.title}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-base font-semibold text-[var(--accent-strong)]">
                {index + 1}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {section.description}
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                  {section.items.map((item) => (
                    <li className="border-t border-slate-100 pt-3" key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        <RelatedLinks
          items={[
            {
              title: "H-1B 公司 Sponsor 记录查询工具",
              href: "/tools/h1b-company-sponsor-checker",
              description: "先看目标雇主是否有相似 H-1B 公开历史。",
              meta: "公司背景",
            },
            {
              title: "STEM OPT 雇主检查清单",
              href: "/tools/stem-opt-employer-checklist",
              description: "核对 E-Verify、I-983 和雇主培训计划问题。",
              meta: "STEM OPT",
            },
            {
              title: "H-1B 换雇主风险清单",
              href: "/tools/h1b-transfer-risk-checklist",
              description: "已有 H-1B 后换雇主时使用。",
              meta: "后续路径",
            },
          ]}
          title="相关工具"
        />

        <SourceNote
          latestDataLabel="本页只生成通用时间线，不读取或保存个人身份日期。"
          names={[
            "USCIS Optional Practical Training",
            "USCIS STEM OPT",
            "USCIS H-1B Specialty Occupations",
          ]}
        />

        <DisclaimerBox>
          <p>
            时间线只是公开规则背景下的通用核对清单，不判断你的 OPT、STEM
            OPT、cap-gap 或 H-1B 个案资格。{siteConfig.fullDisclaimer}
          </p>
        </DisclaimerBox>
      </div>
    </PageShell>
  );
}

function buildTimeline(
  stage: (typeof stageOptions)[number]["value"],
  employer: (typeof employerOptions)[number]["value"],
  cap: (typeof capOptions)[number]["value"],
) {
  const sections = [
    {
      title: "先确认学校和 EAD 节点",
      description:
        "OPT/STEM OPT 的起止日期、I-20 推荐、EAD 和学校 DSO 流程会影响后续安排。",
      items: [
        "确认当前 I-20、EAD start/end date 和 SEVIS 记录是否一致。",
        "如果 OPT 仍在 pending，不要把计划建立在未获批日期上。",
        stage === "stem-opt-active"
          ? "STEM OPT 期间继续核对雇主 E-Verify 和 I-983 training plan 责任。"
          : "如果符合 STEM OPT 条件，提前了解申请窗口和雇主要求。",
      ],
    },
    {
      title: "把雇主 H-1B 准备拉到台面",
      description:
        "越早确认公司内部负责人、律师、预算和职位口径，越不容易错过 cap season。",
      items: [
        employer === "not-started"
          ? "尽快问招聘方或 HR：公司是否支持 H-1B 注册和后续申请。"
          : "确认 HR、直属经理、公司移民事务负责人和外部律师之间的责任分工。",
        "确认岗位名称、SOC、工作地点、工资和预计开始日期是否已经清楚。",
        "用公司页查看相似职位和地点是否有 H-1B 公开历史，但不要把历史记录当作承诺。",
      ],
    },
    {
      title: "按 cap season 准备备选方案",
      description:
        "H-1B cap 结果有不确定性，OPT/STEM OPT 时间线要和备选方案一起看。",
      items: [
        cap === "selected"
          ? "如果已被抽中，确认 Form I-129、LCA、支持信和提交窗口。"
          : "如果还未被抽中，准备没有抽中时的 STEM OPT、继续学习、境外工作或其他合规选项讨论。",
        cap === "not-selected"
          ? "本轮未被抽中时，重点核对 STEM OPT 剩余时间和下一轮抽签季。"
          : "不要等到 EAD 临近结束才第一次讨论备选路径。",
        "涉及 cap-gap、身份空档或跨境安排时，尽早找律师确认。",
      ],
    },
  ];

  return sections;
}

function SelectField<Option extends { label: string; value: string }>({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: readonly Option[];
  value: Option["value"];
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <select
        className="rounded-md border border-[var(--line)] px-3 py-2"
        defaultValue={value}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function firstValue(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const trimmed = candidate?.trim();

  return trimmed || undefined;
}

function pickOption<Option extends { label: string; value: string }>(
  options: readonly Option[],
  value: string | undefined,
) {
  return options.find((option) => option.value === value) ?? options[0];
}
