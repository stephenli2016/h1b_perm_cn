import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentArticle } from "@/components/content/content-article";
import {
  getContentPageBySlug,
  listContentPages,
} from "@/lib/content/guide-pages";

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
