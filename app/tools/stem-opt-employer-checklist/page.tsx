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

type StemOptChecklistPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

const everifyOptions = [
  { value: "unknown", label: "还不确定" },
  { value: "confirmed", label: "雇主确认 E-Verify" },
  { value: "not-confirmed", label: "雇主尚未确认" },
] as const;

const trainingOptions = [
  { value: "not-started", label: "还没讨论 I-983" },
  { value: "manager-ready", label: "manager 愿意配合" },
  { value: "hr-ready", label: "HR/immigration team 已说明流程" },
] as const;

const futureOptions = [
  { value: "h1b-only", label: "主要关注 H-1B" },
  { value: "h1b-perm", label: "同时想问 H-1B 和 PERM" },
  { value: "not-sure", label: "还不确定长期路径" },
] as const;

export async function generateMetadata({
  searchParams,
}: StemOptChecklistPageProps): Promise<Metadata> {
  const hasQuery = hasSubmittedSearchParams(await searchParams);

  return buildSeoMetadata({
    title: hasQuery ? "STEM OPT 雇主清单结果" : "STEM OPT 雇主检查清单",
    description:
      "核对 E-Verify、I-983、雇主培训计划和未来 H-1B/PERM 沟通问题。",
    path: "/tools/stem-opt-employer-checklist",
    index: !hasQuery,
    pageType: "tool",
  });
}

export default async function StemOptEmployerChecklistPage({
  searchParams,
}: StemOptChecklistPageProps) {
  const params = await searchParams;
  const everify = pickOption(everifyOptions, firstValue(params?.everify));
  const training = pickOption(trainingOptions, firstValue(params?.training));
  const future = pickOption(futureOptions, firstValue(params?.future));
  const sections = buildChecklist(everify.value, training.value, future.value);

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/tools", label: "工具" },
        { label: "STEM OPT 雇主清单" },
      ]}
      canonicalPath="/tools/stem-opt-employer-checklist"
      description="核对 STEM OPT 雇主是否准备好 E-Verify、I-983 training plan、supervision 和未来 H-1B/PERM 沟通。"
      eyebrow="F-1 / STEM OPT 工具"
      structuredData={buildWebApplicationJsonLd({
        title: "STEM OPT 雇主检查清单",
        description:
          "核对 E-Verify、I-983、雇主培训计划和未来 H-1B/PERM 沟通问题。",
        path: "/tools/stem-opt-employer-checklist",
        dateModified: "2026-05-17",
      })}
      title="STEM OPT 雇主检查清单"
    >
      <div className="space-y-6">
        <form
          action="/tools/stem-opt-employer-checklist"
          className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="E-Verify 状态"
              name="everify"
              options={everifyOptions}
              value={everify.value}
            />
            <SelectField
              label="I-983 准备程度"
              name="training"
              options={trainingOptions}
              value={training.value}
            />
            <SelectField
              label="未来路径重点"
              name="future"
              options={futureOptions}
              value={future.value}
            />
          </div>
          <button
            className="mt-5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            type="submit"
          >
            生成清单
          </button>
        </form>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="E-Verify" value={everify.label} />
          <MetricCard label="Training plan" value={training.label} />
          <MetricCard label="后续路径" value={future.label} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <article
              className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
              key={section.title}
            >
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
            </article>
          ))}
        </section>

        <RelatedLinks
          items={[
            {
              title: "OPT 到 H-1B 时间线规划器",
              href: "/tools/opt-to-h1b-timeline",
              description:
                "把 OPT/STEM OPT 和 H-1B cap season 放到同一条时间线上。",
              meta: "时间线",
            },
            {
              title: "H-1B 公司 Sponsor 记录查询工具",
              href: "/tools/h1b-company-sponsor-checker",
              description: "查看雇主是否有相似 H-1B 公开历史。",
              meta: "公司背景",
            },
            {
              title: "公司 PERM / 绿卡记录查询工具",
              href: "/tools/perm-green-card-company-checker",
              description: "长期规划时继续查看 PERM 公开记录。",
              meta: "绿卡",
            },
          ]}
          title="相关工具"
        />

        <SourceNote
          latestDataLabel="本页只生成通用核对清单，不收集 SEVIS、EAD、I-20 或护照信息。"
          names={[
            "USCIS STEM OPT",
            "USCIS Optional Practical Training",
            "USCIS H-1B Specialty Occupations",
          ]}
        />

        <DisclaimerBox>
          <p>
            STEM OPT 雇主要求和 I-983 责任需要结合学校 DSO、雇主和个人情况确认。
            {siteConfig.fullDisclaimer}
          </p>
        </DisclaimerBox>
      </div>
    </PageShell>
  );
}

function buildChecklist(
  everify: (typeof everifyOptions)[number]["value"],
  training: (typeof trainingOptions)[number]["value"],
  future: (typeof futureOptions)[number]["value"],
) {
  return [
    {
      title: "雇主基础资格",
      description: "STEM OPT 不是只看职位名，雇主流程和监督安排也要能落地。",
      items: [
        everify === "confirmed"
          ? "记录 HR 确认 E-Verify 的方式和对应雇主实体。"
          : "向 HR 明确确认雇主实体是否 E-Verify，以及你的 payroll entity 是否一致。",
        "确认职位与 STEM degree 的关联如何体现在 training plan 中。",
        "确认是否有合适 supervisor 能定期评估和签署相关材料。",
      ],
    },
    {
      title: "I-983 和学校流程",
      description: "I-983 是 STEM OPT 沟通中最容易被低估的文件节点。",
      items: [
        training === "not-started"
          ? "尽早问 manager 和 HR 谁负责 I-983 的 training objective、evaluation 和签字。"
          : "确认 I-983 内容、签字人、学校提交窗口和后续 evaluation 提醒。",
        "如果工作地点、职责或 supervisor 改变，确认学校和雇主的更新要求。",
        "不要在表单里提交完整个人案情；把细节留给学校 DSO 和雇主流程。",
      ],
    },
    {
      title: "H-1B / PERM 后续沟通",
      description: "STEM OPT 往往只是长期身份规划的一段时间窗口。",
      items: [
        future === "h1b-perm"
          ? "同时询问 H-1B registration、PERM 启动时间和雇主内部政策。"
          : "至少确认公司是否支持 H-1B registration 和后续 petition。",
        "用公司页查看相似职位、地点是否有公开 H-1B/PERM 历史。",
        "把公开数据当作准备问题的背景，不当作雇主未来承诺。",
      ],
    },
  ];
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
