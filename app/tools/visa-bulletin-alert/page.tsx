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

type VisaBulletinAlertPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

const categoryOptions = [
  { value: "eb1", label: "EB-1 China" },
  { value: "eb2", label: "EB-2 China" },
  { value: "eb3", label: "EB-3 China" },
] as const;

const chartOptions = [
  { value: "final-action", label: "最终裁定表（Final Action Dates）" },
  { value: "filing", label: "递件排期表（Dates for Filing）" },
] as const;

const positionOptions = [
  { value: "before-cutoff", label: "优先日早于当前截止日期" },
  { value: "near-cutoff", label: "优先日接近截止日期" },
  { value: "after-cutoff", label: "优先日晚于当前截止日期" },
  { value: "unknown", label: "还没确认优先日或类别" },
] as const;

export async function generateMetadata({
  searchParams,
}: VisaBulletinAlertPageProps): Promise<Metadata> {
  const hasQuery = hasSubmittedSearchParams(await searchParams);

  return buildSeoMetadata({
    title: hasQuery ? "排期每月核对清单结果" : "中国职业移民排期提醒清单",
    description:
      "按 EB 类别、Visa Bulletin 排期表和优先日（priority date）位置生成每月排期更新核对清单。",
    path: "/tools/visa-bulletin-alert",
    index: !hasQuery,
    pageType: "tool",
  });
}

export default async function VisaBulletinAlertPage({
  searchParams,
}: VisaBulletinAlertPageProps) {
  const params = await searchParams;
  const category = pickOption(categoryOptions, firstValue(params?.category));
  const chart = pickOption(chartOptions, firstValue(params?.chart));
  const position = pickOption(positionOptions, firstValue(params?.position));
  const checklist = buildChecklist(category.value, chart.value, position.value);

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/tools", label: "工具" },
        { label: "排期提醒清单" },
      ]}
      canonicalPath="/tools/visa-bulletin-alert"
      description="用每月 Visa Bulletin 和 USCIS 当月 I-485 用表选择，生成中国 EB 类别排期更新时应核对的问题。"
      eyebrow="排期工具"
      structuredData={buildWebApplicationJsonLd({
        title: "中国职业移民排期提醒清单",
        description:
          "按 EB 类别、Visa Bulletin 排期表和优先日（priority date）位置生成每月排期更新核对清单。",
        path: "/tools/visa-bulletin-alert",
        dateModified: "2026-05-17",
      })}
      title="中国职业移民排期提醒清单"
    >
      <div className="space-y-6">
        <form
          action="/tools/visa-bulletin-alert"
          className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="职业移民类别"
              name="category"
              options={categoryOptions}
              value={category.value}
            />
            <SelectField
              label="重点查看哪张表"
              name="chart"
              options={chartOptions}
              value={chart.value}
            />
            <SelectField
              label="你的优先日位置"
              name="position"
              options={positionOptions}
              value={position.value}
            />
          </div>
          <button
            className="mt-5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            type="submit"
          >
            生成提醒清单
          </button>
        </form>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="类别" value={category.label} />
          <MetricCard label="排期表" value={chart.label} />
          <MetricCard label="位置" value={position.label} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {checklist.map((section) => (
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
              title: "中国职业移民排期",
              href: "/visa-bulletin",
              description: "查看最近月份 EB-1、EB-2、EB-3 中国排期摘要。",
              meta: "排期入口",
            },
            {
              title: "中国 EB-2 / EB-3 优先日排期计算器",
              href: "/tools/eb2-eb3-china-priority-date-calculator",
              description:
                "用具体优先日（priority date）对照指定月份和排期表。",
              meta: "计算器",
            },
            {
              title: "Visa Bulletin 方法说明",
              href: "/methodology/visa-bulletin",
              description:
                "理解 DOS Visa Bulletin 与 USCIS 当月 I-485 用表的差异。",
              meta: "方法",
            },
          ]}
          title="相关排期页面"
        />

        <SourceNote
          latestDataLabel="本页不保存邮箱、不发送通知；它只是帮助你在每月官方排期发布后复核重点。"
          names={[
            "U.S. Department of State Visa Bulletin",
            "USCIS Adjustment of Status filing chart",
          ]}
        />

        <DisclaimerBox>
          <p>
            排期清单不能判断你是否应递交、何时递交或个案是否会获批。
            {siteConfig.fullDisclaimer}
          </p>
        </DisclaimerBox>
      </div>
    </PageShell>
  );
}

function buildChecklist(
  category: (typeof categoryOptions)[number]["value"],
  chart: (typeof chartOptions)[number]["value"],
  position: (typeof positionOptions)[number]["value"],
) {
  const categoryLabel = category.toUpperCase().replace("EB", "EB-");
  const chartLabel =
    chart === "filing"
      ? "递件排期表（Dates for Filing）"
      : "最终裁定表（Final Action Dates）";

  return [
    {
      title: "每月先看官方表格",
      description:
        "Visa Bulletin 每月更新，境内调整身份是否可用递件排期表还要看 USCIS 当月选择。",
      items: [
        `确认 ${categoryLabel} 中国大陆出生在 ${chartLabel} 中的截止日期（cutoff date）。`,
        "如果你在美国境内准备调整身份（AOS），单独核对 USCIS 当月是否允许使用递件排期表。",
        "如果是境外领馆程序（consular processing），不要直接套用调整身份（AOS）用表选择。",
      ],
    },
    {
      title: "再看优先日位置",
      description:
        "同一个截止日期对不同优先日（priority date）的意义不同，接近截止日期时尤其要谨慎。",
      items: [
        position === "before-cutoff"
          ? "优先日早于当前日期线时，继续核对身份、基础申请和材料窗口。"
          : "如果优先日尚未早于截止日期，不要把排期前进等同于已经可以递交。",
        position === "near-cutoff"
          ? "接近截止日期时，重点关注下月是否可能停滞或倒退，并保留材料更新时间。"
          : "保持每月记录，但不要从单月变化推断长期趋势。",
        position === "unknown"
          ? "先确认优先日（priority date）、出生地/Chargeability 和 EB 类别，再使用排期页面。"
          : "把本月截止日期、上月截止日期和你的优先日放在同一张记录里。",
      ],
    },
    {
      title: "最后确认行动边界",
      description:
        "排期是必要背景，但不是递交决定本身；个人身份和案件节点仍然关键。",
      items: [
        "核对 I-140、身份维持、体检、工作变动和家庭成员情况是否影响下一步。",
        "不要只根据一个网站的自动结果决定递交或不递交。",
        "需要提交、撤回、转换类别或跨境安排时，找持牌移民律师确认。",
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
