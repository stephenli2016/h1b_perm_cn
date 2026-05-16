import { localFixtureData } from "@/data/fixtures/local-fixtures";
import { listContentPages, type ContentKind } from "@/lib/content/guide-pages";
import type { FixtureData } from "@/lib/db/types";
import {
  COMPANY_SITEMAP_PAGE_SIZE,
  EXPANDED_COMPANY_PAGE_TARGET,
  selectCompanyPageRoutes,
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

export type SitemapIndexEntry = {
  url: string;
};

export type SitemapListOptions = {
  limit?: number;
  page?: number;
  pageSize?: number;
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
  options: SitemapListOptions = {},
): SitemapEntry[] {
  switch (kind) {
    case "core":
      return listStaticRouteEntries(["core", "compliance"]);
    case "tools":
      return listContentRouteEntries("tool", "/tools");
    case "guides":
      return listContentRouteEntries("guide", "/guides");
    case "visa-bulletin":
      return listVisaBulletinEntries(data);
    case "company-pages":
      return listCompanyPageEntries(data, options);
  }
}

function listContentRouteEntries(
  kind: ContentKind,
  directoryPath: "/tools" | "/guides",
): SitemapEntry[] {
  const directoryRoute = publicRoutes.find(
    (route) =>
      route.path === directoryPath &&
      route.sitemapGroup === (kind === "tool" ? "tools" : "guides") &&
      route.indexing === "indexable",
  );
  const directoryEntry = directoryRoute
    ? [
        {
          url: getCanonicalUrl(directoryRoute.path),
          changeFrequency: "monthly" as const,
          priority: 0.55,
        },
      ]
    : [];

  return [
    ...directoryEntry,
    ...listContentPages(kind).map((contentPage) => ({
      url: getCanonicalUrl(contentPage.path),
      lastModified: contentPage.lastReviewed,
      changeFrequency: "monthly" as const,
      priority: contentPage.priority === 1 ? 0.7 : 0.55,
    })),
  ];
}

export function listSitemapIndexEntries(
  data: FixtureData = localFixtureData,
): SitemapIndexEntry[] {
  return splitSitemapDefinitions.flatMap((definition) => {
    if (definition.kind !== "company-pages") {
      return [
        {
          url: getCanonicalUrl(definition.path),
        },
      ];
    }

    return listCompanySitemapPages(data).map((page) => ({
      url: getCanonicalUrl(page.path),
    }));
  });
}

export function listCompanySitemapPages(
  data: FixtureData = localFixtureData,
  options: SitemapListOptions = {},
) {
  const limit = options.limit ?? EXPANDED_COMPANY_PAGE_TARGET;
  const pageSize = options.pageSize ?? COMPANY_SITEMAP_PAGE_SIZE;
  const entries = listCompanyPageEntries(data, {
    limit,
  });
  const pageCount = Math.max(1, Math.ceil(entries.length / pageSize));

  if (pageCount === 1) {
    return [
      {
        page: 1,
        path: "/sitemaps/company-pages.xml",
        entryCount: entries.length,
      },
    ];
  }

  return Array.from({ length: pageCount }, (_, index) => {
    const page = index + 1;
    const start = index * pageSize;

    return {
      page,
      path: `/sitemaps/company-pages/${page}.xml`,
      entryCount: entries.slice(start, start + pageSize).length,
    };
  });
}

export function renderSitemapIndex(data: FixtureData = localFixtureData) {
  return xmlDocument(
    [
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...listSitemapIndexEntries(data).map(
        (entry) => `<sitemap><loc>${escapeXml(entry.url)}</loc></sitemap>`,
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

function listCompanyPageEntries(
  data: FixtureData,
  options: SitemapListOptions,
): SitemapEntry[] {
  const pageSize = options.pageSize ?? COMPANY_SITEMAP_PAGE_SIZE;
  const page = Math.max(1, options.page ?? 1);
  const start = options.page === undefined ? 0 : (page - 1) * pageSize;
  const end = options.page === undefined ? undefined : start + pageSize;

  return selectCompanyPageRoutes(data, {
    limit: options.limit ?? EXPANDED_COMPANY_PAGE_TARGET,
  })
    .slice(start, end)
    .map((candidate) => ({
      url: candidate.url,
      lastModified: candidate.latestDataDate,
      changeFrequency: "monthly" as const,
      priority: candidate.rank <= 100 ? 0.8 : 0.65,
    }));
}

function listVisaBulletinEntries(data: FixtureData): SitemapEntry[] {
  return [...data.visaBulletinMonths]
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey))
    .map((month) => ({
      url: getCanonicalUrl(
        `/visa-bulletin/${month.bulletinYear}/${String(
          month.bulletinMonth,
        ).padStart(2, "0")}`,
      ),
      lastModified: month.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.55,
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
