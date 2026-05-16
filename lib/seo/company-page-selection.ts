import { calculateCompanyPageMetrics } from "@/lib/db/local-repository";
import type { CompanyPageMetrics, Employer, FixtureData } from "@/lib/db/types";
import {
  getCompanyPageSeo,
  type CompanyPageMode,
} from "@/lib/seo/company-quality";
import { getCanonicalUrl } from "@/lib/site";

export const INITIAL_COMPANY_PAGE_TARGET = 500;
export const EXPANDED_COMPANY_PAGE_TARGET = 2000;
export const COMPANY_PAGE_SELECTION_BUDGET_MS = 4000;
export const COMPANY_SITEMAP_PAGE_SIZE = 500;
export const COMPANY_PAGE_VISIBLE_ROW_BUDGET = 64;

export const COMPANY_PAGE_VISIBLE_LIMITS = {
  h1bRecentRecords: 8,
  permTimelineRows: 8,
  jobBreakdownRows: 20,
  locationBreakdownRows: 20,
  fiscalYearRows: 5,
} as const;

export type CompanyDataSourceKind =
  | "official_or_imported"
  | "fixture"
  | "generated_fixture"
  | "empty";

export type CompanyPageRouteCandidate = {
  employer: Employer;
  metrics: CompanyPageMetrics;
  mode: CompanyPageMode;
  path: string;
  url: string;
  rank: number;
  recordCount5y: number;
  matchedThresholds: readonly string[];
  contentFingerprint: string;
  estimatedVisibleRows: number;
  latestDataDate?: string;
};

export type CompanyPageSelectionOptions = {
  limit?: number;
  modes?: readonly CompanyPageMode[];
};

export type CompanyPageSelectionProfile = {
  dataSourceKind: CompanyDataSourceKind;
  targetPageCount: number;
  availableRouteCount: number;
  selectedRouteCount: number;
  h1bRouteCount: number;
  permRouteCount: number;
  uniqueEmployerCount: number;
  duplicateContentFingerprintCount: number;
  lowDataSelectedRouteCount: number;
  oversizedPageCount: number;
  maxEstimatedVisibleRows: number;
  elapsedMs: number;
  budgetMs: number;
  withinBudget: boolean;
  buildStrategy: "pre_generate_selected_routes_dynamic_fallback";
};

export function selectCompanyPageRoutes(
  data: FixtureData,
  options: CompanyPageSelectionOptions = {},
): CompanyPageRouteCandidate[] {
  const limit = options.limit ?? EXPANDED_COMPANY_PAGE_TARGET;
  const modes = options.modes ?? (["h1b", "perm"] as const);
  const metricsByEmployer = calculateCompanyPageMetrics(data);
  const sourceFilesByEmployer = getSourceFilesByEmployer(data);
  const candidates = metricsByEmployer.flatMap((metrics) => {
    const employer = data.employers.find(
      (candidate) => candidate.id === metrics.employerId,
    );

    if (!employer) {
      return [];
    }

    return modes.flatMap((mode) => {
      const pageSeo = getCompanyPageSeo(metrics, mode);

      if (!pageSeo.indexable) {
        return [];
      }

      return [
        {
          employer,
          metrics,
          mode,
          path: `/${mode}/company/${employer.slug}`,
          url: getCanonicalUrl(`/${mode}/company/${employer.slug}`),
          rank: 0,
          recordCount5y: routeRecordCount(metrics, mode),
          matchedThresholds: pageSeo.matchedThresholds,
          contentFingerprint: getCompanyContentFingerprint(
            data,
            metrics.employerId,
            mode,
          ),
          estimatedVisibleRows: estimateCompanyPageVisibleRows(metrics),
          latestDataDate: latestSourceDate(
            sourceFilesByEmployer.get(employer.id) ?? [],
          ),
        },
      ];
    });
  });

  return candidates
    .sort(compareCompanyPageRoutes)
    .slice(0, limit)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));
}

export function listCompanyStaticSlugs(
  data: FixtureData,
  mode: CompanyPageMode,
  limit = EXPANDED_COMPANY_PAGE_TARGET,
) {
  return selectCompanyPageRoutes(data, {
    limit,
    modes: [mode],
  }).map((candidate) => candidate.employer.slug);
}

export function profileCompanyPageSelection(
  data: FixtureData,
  options: CompanyPageSelectionOptions & {
    budgetMs?: number;
    now?: () => number;
  } = {},
): CompanyPageSelectionProfile {
  const now = options.now ?? (() => Date.now());
  const budgetMs = options.budgetMs ?? COMPANY_PAGE_SELECTION_BUDGET_MS;
  const targetPageCount = options.limit ?? EXPANDED_COMPANY_PAGE_TARGET;
  const startedAt = now();
  const availableRoutes = selectCompanyPageRoutes(data, {
    ...options,
    limit: Number.MAX_SAFE_INTEGER,
  });
  const selected = availableRoutes.slice(0, targetPageCount);
  const elapsedMs = Math.max(0, now() - startedAt);
  const fingerprints = selected.map(
    (candidate) => candidate.contentFingerprint,
  );
  const visibleRows = selected.map(
    (candidate) => candidate.estimatedVisibleRows,
  );

  return {
    dataSourceKind: inferCompanyDataSourceKind(data),
    targetPageCount,
    availableRouteCount: availableRoutes.length,
    selectedRouteCount: selected.length,
    h1bRouteCount: selected.filter((candidate) => candidate.mode === "h1b")
      .length,
    permRouteCount: selected.filter((candidate) => candidate.mode === "perm")
      .length,
    uniqueEmployerCount: new Set(
      selected.map((candidate) => candidate.employer.id),
    ).size,
    duplicateContentFingerprintCount:
      fingerprints.length - new Set(fingerprints).size,
    lowDataSelectedRouteCount: selected.filter(
      (candidate) => candidate.matchedThresholds.length === 0,
    ).length,
    oversizedPageCount: selected.filter(
      (candidate) =>
        candidate.estimatedVisibleRows > COMPANY_PAGE_VISIBLE_ROW_BUDGET,
    ).length,
    maxEstimatedVisibleRows: Math.max(...visibleRows, 0),
    elapsedMs,
    budgetMs,
    withinBudget: elapsedMs <= budgetMs,
    buildStrategy: "pre_generate_selected_routes_dynamic_fallback",
  };
}

export function estimateCompanyPageVisibleRows(metrics: CompanyPageMetrics) {
  return (
    Math.min(
      COMPANY_PAGE_VISIBLE_LIMITS.fiscalYearRows,
      metrics.latestFiscalYear > 0
        ? COMPANY_PAGE_VISIBLE_LIMITS.fiscalYearRows
        : 0,
    ) +
    Math.min(COMPANY_PAGE_VISIBLE_LIMITS.h1bRecentRecords, metrics.lcaCount5y) +
    Math.min(
      COMPANY_PAGE_VISIBLE_LIMITS.permTimelineRows,
      metrics.permCount5y,
    ) +
    Math.min(
      COMPANY_PAGE_VISIBLE_LIMITS.jobBreakdownRows,
      metrics.jobTitleCount,
    ) +
    Math.min(
      COMPANY_PAGE_VISIBLE_LIMITS.locationBreakdownRows,
      metrics.locationCount,
    )
  );
}

export function inferCompanyDataSourceKind(
  data: FixtureData,
): CompanyDataSourceKind {
  if (
    data.employers.length === 0 &&
    data.h1bLcaRecords.length === 0 &&
    data.permRecords.length === 0
  ) {
    return "empty";
  }

  const sourceNames = data.sourceFiles
    .map((sourceFile) => sourceFile.sourceName.toLowerCase())
    .join(" ");

  if (sourceNames.includes("generated")) {
    return "generated_fixture";
  }

  if (sourceNames.includes("fixture")) {
    return "fixture";
  }

  return "official_or_imported";
}

function getSourceFilesByEmployer(data: FixtureData) {
  const sourceFilesByEmployer = new Map<string, typeof data.sourceFiles>();

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

  return sourceFilesByEmployer;
}

function routeRecordCount(metrics: CompanyPageMetrics, mode: CompanyPageMode) {
  if (mode === "perm") {
    return metrics.permCount5y;
  }

  return metrics.lcaCount5y + metrics.uscisRecordCount5y;
}

function getCompanyContentFingerprint(
  data: FixtureData,
  employerId: string,
  mode: CompanyPageMode,
) {
  const h1bRecords =
    mode === "h1b"
      ? data.h1bLcaRecords.filter((record) => record.employerId === employerId)
      : [];
  const permRecords =
    mode === "perm"
      ? data.permRecords.filter((record) => record.employerId === employerId)
      : [];
  const jobTitles = [
    ...h1bRecords.map((record) => record.jobTitle),
    ...permRecords.map((record) => record.jobTitle),
  ];
  const locations = [
    ...h1bRecords.map(
      (record) => `${record.worksiteCity}, ${record.worksiteState}`,
    ),
    ...permRecords.map(
      (record) => `${record.worksiteCity}, ${record.worksiteState}`,
    ),
  ];

  return [
    mode,
    uniqueSorted(jobTitles).slice(0, 5).join("|"),
    uniqueSorted(locations).slice(0, 5).join("|"),
  ].join("::");
}

function latestSourceDate(sourceFiles: readonly { latestDataDate?: string }[]) {
  return sourceFiles
    .map((sourceFile) => sourceFile.latestDataDate)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);
}

function compareCompanyPageRoutes(
  left: Omit<CompanyPageRouteCandidate, "rank">,
  right: Omit<CompanyPageRouteCandidate, "rank">,
) {
  return (
    right.metrics.qualityScore - left.metrics.qualityScore ||
    right.recordCount5y - left.recordCount5y ||
    right.metrics.jobTitleCount - left.metrics.jobTitleCount ||
    right.metrics.locationCount - left.metrics.locationCount ||
    right.metrics.latestFiscalYear - left.metrics.latestFiscalYear ||
    left.employer.displayName.localeCompare(right.employer.displayName) ||
    left.mode.localeCompare(right.mode)
  );
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right),
  );
}
