import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompanyProfile } from "@/components/company/company-profile";
import { PageShell } from "@/components/page-shell";
import { getRuntimeDataMode } from "@/lib/db/postgres-fixture-data";
import { getPostgresCompanyProfileBySlug } from "@/lib/db/postgres-directory-queries";
import { getRuntimePublicQueryRepository } from "@/lib/db/runtime-public-query-repository";
import { shouldGenerateCompanyStaticParams } from "@/lib/seo/company-static-generation";
import { getCompanyPageSeo } from "@/lib/seo/company-quality";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildNoIndexSeoMetadata, buildSeoMetadata } from "@/lib/seo/metadata";

type CompanyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  if (!shouldGenerateCompanyStaticParams()) {
    return [];
  }

  const repo = await getRuntimePublicQueryRepository();

  return repo.listCompanyStaticSlugs("perm").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result =
    getRuntimeDataMode() === "postgres"
      ? await getPostgresCompanyProfileBySlug(slug)
      : (await getRuntimePublicQueryRepository()).getCompanyProfileBySlug({
          slug,
        });

  if (!result.ok) {
    return buildNoIndexSeoMetadata({
      title: "未找到 PERM 公司页",
      description: "未找到对应公司的 PERM 公开数据页面。",
      path: `/perm/company/${slug}`,
    });
  }
  const pageSeo = getCompanyPageSeo(result.data.metrics, "perm");

  return buildSeoMetadata({
    title: `${result.data.employer.displayName} PERM / H-1B 公开数据`,
    description: `查看 ${result.data.employer.displayName} 的 PERM、H-1B LCA、工资、职位和工作地点公开数据信号。公开数据仅供参考，不构成法律或职业建议。`,
    path: `/perm/company/${slug}`,
    index: pageSeo.indexable,
    pageType: "data",
  });
}

export default async function PermCompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const result =
    getRuntimeDataMode() === "postgres"
      ? await getPostgresCompanyProfileBySlug(slug)
      : (await getRuntimePublicQueryRepository()).getCompanyProfileBySlug({
          slug,
        });

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
      canonicalPath={`/perm/company/${slug}`}
      description="公司页汇总 PERM、H-1B LCA、工资、职位、地点和数据来源，帮助你把公开记录转成给雇主或律师的问题。PERM 记录不等于 I-140/I-485 或绿卡结果。"
      eyebrow="PERM 公司页"
      structuredData={buildWebPageJsonLd({
        title: `${result.data.employer.displayName} 的 PERM 与 H-1B 公开数据信号`,
        description:
          "公司页汇总 PERM、H-1B LCA、工资、职位、地点和数据来源，帮助你把公开记录转成给雇主或律师的问题。PERM 记录不等于 I-140/I-485 或绿卡结果。",
        path: `/perm/company/${slug}`,
      })}
      title={`${result.data.employer.displayName} 的 PERM 与 H-1B 公开数据信号`}
    >
      <CompanyProfile mode="perm" profile={result.data} />
    </PageShell>
  );
}
