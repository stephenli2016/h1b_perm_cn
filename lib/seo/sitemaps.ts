import { localFixtureData } from "@/data/fixtures/local-fixtures";
import { calculateCompanyPageMetrics } from "@/lib/db/local-repository";
import type { FixtureData, SourceFile } from "@/lib/db/types";
import {
  getCompanyPageSeo,
  type CompanyPageMode,
} from "@/lib/seo/company-quality";
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
  const sourceFilesByEmployer = new Map<string, SourceFile[]>();

  for (const employer of data.employers) {
    const sourceIds = new Set([
      ...data.h1bLcaRecords
        .filter((record) => record.employerId === employer.id)
        .map((record) => record.sourceFileId),
      ...data.permRecords
        .filter((record) => record.employerId === employer.id)
        .map((record) => record.sourceFileId),
      ...data.uscisH1BEmployerRecords
        .filter((record) => record.employerId === employer.id)
        .map((record) => record.sourceFileId),
    ]);

    sourceFilesByEmployer.set(
      employer.id,
      data.sourceFiles.filter((sourceFile) => sourceIds.has(sourceFile.id)),
    );
  }

  return calculateCompanyPageMetrics(data).flatMap((metrics) => {
    const employer = data.employers.find(
      (candidate) => candidate.id === metrics.employerId,
    );

    if (!employer) {
      return [];
    }

    return (["h1b", "perm"] as const).flatMap((mode) => {
      const pageSeo = getCompanyPageSeo(metrics, mode);

      if (!pageSeo.indexable) {
        return [];
      }

      return [
        {
          url: getCanonicalUrl(`/${mode}/company/${employer.slug}`),
          lastModified: latestSourceDate(
            sourceFilesByEmployer.get(employer.id) ?? [],
          ),
          changeFrequency: "monthly" as const,
          priority: mode === preferredCompanyMode(metrics) ? 0.8 : 0.65,
        },
      ];
    });
  });
}

function preferredCompanyMode(
  metrics: Parameters<typeof getCompanyPageSeo>[0],
): CompanyPageMode {
  return metrics && metrics.permCount5y >= metrics.lcaCount5y ? "perm" : "h1b";
}

function latestSourceDate(sourceFiles: readonly SourceFile[]) {
  return sourceFiles
    .map((sourceFile) => sourceFile.latestDataDate)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);
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
