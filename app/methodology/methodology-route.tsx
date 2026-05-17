import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MethodologyContent } from "@/components/compliance/methodology-content";
import { PageShell } from "@/components/page-shell";
import { getMethodologyPage } from "@/lib/compliance/content";
import { buildWebPageJsonLd } from "@/lib/seo/json-ld";
import { buildRouteSeoMetadata } from "@/lib/seo/metadata";

export function buildMethodologyMetadata(slug: string): Metadata {
  const page = getMethodologyPage(slug);

  if (!page) {
    return buildRouteSeoMetadata("/methodology");
  }

  return buildRouteSeoMetadata(page.path, {
    title: page.title,
    description: page.description,
  });
}

export function MethodologyRoutePage({ slug }: { slug: string }) {
  const page = getMethodologyPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/sources", label: "数据来源" },
        { label: page.title },
      ]}
      canonicalPath={page.path}
      description={page.description}
      eyebrow="方法论"
      structuredData={buildWebPageJsonLd({
        title: page.title,
        description: page.description,
        path: page.path,
      })}
      title={page.title}
    >
      <MethodologyContent page={page} />
    </PageShell>
  );
}
