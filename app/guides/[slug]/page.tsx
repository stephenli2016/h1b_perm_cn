import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentArticle } from "@/components/content/content-article";
import {
  getContentPageBySlug,
  listContentPages,
} from "@/lib/content/guide-pages";
import { buildSeoMetadata } from "@/lib/seo/metadata";

type GuideContentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return listContentPages("guide").map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: GuideContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getContentPageBySlug("guide", slug);

  if (!page) {
    return {};
  }

  return {
    ...buildSeoMetadata({
      title: page.title,
      description: page.metaDescription,
      path: page.path,
      pageType: "article",
    }),
  };
}

export default async function GuideContentPage({
  params,
}: GuideContentPageProps) {
  const { slug } = await params;
  const page = getContentPageBySlug("guide", slug);

  if (!page) {
    notFound();
  }

  return <ContentArticle page={page} />;
}
