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

type WageNegotiationPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

const roleOptions = [
  { value: "software", label: "Software / Data / AI 岗位" },
  { value: "business", label: "Business / Product / Analyst 岗位" },
  { value: "research", label: "Research / Scientist 岗位" },
] as const;

const locationOptions = [
  { value: "same-city", label: "同城市比较" },
  { value: "new-city", label: "换城市或远程安排" },
  { value: "unknown", label: "worksite 还不确定" },
] as const;

const salaryOptions = [
  { value: "below-market", label: "担心 offer 偏低" },
  { value: "near-market", label: "想确认是否合理" },
  { value: "competing-offer", label: "有 competing offer" },
] as const;

export async function generateMetadata({
  searchParams,
}: WageNegotiationPageProps): Promise<Metadata> {
  const hasQuery = hasSubmittedSearchParams(await searchParams);

  return buildSeoMetadata({
    title: hasQuery ? "H-1B 数据谈薪清单结果" : "用 H-1B 数据做谈薪参考",
    description:
      "把公开 H-1B 工资、SOC、worksite 和 prevailing wage 背景整理成谈薪问题清单。",
    path: "/tools/wage-negotiation-with-h1b-data",
    index: !hasQuery,
    pageType: "tool",
  });
}

export default async function WageNegotiationWithH1BDataPage({
  searchParams,
}: WageNegotiationPageProps) {
  const params = await searchParams;
  const role = pickOption(roleOptions, firstValue(params?.role));
  const location = pickOption(locationOptions, firstValue(params?.location));
  const salary = pickOption(salaryOptions, firstValue(params?.salary));
  const plan = buildNegotiationPlan(role.value, location.value, salary.value);

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/tools", label: "工具" },
        { label: "H-1B 数据谈薪" },
      ]}
      canonicalPath="/tools/wage-negotiation-with-h1b-data"
      description="把公开 H-1B 工资、SOC、worksite 和 prevailing wage 背景整理成谈薪问题清单。"
      eyebrow="工资工具"
      structuredData={buildWebApplicationJsonLd({
        title: "用 H-1B 数据做谈薪参考",
        description:
          "把公开 H-1B 工资、SOC、worksite 和 prevailing wage 背景整理成谈薪问题清单。",
        path: "/tools/wage-negotiation-with-h1b-data",
        dateModified: "2026-05-17",
      })}
      title="用 H-1B 数据做谈薪参考"
    >
      <div className="space-y-6">
        <form
          action="/tools/wage-negotiation-with-h1b-data"
          className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="岗位类型"
              name="role"
              options={roleOptions}
              value={role.value}
            />
            <SelectField
              label="地点口径"
              name="location"
              options={locationOptions}
              value={location.value}
            />
            <SelectField
              label="谈薪场景"
              name="salary"
              options={salaryOptions}
              value={salary.value}
            />
          </div>
          <button
            className="mt-5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            type="submit"
          >
            生成谈薪清单
          </button>
        </form>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="岗位" value={role.label} />
          <MetricCard label="地点" value={location.label} />
          <MetricCard label="场景" value={salary.label} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {plan.map((section) => (
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
              title: "H-1B 工资 Level 中文判断工具",
              href: "/tools/h1b-wage-level-checker",
              description: "输入 SOC、地点和工资，先看 prevailing wage 背景。",
              meta: "工资 level",
            },
            {
              title: "H-1B 公司数据库",
              href: "/h1b",
              description: "查看相似公司、职位和地点的公开工资样本。",
              meta: "数据入口",
            },
            {
              title: "H-1B 工资和 prevailing wage 的关系",
              href: "/guides/h1b-salary-vs-prevailing-wage",
              description: "先理解为什么公开工资不能直接等于 offer 建议。",
              meta: "指南",
            },
          ]}
          title="相关工具与指南"
        />

        <SourceNote
          latestDataLabel="本页不保存工资输入；公开工资和 prevailing wage 只能作为背景，不是谈薪建议或合规结论。"
          names={[
            "DOL OFLC LCA / H-1B disclosure data",
            "FLAG Wage Data",
            "FLAG Wage Search",
          ]}
        />

        <DisclaimerBox>
          <p>
            公开工资样本不能替代 compensation
            band、职位职责、个人经验、地区成本或法律合规判断。
            {siteConfig.fullDisclaimer}
          </p>
        </DisclaimerBox>
      </div>
    </PageShell>
  );
}

function buildNegotiationPlan(
  role: (typeof roleOptions)[number]["value"],
  location: (typeof locationOptions)[number]["value"],
  salary: (typeof salaryOptions)[number]["value"],
) {
  return [
    {
      title: "先把可比样本缩小",
      description:
        "谈薪前不要只看公司平均值，先确认职位、SOC、地点和年份是否接近。",
      items: [
        role === "software"
          ? "优先比较 Software Developer、Data Scientist、Machine Learning 等相近 SOC 和 title。"
          : "优先比较和实际职责相近的 SOC，不要只用中文职位名判断。",
        location === "new-city"
          ? "如果换城市或远程，明确 offer 使用的 worksite 和 LCA 地点口径。"
          : "尽量使用同 city/state 或同 metro area 的公开工资背景。",
        "把样本年份和数据来源日期记下来，避免拿不同年份直接比较。",
      ],
    },
    {
      title: "再准备谈薪问题",
      description: "公开数据更适合帮你问问题，而不是直接给出一个应该要的数字。",
      items: [
        salary === "below-market"
          ? "如果担心偏低，询问是否有 salary band、leveling、equity 或 sign-on 调整空间。"
          : "询问 offer 对应的 level、职责范围和未来 review 节点。",
        salary === "competing-offer"
          ? "用 competing offer 时，仍要把地点、现金、股权和身份支持分开讨论。"
          : "不要把 H-1B 公开工资当作公司当前薪资政策。",
        "如果涉及 H-1B filing，工资、职责和 worksite 也需要和雇主/律师口径一致。",
      ],
    },
    {
      title: "最后保留合规边界",
      description: "谈薪和 H-1B 工资合规是相关但不同的问题。",
      items: [
        "Prevailing wage 是公开工资背景，不等于公司必须给出的唯一工资。",
        "LCA 工资字段可能受岗位、地点、雇佣安排和数据录入影响。",
        "不要要求或接受任何隐瞒 worksite、职责或工资事实的建议。",
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
