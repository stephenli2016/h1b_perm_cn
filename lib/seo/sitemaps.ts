import { localFixtureData } from "@/data/fixtures/local-fixtures";
import type { FixtureData } from "@/lib/db/types";
import {
  selectCompanyPageRoutes,
  INITIAL_COMPANY_PAGE_TARGET,
} from "@/lib/seo/company-page-selection";
import { getCanonicalUrl, publicRoutes } from "@/lib/site";

export type SitemapKind =
  | "core"
  | "company-pages"
  | "tools"
  | "guides"
  | "visa-bulletin";

export type SitemapEntry = {
  url: string;
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
};

export const splitSitemapDefinitions = [
  {
    kind: "core",
    path: "/sitemaps/core.xml",
  },
  {
    kind: "company-pages",
    path: "/sitemaps/company-pages.xml",
  },
  {
    kind: "tools",
    path: "/sitemaps/tools.xml",
  },
  {
    kind: "guides",
    path: "/sitemaps/guides.xml",
  },
  {
    kind: "visa-bulletin",
    path: "/sitemaps/visa-bulletin.xml",
  },
] as const satisfies readonly { kind: SitemapKind; path: string }[];

export function listSitemapEntries(
  kind: SitemapKind,
  data: FixtureData = localFixtureData,
): SitemapEntry[] {
  switch (kind) {
    case "core":
      return listStaticRouteEntries(["core", "compliance"]);
    case "tools":
      return listStaticRouteEntries("tools");
    case "guides":
      return listStaticRouteEntries("guides");
    case "visa-bulletin":
      return listStaticRouteEntries("visa-bulletin");
    case "company-pages":
      return listCompanyPageEntries(data);
  }
}

export function renderSitemapIndex() {
  return xmlDocument(
    [
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...splitSitemapDefinitions.map(
        (definition) =>
          `<sitemap><loc>${escapeXml(getCanonicalUrl(definition.path))}</loc></sitemap>`,
      ),
      "</sitemapindex>",
    ].join(""),
  );
}

export function renderUrlSet(entries: readonly SitemapEntry[]) {
  return xmlDocument(
    [
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries.map(renderUrlEntry),
      "</urlset>",
    ].join(""),
  );
}

export function sitemapXmlResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

function listStaticRouteEntries(
  sitemapGroups: string | readonly string[],
): SitemapEntry[] {
  const groups = Array.isArray(sitemapGroups) ? sitemapGroups : [sitemapGroups];

  return publicRoutes
    .filter((route) => groups.includes(route.sitemapGroup))
    .filter((route) => route.indexing === "indexable")
    .map((route) => ({
      url: getCanonicalUrl(route.path),
      changeFrequency: "monthly" as const,
      priority: route.path === "/" ? 1 : 0.5,
    }));
}

function listCompanyPageEntries(data: FixtureData): SitemapEntry[] {
  return selectCompanyPageRoutes(data, {
    limit: INITIAL_COMPANY_PAGE_TARGET,
  }).map((candidate) => ({
    url: candidate.url,
    lastModified: candidate.latestDataDate,
    changeFrequency: "monthly" as const,
    priority: candidate.rank <= 100 ? 0.8 : 0.65,
  }));
}

function renderUrlEntry(entry: SitemapEntry) {
  return [
    "<url>",
    `<loc>${escapeXml(entry.url)}</loc>`,
    entry.lastModified
      ? `<lastmod>${escapeXml(entry.lastModified)}</lastmod>`
      : "",
    entry.changeFrequency
      ? `<changefreq>${entry.changeFrequency}</changefreq>`
      : "",
    entry.priority === undefined
      ? ""
      : `<priority>${entry.priority}</priority>`,
    "</url>",
  ].join("");
}

function xmlDocument(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>${body}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
