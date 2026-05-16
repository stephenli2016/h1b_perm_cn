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
    .listCompanyStaticSlugs("perm")
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = publicQueryRepository.getCompanyProfileBySlug({ slug });

  if (!result.ok) {
    return {
      title: "未找到 PERM 公司页",
      description: "未找到对应公司的 PERM 公开数据页面。",
      robots: {
        index: false,
        follow: true,
      },
    };
  }
  const pageSeo = getCompanyPageSeo(result.data.metrics, "perm");

  return {
    title: `${result.data.employer.displayName} PERM / H-1B 公开数据`,
    description: `查看 ${result.data.employer.displayName} 的 PERM、H-1B LCA、工资、职位和 worksite 公开数据信号。公开数据仅供参考，不构成法律或职业建议。`,
    alternates: {
      canonical: `/perm/company/${slug}`,
    },
    robots: pageSeo.robots,
  };
}

export default async function PermCompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const result = publicQueryRepository.getCompanyProfileBySlug({ slug });

  if (!result.ok) {
    notFound();
  }

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/perm", label: "PERM" },
        { label: result.data.employer.displayName },
      ]}
      description="公司页汇总 PERM、H-1B LCA、工资、职位、地点和数据来源。PERM 记录不等于 I-140/I-485 或绿卡结果。"
      eyebrow="PERM 公司页"
      title={`${result.data.employer.displayName} 的 PERM 与 H-1B 公开数据信号`}
    >
      <CompanyProfile mode="perm" profile={result.data} />
    </PageShell>
  );
}
