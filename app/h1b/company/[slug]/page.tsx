import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { RouteCard } from "@/components/route-card";
import { SourceNote } from "@/components/source-note";
import { siteConfig } from "@/lib/site";

type CompanyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const employerName = titleFromSlug(slug);

  return {
    title: `${employerName} H-1B 公开数据`,
    description:
      "H-1B 公司页模板占位。真实页面会显示官方 LCA 和 USCIS Employer Data Hub 数据来源、覆盖期和解释限制。",
    alternates: {
      canonical: `/h1b/company/${slug}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function H1BCompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const employerName = titleFromSlug(slug);

  return (
    <PageShell
      description="这是公司页模板占位，用于验证 URL、页面结构和合规提示。真实数据接入前，此类页面不进入 sitemap，也不建议索引。"
      eyebrow="H-1B 公司页"
      title={`${employerName} 的 H-1B 公开数据信号`}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <RouteCard
          description="后续将展示近年 certified、withdrawn、denied 等 LCA 记录数量和覆盖 fiscal years。"
          meta="年度摘要"
          title="LCA 活跃度"
        />
        <RouteCard
          description="后续将按 job title、SOC code、worksite city/state 汇总，但会避免小样本强结论。"
          meta="结构"
          title="职位与地点分布"
        />
        <RouteCard
          description="如果接入 USCIS Employer Data Hub，会与 DOL LCA 明确分开展示，不称为个案成功率。"
          meta="边界"
          title="USCIS 数据区分"
        />
      </div>

      <div className="mt-6">
        <SourceNote
          names={[
            "DOL OFLC LCA / H-1B disclosure data",
            "USCIS H-1B Employer Data Hub",
          ]}
        />
      </div>

      <section className="mt-6 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">如何读这个页面</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          LCA 是 H-1B 流程中的劳工条件申请记录，不等于 H-1B petition
          批准，也不代表雇主未来承诺。本站只把公开数据作为决策辅助信号。
        </p>
      </section>
    </PageShell>
  );
}
