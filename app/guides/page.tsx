import Link from "next/link";
import type { Metadata } from "next";

import { ContentDirectoryCard } from "@/components/content/content-article";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/ui/metric-card";
import {
  type ContentCategory,
  type ContentPage,
  listContentPages,
} from "@/lib/content/guide-pages";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildRouteSeoMetadata("/guides");

const guideCategories: ContentCategory[] = [
  "H-1B 数据解释",
  "通行工资（Prevailing Wage）和薪资",
  "PERM 和绿卡",
  "排期与中国 backlog",
  "求职与公司判断",
];

const beginnerGuidePaths = [
  "/guides/what-is-lca-chinese",
  "/guides/h1b-employer-data-hub-explained",
  "/guides/prevailing-wage-explained",
  "/guides/perm-explained-chinese",
  "/guides/visa-bulletin-explained-chinese",
  "/guides/how-to-choose-h1b-sponsor-company",
] as const;

const guideJourneys = [
  {
    title: "第一次读 H-1B 数据",
    description:
      "先弄懂 LCA、USCIS Employer Data Hub、职位/SOC 和地点工资字段。",
    paths: [
      "/guides/what-is-lca-chinese",
      "/guides/h1b-employer-data-hub-explained",
      "/guides/h1b-soc-code-explained",
    ],
  },
  {
    title: "准备面试或 offer 沟通",
    description: "把公司公开记录、工资背景和招聘方问题组织成可执行清单。",
    paths: [
      "/guides/how-to-choose-h1b-sponsor-company",
      "/guides/questions-to-ask-recruiter-about-h1b-green-card",
      "/guides/h1b-salary-negotiation",
    ],
  },
  {
    title: "开始看 PERM / 绿卡",
    description: "理解 PERM 已认证、PWD、I-140 和换工作时需要重新规划的节点。",
    paths: [
      "/guides/perm-explained-chinese",
      "/guides/perm-certified-meaning",
      "/guides/change-job-during-perm",
    ],
  },
  {
    title: "看中国 EB 排期",
    description:
      "区分最终裁定表、递件排期表、EB-2/EB-3 中国和 USCIS 当月 I-485 用表。",
    paths: [
      "/guides/visa-bulletin-explained-chinese",
      "/guides/final-action-date-vs-dates-for-filing",
      "/guides/uscis-filing-chart-explained",
    ],
  },
] as const;

export default function GuidesPage() {
  const guides = listContentPages("guide");
  const guidesByPath = new Map(guides.map((page) => [page.path, page]));
  const beginnerGuides = beginnerGuidePaths
    .map((path) => guidesByPath.get(path))
    .filter((page): page is ContentPage => Boolean(page));

  return (
    <PageShell
      breadcrumbs={[{ href: "/", label: "首页" }, { label: "指南" }]}
      canonicalPath="/guides"
      description="面向海外华人求职者和职业移民申请人的中文指南目录。每篇内容都包含官方来源、示例或清单、常见误区、相关链接和免责声明。"
      eyebrow="指南目录"
      structuredData={buildWebPageJsonLd({
        title: "职业移民中文指南",
        description:
          "38 篇解释 LCA、PERM、通行工资（Prevailing Wage）、Visa Bulletin 和求职决策的中文指南目录。",
        path: "/guides",
        pageType: "CollectionPage",
      })}
      title="职业移民中文指南"
    >
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            description="覆盖 H-1B、工资、PERM、排期和求职沟通。"
            label="指南数量"
            value={`${guides.length} 篇`}
          />
          <MetricCard
            description="每篇都连接官方来源，并解释公开数据能说明什么、不能说明什么。"
            label="来源原则"
            value="官方公开来源"
          />
          <MetricCard
            description="先读核心必读，再按求职、工资、PERM、排期场景继续深入。"
            label="阅读顺序"
            value="从场景开始"
          />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">先按问题选择</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              不需要从第一篇顺序读完。先找到你现在的问题，再进入对应数据页或工具页。
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {guideJourneys.map((journey) => (
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
                    const page = guidesByPath.get(path);

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
            <h2 className="text-xl font-semibold">建议先读</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              这几篇最适合建立共同语境：LCA、Employer Data Hub、prevailing
              wage、PERM、Visa Bulletin 和公司判断。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {beginnerGuides.map((page) => (
              <ContentDirectoryCard key={page.path} page={page} />
            ))}
          </div>
        </section>

        <nav
          aria-label="指南分类"
          className="flex flex-wrap gap-2 text-sm font-semibold"
        >
          {guideCategories.map((category) => (
            <a
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-[var(--accent-strong)] hover:bg-slate-50"
              href={`#${categoryId(category)}`}
              key={category}
            >
              {category}
            </a>
          ))}
        </nav>

        {guideCategories.map((category) => {
          const pages = guides.filter((page) => page.category === category);

          return (
            <section
              className="space-y-4 scroll-mt-24"
              id={categoryId(category)}
              key={category}
            >
              <div>
                <h2 className="text-xl font-semibold">{category}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {pages.length} 篇已发布内容页。
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {pages.map((page) => (
                  <ContentDirectoryCard key={page.path} page={page} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}

function categoryId(category: ContentCategory) {
  const ids: Record<ContentCategory, string> = {
    "H-1B 数据解释": "h1b-data",
    "PERM 和绿卡": "perm-green-card",
    "通行工资（Prevailing Wage）和薪资": "wage",
    "排期与中国 backlog": "visa-bulletin",
    求职与公司判断: "job-search",
    核心工具: "tools",
  };

  return ids[category];
}

function shortDescription(page: ContentPage) {
  return page.metaDescription.length > 66
    ? `${page.metaDescription.slice(0, 66)}...`
    : page.metaDescription;
}
