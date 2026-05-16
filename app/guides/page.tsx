import type { Metadata } from "next";

import { ContentDirectoryCard } from "@/components/content/content-article";
import { PageShell } from "@/components/page-shell";
import {
  type ContentCategory,
  listContentPages,
} from "@/lib/content/guide-pages";

export const metadata: Metadata = {
  title: "职业移民中文指南",
  description:
    "50 个中文职业移民工具/指南页面，解释 LCA、PERM、Prevailing Wage、Visa Bulletin 和求职决策。",
  alternates: {
    canonical: "/guides",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const guideCategories: ContentCategory[] = [
  "H-1B 数据解释",
  "Prevailing Wage 和薪资",
  "PERM 和绿卡",
  "排期与中国 backlog",
  "求职与公司判断",
];

export default function GuidesPage() {
  const guides = listContentPages("guide");

  return (
    <PageShell
      description="面向海外华人求职者和职业移民申请人的中文指南目录。每篇内容都包含官方来源、示例或清单、常见误区、相关链接和免责声明。"
      eyebrow="指南目录"
      title="职业移民中文指南"
    >
      <div className="space-y-8">
        {guideCategories.map((category) => {
          const pages = guides.filter((page) => page.category === category);

          return (
            <section className="space-y-4" key={category}>
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
