import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { RouteCard } from "@/components/route-card";
import { SourceNote } from "@/components/source-note";

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
    title: `${employerName} PERM 公开数据`,
    description:
      "PERM 公司页模板占位。真实页面会显示官方 PERM disclosure data 来源、覆盖期和解释限制。",
    alternates: {
      canonical: `/perm/company/${slug}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function PermCompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const employerName = titleFromSlug(slug);

  return (
    <PageShell
      description="这是 PERM 公司页模板占位，用于验证 URL、页面结构和合规提示。真实数据接入前，此类页面不进入 sitemap，也不建议索引。"
      eyebrow="PERM 公司页"
      title={`${employerName} 的 PERM 公开数据信号`}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <RouteCard
          description="后续将展示 certified、denied、withdrawn 等 PERM 记录数量和覆盖 fiscal years。"
          meta="年度摘要"
          title="PERM 活跃度"
        />
        <RouteCard
          description="后续将按 job title、SOC code 和 worksite location 汇总，并对低样本组合谨慎显示。"
          meta="结构"
          title="职位与地点"
        />
        <RouteCard
          description="后续会把 PERM、PWD、I-140/I-485 的边界写清楚，避免把单一公开记录当结果。"
          meta="边界"
          title="流程解释"
        />
      </div>

      <div className="mt-6">
        <SourceNote names={["DOL OFLC PERM disclosure data"]} />
      </div>

      <section className="mt-6 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">如何读这个页面</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          PERM disclosure data 反映劳工认证公开记录，不等于 I-140、I-485
          或绿卡最终结果。本站只展示公开数据中的雇主信号和限制。
        </p>
      </section>
    </PageShell>
  );
}
