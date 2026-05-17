import type { BreadcrumbItem } from "@/components/ui/breadcrumbs";
import type { ContentPage } from "@/lib/content/guide-pages";
import { getCanonicalUrl, siteConfig } from "@/lib/site";

export type JsonLdNode = Record<string, unknown>;

type WebPageJsonLdInput = {
  title: string;
  description: string;
  path: string;
  pageType?: "WebPage" | "CollectionPage" | "AboutPage";
};

type DatasetJsonLdInput = {
  name: string;
  description: string;
  path: string;
  dateModified?: string;
  sources: readonly string[];
};

type WebApplicationJsonLdInput = {
  title: string;
  description: string;
  path: string;
  dateModified?: string;
};

const publisherNode = {
  "@type": "Organization",
  name: siteConfig.chineseName,
  url: getCanonicalUrl("/"),
};

export function buildJsonLdGraph(
  nodes: readonly (JsonLdNode | undefined | null | false)[],
) {
  const graph = nodes.filter(Boolean) as JsonLdNode[];

  if (graph.length === 0) {
    return undefined;
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function buildBreadcrumbListJsonLd(
  items: readonly BreadcrumbItem[],
  currentPath: string,
): JsonLdNode | undefined {
  if (items.length === 0) {
    return undefined;
  }

  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: getCanonicalUrl(item.href ?? currentPath),
    })),
  };
}

export function buildWebsiteJsonLd(): JsonLdNode {
  return {
    "@type": "WebSite",
    name: siteConfig.chineseName,
    alternateName: siteConfig.name,
    description: siteConfig.description,
    url: getCanonicalUrl("/"),
    inLanguage: "zh-CN",
    publisher: publisherNode,
  };
}

export function buildWebPageJsonLd({
  description,
  pageType = "WebPage",
  path,
  title,
}: WebPageJsonLdInput): JsonLdNode {
  return {
    "@type": pageType,
    name: title,
    description,
    url: getCanonicalUrl(path),
    inLanguage: "zh-CN",
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.chineseName,
      url: getCanonicalUrl("/"),
    },
    publisher: publisherNode,
  };
}

export function buildContentPageJsonLd(page: ContentPage): JsonLdNode {
  if (page.kind === "tool") {
    return buildWebApplicationJsonLd({
      title: page.title,
      description: page.metaDescription,
      path: page.path,
      dateModified: page.lastReviewed,
    });
  }

  return {
    "@type": "Article",
    headline: page.title,
    description: page.metaDescription,
    url: getCanonicalUrl(page.path),
    mainEntityOfPage: getCanonicalUrl(page.path),
    inLanguage: "zh-CN",
    dateModified: page.lastReviewed,
    author: publisherNode,
    publisher: publisherNode,
  };
}

export function buildWebApplicationJsonLd({
  dateModified,
  description,
  path,
  title,
}: WebApplicationJsonLdInput): JsonLdNode {
  return {
    "@type": "WebApplication",
    name: title,
    description,
    url: getCanonicalUrl(path),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "zh-CN",
    dateModified,
    publisher: publisherNode,
  };
}

export function buildDatasetJsonLd({
  dateModified,
  description,
  name,
  path,
  sources,
}: DatasetJsonLdInput): JsonLdNode {
  return {
    "@type": "Dataset",
    name,
    description,
    url: getCanonicalUrl(path),
    inLanguage: "zh-CN",
    dateModified,
    isBasedOn: sources,
    creator: publisherNode,
    publisher: publisherNode,
  };
}

export function buildFaqPageJsonLd(
  faqItems: readonly { question: string; answer: string }[],
): JsonLdNode | undefined {
  if (faqItems.length === 0) {
    return undefined;
  }

  return {
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
