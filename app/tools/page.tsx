import Link from "next/link";
import type { Metadata } from "next";

import { ContentDirectoryCard } from "@/components/content/content-article";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { type ContentPage, listContentPages } from "@/lib/content/guide-pages";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildRouteSeoMetadata("/tools");

const toolJourneys = [
  {
    title: "投递前查公司",
    description:
      "先看公司是否有 H-1B/PERM 公开历史，再回到具体职位、地点和年份。",
    paths: [
      "/tools/h1b-company-sponsor-checker",
      "/tools/perm-green-card-company-checker",
      "/tools/company-immigration-score",
    ],
  },
  {
    title: "谈 offer 和工资",
    description:
      "把公开工资、SOC、worksite 和 prevailing wage 变成可沟通的问题清单。",
    paths: [
      "/tools/h1b-wage-level-checker",
      "/tools/wage-negotiation-with-h1b-data",
      "/tools/prevailing-wage-lookup",
    ],
  },
  {
    title: "从 OPT 走到 H-1B",
    description:
      "核对 OPT/STEM OPT、E-Verify、I-983、H-1B registration 和备选路径。",
    paths: [
      "/tools/opt-to-h1b-timeline",
      "/tools/stem-opt-employer-checklist",
      "/tools/h1b-transfer-risk-checklist",
    ],
  },
  {
    title: "看 PERM 和排期",
    description:
      "理解跳槽后 PERM 节点、priority date、Visa Bulletin 和 filing chart。",
    paths: [
      "/tools/perm-restart-timeline-estimator",
      "/tools/eb2-eb3-china-priority-date-calculator",
      "/tools/visa-bulletin-alert",
    ],
  },
] as const;

export default function ToolsPage() {
  const tools = listContentPages("tool");
  const toolsByPath = new Map(tools.map((page) => [page.path, page]));

  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "工具" }]}
      canonicalPath="/tools"
      description="面向 H-1B、PERM、工资和排期判断的中文工具入口。每个工具页都标明官方来源、使用边界和相关数据入口。"
      eyebrow="工具目录"
      structuredData={buildWebPageJsonLd({
        title: "职业移民工具",
        description: "12 个 H-1B、PERM、工资、排期和跳槽时间线中文工具入口。",
        path: "/tools",
        pageType: "CollectionPage",
      })}
      title="职业移民工具"
    >
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            description="覆盖查公司、工资、OPT/H-1B、PERM 和中国排期。"
            label="工具数量"
            value={`${tools.length} 个`}
          />
          <MetricCard
            description="工具只做公开数据和通用规则解释，不要求提交证件号、receipt number 或完整个人案情。"
            label="隐私边界"
            value="不收敏感身份信息"
          />
          <MetricCard
            description="每个工具都会标明官方来源、适用边界和下一步相关页面。"
            label="使用方式"
            value="先查信号，再问问题"
          />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">按任务开始</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              如果你不确定该点哪个工具，先按当前问题选一组。每组都从公开数据背景开始，不替你做个案法律判断。
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {toolJourneys.map((journey) => (
              <article
                className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
                key={journey.title}
              >
                <h3 className="text-lg font-semibold">{journey.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {journey.description}
                </p>
                <ul className="mt-4 grid gap-3 text-sm">
                  {journey.paths.map((path) => {
                    const page = toolsByPath.get(path);

                    return page ? (
                      <li key={path}>
                        <Link
                          className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
                          href={page.path}
                        >
                          {page.title}
                        </Link>
                        <p className="mt-1 text-[var(--muted)]">
                          {shortDescription(page)}
                        </p>
                      </li>
                    ) : null;
                  })}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">全部工具</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              所有工具页面都保留来源说明、相关数据入口和免责声明。带查询参数的结果页会保持
              noindex，避免把个人化组合提交给搜索引擎。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {tools.map((page) => (
              <ContentDirectoryCard key={page.path} page={page} />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function shortDescription(page: ContentPage) {
  return page.metaDescription.length > 62
    ? `${page.metaDescription.slice(0, 62)}...`
    : page.metaDescription;
}
