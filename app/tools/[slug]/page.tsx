import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentArticle } from "@/components/content/content-article";
import {
  getContentPageBySlug,
  listDynamicToolContentPages,
} from "@/lib/content/guide-pages";
import { buildSeoMetadata } from "@/lib/seo/metadata";

type ToolContentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return listDynamicToolContentPages().map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: ToolContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getContentPageBySlug("tool", slug);

  if (!page) {
    return {};
  }

  return {
    ...buildSeoMetadata({
      title: page.title,
      description: page.metaDescription,
      path: page.path,
      pageType: "tool",
    }),
  };
}

export default async function ToolContentPage({
  params,
}: ToolContentPageProps) {
  const { slug } = await params;
  const page = getContentPageBySlug("tool", slug);

  if (!page) {
    notFound();
  }

  return <ContentArticle page={page} />;
}
