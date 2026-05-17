import { contentPages } from "@/lib/content/guide-pages";
import {
  listSitemapEntries,
  listSitemapIndexEntries,
  splitSitemapDefinitions,
  type SitemapKind,
} from "@/lib/seo/sitemaps";
import { getCanonicalUrl, publicRoutes, siteConfig } from "@/lib/site";

export type InternalLinkEdge = {
  from: string;
  to: string;
  reason: string;
};

export type InternalLinkGraphReport = {
  knownPaths: string[];
  edges: InternalLinkEdge[];
  brokenLinks: InternalLinkEdge[];
  sitemapUrlsWithSearchParams: string[];
  noindexRouteUrlsInSitemaps: string[];
};

const sitemapKinds = splitSitemapDefinitions.map(
  (definition) => definition.kind,
) satisfies SitemapKind[];

export function buildKnownPublicPaths() {
  const paths = new Set<string>([
    "/404",
    "/robots.txt",
    "/sitemap.xml",
    ...splitSitemapDefinitions.map((definition) => definition.path),
  ]);

  for (const route of publicRoutes) {
    const samplePath = "samplePath" in route ? route.samplePath : undefined;

    if (!route.path.includes("[") && !route.path.includes("]")) {
      paths.add(route.path);
    }
    if (samplePath) {
      paths.add(samplePath);
    }
  }

  for (const page of contentPages) {
    paths.add(page.path);
  }

  for (const kind of sitemapKinds) {
    for (const entry of listSitemapEntries(kind)) {
      paths.add(pathFromCanonicalUrl(entry.url));
    }
  }

  for (const entry of listSitemapIndexEntries()) {
    paths.add(pathFromCanonicalUrl(entry.url));
  }

  return paths;
}

export function validateInternalLinkGraph(): InternalLinkGraphReport {
  const knownPaths = buildKnownPublicPaths();
  const edges: InternalLinkEdge[] = [];

  for (const route of publicRoutes) {
    const samplePath = "samplePath" in route ? route.samplePath : undefined;

    if (!route.path.includes("[") && !route.path.includes("]")) {
      edges.push({
        from: "route-map",
        to: route.path,
        reason: "public route",
      });
    }
    if (samplePath) {
      edges.push({
        from: route.path,
        to: samplePath,
        reason: "dynamic route sample",
      });
    }
  }

  for (const page of contentPages) {
    for (const relatedPath of page.relatedPaths) {
      edges.push({
        from: page.path,
        to: relatedPath,
        reason: "content related link",
      });
    }
  }

  const sitemapUrlsWithSearchParams: string[] = [];
  const noindexRouteUrlsInSitemaps: string[] = [];

  for (const kind of sitemapKinds) {
    for (const entry of listSitemapEntries(kind)) {
      const url = new URL(entry.url);
      if (url.search.length > 0) {
        sitemapUrlsWithSearchParams.push(entry.url);
      }
      const staticRoute = publicRoutes.find(
        (route) => route.path === url.pathname,
      );
      if (staticRoute && staticRoute.indexing !== "indexable") {
        noindexRouteUrlsInSitemaps.push(entry.url);
      }
    }
  }

  const brokenLinks = edges.filter((edge) => {
    if (edge.to.startsWith("mailto:") || edge.to.startsWith("http")) {
      return false;
    }

    return !knownPaths.has(normalizeInternalPath(edge.to));
  });

  return {
    knownPaths: [...knownPaths].sort(),
    edges,
    brokenLinks,
    sitemapUrlsWithSearchParams,
    noindexRouteUrlsInSitemaps,
  };
}

export function pathFromCanonicalUrl(url: string) {
  const parsed = new URL(url, siteConfig.url);

  return normalizeInternalPath(`${parsed.pathname}${parsed.search}`);
}

export function normalizeInternalPath(path: string) {
  if (path.startsWith("http")) {
    const expectedOrigin = new URL(getCanonicalUrl("/")).origin;
    const parsed = new URL(path);

    if (parsed.origin !== expectedOrigin) {
      return path;
    }

    path = `${parsed.pathname}${parsed.search}`;
  }

  const withoutHash = path.split("#")[0] ?? "/";
  const [pathname, search = ""] = withoutHash.split("?");
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const safePath = normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;

  return search ? `${safePath}?${search}` : safePath;
}
