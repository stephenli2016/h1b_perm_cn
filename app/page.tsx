import Link from "next/link";
import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { MetricCard } from "@/components/ui/metric-card";
import { RelatedLinks } from "@/components/ui/related-links";
import { buildJsonLdGraph, buildWebsiteJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildRouteSeoMetadata("/", {
  pageType: "website",
});

const focusAreas = [
  {
    title: "查公司",
    body: "看雇主近年 H-1B LCA、PERM 和 USCIS Employer Data Hub 公开记录，先判断有没有可核验的历史活动。",
    href: "/companies",
    cta: "进入公司目录",
  },
  {
    title: "查工资",
    body: "把 SOC、worksite、公开 LCA 工资和 prevailing wage 放到一起看，准备 offer 和谈薪问题。",
    href: "/tools/h1b-wage-level-checker",
    cta: "打开工资工具",
  },
  {
    title: "查 PERM",
    body: "查看公司是否有 PERM 劳工认证公开历史，同时区分 PERM、I-140、I-485 和排期。",
    href: "/perm",
    cta: "查看 PERM 数据",
  },
  {
    title: "查排期",
    body: "对照 Visa Bulletin 和 USCIS filing chart，理解中国大陆出生 EB-1、EB-2、EB-3 的公开排期表。",
    href: "/visa-bulletin",
    cta: "查看排期",
  },
];

const trustSignals = [
  {
    label: "数据来源",
    value: "官方公开",
    description: "DOL OFLC、FLAG、USCIS、Department of State 等来源。",
  },
  {
    label: "解释方式",
    value: "中文谨慎解读",
    description: "把公开记录当作信号，不包装成批准率或雇主承诺。",
  },
  {
    label: "隐私边界",
    value: "不收集敏感案情",
    description: "工具页尽量使用通用选项，不要求 receipt number 或证件信息。",
  },
];

const commonTasks = [
  {
    title: "我要投一家公司，先看 sponsor 历史",
    href: "/tools/h1b-company-sponsor-checker",
    description: "从公司名、职位、地点和近年记录开始，整理面试前的问题。",
    meta: "求职前",
  },
  {
    title: "我想知道公司有没有绿卡/PERM 记录",
    href: "/tools/perm-green-card-company-checker",
    description: "用 PERM 公开记录观察公司职业移民劳工认证历史。",
    meta: "绿卡规划",
  },
  {
    title: "我在谈 offer，想看工资背景",
    href: "/tools/wage-negotiation-with-h1b-data",
    description: "把 H-1B 工资样本和 prevailing wage 背景变成沟通清单。",
    meta: "薪资",
  },
  {
    title: "我在看 EB-2/EB-3 中国排期",
    href: "/tools/eb2-eb3-china-priority-date-calculator",
    description: "对照月份、类别和 chart type，理解公开日期表含义。",
    meta: "排期",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
      <JsonLdScript data={buildJsonLdGraph([buildWebsiteJsonLd()])} />
      <section className="grid items-start gap-10 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-14">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">
            {siteConfig.tagline}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl">
            用官方公开数据，先看清公司和职业移民路径
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            VisaRadar CN 面向中国留学生、OPT/STEM OPT、H-1B
            和职业移民申请人。你可以用中文查看雇主 H-1B/PERM
            历史、工资背景、PERM 信号和中国 EB
            排期，同时看到每个数据来源的限制。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent-strong)] hover:text-white"
              href="/companies"
            >
              搜索公司
            </Link>
            <Link
              className="rounded-md border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold shadow-sm"
              href="/tools"
            >
              查看工具
            </Link>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            本站不判断个案是否会批准，不承诺任何公司一定
            sponsor；它帮你把公开记录变成更好的问题清单。
          </p>
        </div>

        <section className="grid gap-4">
          {trustSignals.map((item) => (
            <MetricCard
              description={item.description}
              key={item.label}
              label={item.label}
              value={item.value}
            />
          ))}
        </section>
      </section>

      <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {focusAreas.map((area) => (
          <article
            className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
            key={area.title}
          >
            <h2 className="text-lg font-semibold">{area.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {area.body}
            </p>
            <Link
              className="mt-4 inline-flex text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
              href={area.href}
            >
              {area.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="grid gap-6 pb-12 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">第一次使用，建议这样看</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-[var(--muted)]">
            <li>先搜索公司，确认英文 legal name、别名和相关实体是否匹配。</li>
            <li>再分开看 H-1B/LCA、PERM、职位、地点和工资，不只看总数。</li>
            <li>遇到低样本或没有记录时，只把它当作“需要继续问”的信号。</li>
            <li>最后把页面里的来源日期、免责声明和纠错入口一起看。</li>
          </ol>
        </article>

        <RelatedLinks items={commonTasks} title="按你的问题开始" />
      </section>

      <div className="pb-12">
        <DisclaimerBox compact>
          <p>{siteConfig.fullDisclaimer}</p>
        </DisclaimerBox>
      </div>
    </main>
  );
}
