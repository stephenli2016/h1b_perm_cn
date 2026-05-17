import type { Metadata } from "next";

import {
  getCanonicalUrl,
  getRoute,
  siteConfig,
  type PublicRoute,
} from "@/lib/site";

export type SeoPageType =
  | "website"
  | "article"
  | "tool"
  | "data"
  | "compliance";

export type SearchParamsLike =
  | Record<string, string | string[] | undefined>
  | undefined;

type BuildSeoMetadataOptions = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  follow?: boolean;
  pageType?: SeoPageType;
};

const openGraphTypeByPageType: Record<SeoPageType, "website" | "article"> = {
  website: "website",
  article: "article",
  tool: "website",
  data: "website",
  compliance: "article",
};

export function buildSeoMetadata({
  description,
  follow = true,
  index = true,
  pageType = "website",
  path,
  title,
}: BuildSeoMetadataOptions): Metadata {
  const canonicalPath = normalizeCanonicalPath(path);
  const canonicalUrl = getCanonicalUrl(canonicalPath);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index,
      follow,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: `${siteConfig.chineseName} | ${siteConfig.name}`,
      locale: "zh_CN",
      type: openGraphTypeByPageType[pageType],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function buildRouteSeoMetadata(
  path: string,
  overrides: Partial<BuildSeoMetadataOptions> = {},
): Metadata {
  const route = getRoute(path);

  if (!route) {
    return buildSeoMetadata({
      title: overrides.title ?? siteConfig.chineseName,
      description: overrides.description ?? siteConfig.description,
      path,
      index: overrides.index,
      follow: overrides.follow,
      pageType: overrides.pageType,
    });
  }

  return buildSeoMetadata({
    title: overrides.title ?? route.title,
    description: overrides.description ?? route.description,
    path: overrides.path ?? route.path,
    index: overrides.index ?? route.indexing === "indexable",
    follow: overrides.follow ?? true,
    pageType: overrides.pageType ?? pageTypeForRoute(route),
  });
}

export function buildNoIndexSeoMetadata({
  description,
  path,
  title,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return buildSeoMetadata({
    title,
    description,
    path,
    index: false,
    follow: true,
  });
}

export function hasSubmittedSearchParams(params: SearchParamsLike) {
  if (!params) {
    return false;
  }

  return Object.values(params).some((value) => {
    if (Array.isArray(value)) {
      return value.some((item) => item.trim().length > 0);
    }

    return typeof value === "string" && value.trim().length > 0;
  });
}

export function normalizeCanonicalPath(path: string) {
  const withoutQuery = path.split("?")[0]?.split("#")[0] ?? "/";
  const normalized =
    withoutQuery.length > 1 && withoutQuery.endsWith("/")
      ? withoutQuery.slice(0, -1)
      : withoutQuery;

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function pageTypeForRoute(route: PublicRoute): SeoPageType {
  if (route.section === "tools") {
    return "tool";
  }
  if (route.section === "guides") {
    return "article";
  }
  if (route.section === "compliance" || route.section === "about") {
    return "compliance";
  }
  if (route.dataPage) {
    return "data";
  }

  return "website";
}
