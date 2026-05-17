import { localFixtureData } from "@/data/fixtures/local-fixtures";
import { listContentPages, type ContentKind } from "@/lib/content/guide-pages";
import {
  getDatabaseRuntimeStatus,
  getRuntimeDataMode,
  queryPostgresRows,
} from "@/lib/db/postgres-fixture-data";
import type { FixtureData } from "@/lib/db/types";
import {
  COMPANY_SITEMAP_PAGE_SIZE,
  EXPANDED_COMPANY_PAGE_TARGET,
  selectCompanyPageRoutes,
} from "@/lib/seo/company-page-selection";
import { isPrelaunchNoindexEnabled } from "@/lib/seo/prelaunch";
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

type RuntimeCompanySitemapRow = {
  mode: "h1b" | "perm";
  slug: string;
  rank: string | number;
  latest_data_date: Date | string | null;
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
  if (isPrelaunchNoindexEnabled()) {
    return [];
  }

  switch (kind) {
    case "core":
      return listStaticRouteEntries(["core", "compliance", "data-directory"]);
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

export async function listRuntimeCompanySitemapEntries(
  options: SitemapListOptions = {},
): Promise<SitemapEntry[]> {
  if (getRuntimeDataMode() === "postgres") {
    if (!getDatabaseRuntimeStatus().configured) {
      return [];
    }

    return listPostgresCompanyPageEntries(options);
  }

  return listSitemapEntries("company-pages", localFixtureData, options);
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
  if (isPrelaunchNoindexEnabled()) {
    return [];
  }

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

async function listPostgresCompanyPageEntries(
  options: SitemapListOptions = {},
): Promise<SitemapEntry[]> {
  const pageSize = options.pageSize ?? COMPANY_SITEMAP_PAGE_SIZE;
  const page = Math.max(1, options.page ?? 1);
  const limit = options.limit ?? EXPANDED_COMPANY_PAGE_TARGET;
  const start = options.page === undefined ? 0 : (page - 1) * pageSize;
  const pageLimit = options.page === undefined ? limit : pageSize;
  const rows = await queryPostgresRows<RuntimeCompanySitemapRow>(
    `
      with candidates as (
        select
          'h1b'::text as mode,
          e.slug,
          e.display_name,
          m.quality_score,
          (m.lca_count_5y + m.uscis_record_count_5y) as record_count_5y,
          m.job_title_count,
          m.location_count,
          m.latest_fiscal_year,
          s.latest_data_date
        from public.company_page_metrics m
        join public.employers e on e.id = m.employer_id
        left join public.company_source_stats s on s.employer_id = m.employer_id
        where m.indexable = true
          and m.job_title_count > 0
          and m.location_count > 0
          and (m.lca_count_5y >= 10 or m.uscis_record_count_5y >= 3)
        union all
        select
          'perm'::text as mode,
          e.slug,
          e.display_name,
          m.quality_score,
          m.perm_count_5y as record_count_5y,
          m.job_title_count,
          m.location_count,
          m.latest_fiscal_year,
          s.latest_data_date
        from public.company_page_metrics m
        join public.employers e on e.id = m.employer_id
        left join public.company_source_stats s on s.employer_id = m.employer_id
        where m.indexable = true
          and m.job_title_count > 0
          and m.location_count > 0
          and m.perm_count_5y >= 3
      ),
      ranked as (
        select
          mode,
          slug,
          latest_data_date,
          row_number() over (
            order by
              quality_score desc,
              record_count_5y desc,
              job_title_count desc,
              location_count desc,
              latest_fiscal_year desc,
              display_name asc,
              mode asc
          ) as rank
        from candidates
      )
      select mode, slug, latest_data_date, rank::text
      from ranked
      where rank <= $1
      order by rank
      limit $2 offset $3
    `,
    [limit, pageLimit, start],
  );

  return rows.map((row) => {
    const rank = toNumber(row.rank);

    return {
      url: getCanonicalUrl(`/${row.mode}/company/${row.slug}`),
      lastModified: toDateString(row.latest_data_date),
      changeFrequency: "monthly" as const,
      priority: rank <= 100 ? 0.8 : 0.65,
    };
  });
}

function listVisaBulletinEntries(data: FixtureData): SitemapEntry[] {
  const hubRoute = publicRoutes.find(
    (route) =>
      route.path === "/visa-bulletin" && route.indexing === "indexable",
  );
  const hubEntry = hubRoute
    ? [
        {
          url: getCanonicalUrl(hubRoute.path),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        },
      ]
    : [];

  return [
    ...hubEntry,
    ...Array.from(data.visaBulletinMonths)
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
      })),
  ];
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

function toDateString(value: Date | string | null) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}
