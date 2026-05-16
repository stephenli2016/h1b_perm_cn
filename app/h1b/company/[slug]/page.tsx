import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompanyProfile } from "@/components/company/company-profile";
import { PageShell } from "@/components/page-shell";
import { publicQueryRepository } from "@/lib/db/public-query-repository";
import { getCompanyPageSeo } from "@/lib/seo/company-quality";

type CompanyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = true;

export function generateStaticParams() {
  return publicQueryRepository
    .listCompanyStaticSlugs("h1b")
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = publicQueryRepository.getCompanyProfileBySlug({ slug });

  if (!result.ok) {
    return {
      title: "未找到 H-1B 公司页",
      description: "未找到对应公司的 H-1B 公开数据页面。",
      robots: {
        index: false,
        follow: true,
      },
    };
  }
  const pageSeo = getCompanyPageSeo(result.data.metrics, "h1b");

  return {
    title: `${result.data.employer.displayName} H-1B / PERM 公开数据`,
    description: `查看 ${result.data.employer.displayName} 的 H-1B LCA、PERM、工资、职位和 worksite 公开数据信号。公开数据仅供参考，不构成法律或职业建议。`,
    alternates: {
      canonical: `/h1b/company/${slug}`,
    },
    robots: pageSeo.robots,
  };
}

export default async function H1BCompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const result = publicQueryRepository.getCompanyProfileBySlug({ slug });

  if (!result.ok) {
    notFound();
  }

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/h1b", label: "H-1B" },
        { label: result.data.employer.displayName },
      ]}
      description="公司页汇总 H-1B LCA、PERM、工资、职位、地点和数据来源。低数据页面会保持 noindex，达标页面才进入 sitemap。"
      eyebrow="H-1B 公司页"
      title={`${result.data.employer.displayName} 的 H-1B 与 PERM 公开数据信号`}
    >
      <CompanyProfile mode="h1b" profile={result.data} />
    </PageShell>
  );
}
