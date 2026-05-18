import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { SourceNote } from "@/components/source-note";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { MetricCard } from "@/components/ui/metric-card";
import {
  RelatedLinks,
  type RelatedLinkItem,
} from "@/components/ui/related-links";
import type { ContentPage } from "@/lib/content/guide-pages";
import {
  contentPagesByPath,
  getContentRelatedPages,
  getContentSources,
} from "@/lib/content/guide-pages";
import { buildContentPageJsonLd } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/site";

type ContentArticleProps = {
  page: ContentPage;
};

export function ContentArticle({ page }: ContentArticleProps) {
  const sources = getContentSources(page);
  const relatedItems = buildRelatedItems(page);
  const homeCrumb = { href: "/", label: "首页" };
  const directoryCrumb =
    page.kind === "tool"
      ? { href: "/tools", label: "工具" }
      : { href: "/guides", label: "指南" };

  return (
    <PageShell
      breadcrumbs={[homeCrumb, directoryCrumb, { label: page.title }]}
      canonicalPath={page.path}
      description={page.metaDescription}
      eyebrow={page.eyebrow}
      structuredData={buildContentPageJsonLd(page)}
      title={page.title}
    >
      <article className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="页面类型"
            value={page.kind === "tool" ? "工具" : "指南"}
          />
          <MetricCard
            description={
              page.priority === 1
                ? "优先补齐、优先维护的核心页面。"
                : "用于补充公司页、工具页和求职场景的解释页面。"
            }
            label="阅读定位"
            trend={page.priority === 1 ? "先读" : "补充"}
            value={priorityLabel(page.priority)}
          />
          <MetricCard
            description="每个页面至少连接一个官方来源；多数页面连接多个来源。"
            label="官方来源"
            value={`${sources.length} 个`}
          />
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">你可以用它做什么</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            把这页当作面试、offer
            沟通或公司背景调查前的准备材料：先弄清楚官方数据能说明什么，再整理要问
            HR、招聘方、公司移民事务负责人
            或律师的问题。页面不会要求你输入敏感身份信息，也不会给出个案法律结论。
          </p>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">先读懂这件事</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {page.summary}
          </p>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">官方来源怎么用</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {page.sourceContext}
          </p>
          <ul className="mt-4 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
            {sources.map((source) => (
              <li key={source.id}>
                <a
                  className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
                  href={source.url}
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">{page.checklistTitle}</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[var(--muted)]">
              {page.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">{page.exampleTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {page.example}
            </p>
          </article>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">常见误区</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)] md:grid-cols-3">
            {page.mistakes.map((mistake) => (
              <li className="rounded-md bg-slate-50 p-3" key={mistake}>
                {mistake}
              </li>
            ))}
          </ul>
        </section>

        <SourceNote
          latestDataLabel={`最后复核日期 ${page.lastReviewed}。页面只解释官方公开来源和通用场景，不收集个人身份信息。`}
          names={sources.map((source) => source.title)}
        />

        <RelatedLinks items={relatedItems} title="相关工具 / 指南 / 数据入口" />

        <DisclaimerBox>
          <p>{siteConfig.fullDisclaimer}</p>
        </DisclaimerBox>

        <p className="text-xs text-[var(--muted)]">
          Last reviewed: {page.lastReviewed}
        </p>
      </article>
    </PageShell>
  );
}

function buildRelatedItems(page: ContentPage): RelatedLinkItem[] {
  const contentItems = getContentRelatedPages(page).map((relatedPage) => ({
    title: relatedPage.title,
    href: relatedPage.path,
    description: relatedPage.metaDescription,
    meta: relatedPage.kind === "tool" ? "工具" : "指南",
  }));
  const nonContentItems = page.relatedPaths
    .filter((path) => !contentPagesByPath.has(path))
    .map((path) => ({
      title: relatedTitle(path),
      href: path,
      description: "查看相关官方数据入口或产品页面。",
      meta: "数据入口",
    }));

  return [...contentItems, ...nonContentItems];
}

function relatedTitle(path: string) {
  const labels: Record<string, string> = {
    "/companies": "公司目录",
    "/h1b": "H-1B 公司数据库",
    "/perm": "PERM / 绿卡公司数据库",
    "/visa-bulletin": "中国职业移民排期",
  };

  return labels[path] ?? path;
}

export function ContentDirectoryCard({ page }: { page: ContentPage }) {
  return (
    <Link
      className="block h-full rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm transition hover:border-[var(--accent)] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
      href={page.path}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
        {priorityLabel(page.priority)} · {page.category}
      </p>
      <h2 className="mt-2 text-lg font-semibold">{page.title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {page.metaDescription}
      </p>
    </Link>
  );
}

function priorityLabel(priority: ContentPage["priority"]) {
  if (priority === 1) {
    return "核心必读";
  }
  if (priority === 2) {
    return "进阶补充";
  }

  return "场景延伸";
}
