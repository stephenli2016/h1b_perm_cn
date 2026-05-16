import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentArticle } from "@/components/content/content-article";
import {
  getContentPageBySlug,
  listDynamicToolContentPages,
} from "@/lib/content/guide-pages";

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
    title: page.title,
    description: page.metaDescription,
    alternates: {
      canonical: page.path,
    },
    robots: {
      index: true,
      follow: true,
    },
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
