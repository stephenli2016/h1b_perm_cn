import { localFixtureData } from "@/data/fixtures/local-fixtures";
import type {
  CompanyPageMetrics,
  Employer,
  FixtureData,
  H1BLcaRecord,
  PermRecord,
  PwdRecord,
  VisaBulletinDate,
} from "@/lib/db/types";

export type EmployerSearchResult = {
  employer: Employer;
  matchedAliases: string[];
};

export type EmployerImmigrationSummary = {
  employer: Employer;
  metrics?: CompanyPageMetrics;
  h1b: {
    total: number;
    certified: number;
    withdrawn: number;
    denied: number;
    fiscalYears: readonly number[];
  };
  perm: {
    total: number;
    certified: number;
    denied: number;
    withdrawn: number;
    fiscalYears: readonly number[];
  };
  uscis: {
    totalRecords: number;
    initialApprovals: number;
    initialDenials: number;
    continuingApprovals: number;
    continuingDenials: number;
  };
  topJobTitles: readonly { jobTitle: string; count: number }[];
  topLocations: readonly { location: string; count: number }[];
  sourceNames: readonly string[];
  latestDataDate?: string;
};

export type WageLookupInput = {
  socCode: string;
  state: string;
  city?: string;
  effectiveYear?: number;
};

export type VisaBulletinLookupInput = {
  monthKey: string;
  category: VisaBulletinDate["category"];
  chargeabilityArea: VisaBulletinDate["chargeabilityArea"];
  chartType: VisaBulletinDate["chartType"];
};

export function getLocalFixtureData(): FixtureData {
  return localFixtureData;
}

export function normalizeEmployerName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(
      /\b(incorporated|inc|llc|l\.l\.c|corp|corporation|co|company)\b/g,
      " ",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getEmployerBySlug(
  slug: string,
  data: FixtureData = localFixtureData,
) {
  return data.employers.find((employer) => employer.slug === slug);
}

export function searchEmployers(
  query: string,
  data: FixtureData = localFixtureData,
): EmployerSearchResult[] {
  const normalizedQuery = normalizeEmployerName(query);

  if (!normalizedQuery) {
    return [];
  }

  return data.employers
    .map((employer) => {
      const aliases = data.employerAliases.filter(
        (alias) => alias.employerId === employer.id,
      );
      const searchableNames = [
        employer.canonicalName,
        employer.displayName,
        employer.normalizedName,
        ...aliases.map((alias) => alias.rawName),
        ...aliases.map((alias) => alias.normalizedName),
      ].map(normalizeEmployerName);
      const matched = searchableNames.some((name) =>
        name.includes(normalizedQuery),
      );

      return matched
        ? {
            employer,
            matchedAliases: aliases.map((alias) => alias.rawName),
          }
        : undefined;
    })
    .filter((result): result is EmployerSearchResult => Boolean(result));
}

export function getEmployerImmigrationSummary(
  slug: string,
  data: FixtureData = localFixtureData,
): EmployerImmigrationSummary | undefined {
  const employer = getEmployerBySlug(slug, data);

  if (!employer) {
    return undefined;
  }

  const h1bRecords = data.h1bLcaRecords.filter(
    (record) => record.employerId === employer.id,
  );
  const permRecords = data.permRecords.filter(
    (record) => record.employerId === employer.id,
  );
  const uscisRecords = data.uscisH1BEmployerRecords.filter(
    (record) => record.employerId === employer.id,
  );
  const sourceIds = new Set([
    ...h1bRecords.map((record) => record.sourceFileId),
    ...permRecords.map((record) => record.sourceFileId),
    ...uscisRecords.map((record) => record.sourceFileId),
  ]);
  const sourceFiles = data.sourceFiles.filter((sourceFile) =>
    sourceIds.has(sourceFile.id),
  );

  return {
    employer,
    metrics: data.companyPageMetrics.find(
      (metrics) => metrics.employerId === employer.id,
    ),
    h1b: {
      total: h1bRecords.length,
      certified: countH1BStatus(h1bRecords, "CERTIFIED"),
      withdrawn: countH1BStatus(h1bRecords, "WITHDRAWN"),
      denied: countH1BStatus(h1bRecords, "DENIED"),
      fiscalYears: uniqueSorted(h1bRecords.map((record) => record.fiscalYear)),
    },
    perm: {
      total: permRecords.length,
      certified: countPermStatus(permRecords, "Certified"),
      denied: countPermStatus(permRecords, "Denied"),
      withdrawn: countPermStatus(permRecords, "Withdrawn"),
      fiscalYears: uniqueSorted(permRecords.map((record) => record.fiscalYear)),
    },
    uscis: {
      totalRecords: uscisRecords.length,
      initialApprovals: sum(
        uscisRecords.map((record) => record.initialApprovals),
      ),
      initialDenials: sum(uscisRecords.map((record) => record.initialDenials)),
      continuingApprovals: sum(
        uscisRecords.map((record) => record.continuingApprovals),
      ),
      continuingDenials: sum(
        uscisRecords.map((record) => record.continuingDenials),
      ),
    },
    topJobTitles: topCounts([
      ...h1bRecords.map((record) => record.jobTitle),
      ...permRecords.map((record) => record.jobTitle),
    ]).map(({ value, count }) => ({ jobTitle: value, count })),
    topLocations: topCounts([
      ...h1bRecords.map(
        (record) => `${record.worksiteCity}, ${record.worksiteState}`,
      ),
      ...permRecords.map(
        (record) => `${record.worksiteCity}, ${record.worksiteState}`,
      ),
    ]).map(({ value, count }) => ({ location: value, count })),
    sourceNames: sourceFiles.map((sourceFile) => sourceFile.sourceName),
    latestDataDate: sourceFiles
      .map((sourceFile) => sourceFile.latestDataDate)
      .filter((date): date is string => Boolean(date))
      .sort()
      .at(-1),
  };
}

export function findPrevailingWage(
  input: WageLookupInput,
  data: FixtureData = localFixtureData,
): PwdRecord | undefined {
  const city = input.city?.toLowerCase();
  const state = input.state.toUpperCase();

  return data.pwdRecords
    .filter((record) => record.socCode === input.socCode)
    .filter((record) => record.state.toUpperCase() === state)
    .filter((record) => !city || record.city.toLowerCase() === city)
    .filter(
      (record) =>
        input.effectiveYear === undefined ||
        record.effectiveYear === input.effectiveYear,
    )
    .sort((a, b) => b.effectiveYear - a.effectiveYear)[0];
}

export function getVisaBulletinCutoff(
  input: VisaBulletinLookupInput,
  data: FixtureData = localFixtureData,
) {
  const month = data.visaBulletinMonths.find(
    (candidate) => candidate.monthKey === input.monthKey,
  );

  if (!month) {
    return undefined;
  }

  const date = data.visaBulletinDates.find(
    (candidate) =>
      candidate.bulletinMonthId === month.id &&
      candidate.category === input.category &&
      candidate.chargeabilityArea === input.chargeabilityArea &&
      candidate.chartType === input.chartType,
  );

  return date ? { month, date } : undefined;
}

export function listIndexableCompanyCandidates(
  data: FixtureData = localFixtureData,
) {
  return data.companyPageMetrics
    .filter((metrics) => metrics.indexable)
    .map((metrics) => ({
      metrics,
      employer: data.employers.find(
        (employer) => employer.id === metrics.employerId,
      ),
    }))
    .filter(
      (
        candidate,
      ): candidate is { metrics: CompanyPageMetrics; employer: Employer } =>
        Boolean(candidate.employer),
    );
}

export function listPriorityGuidePages(
  priority: 1 | 2 | 3,
  data: FixtureData = localFixtureData,
) {
  return data.guidePages.filter((guide) => guide.priority === priority);
}

function countH1BStatus(
  records: readonly H1BLcaRecord[],
  status: H1BLcaRecord["caseStatus"],
) {
  return records.filter((record) => record.caseStatus === status).length;
}

function countPermStatus(
  records: readonly PermRecord[],
  status: PermRecord["caseStatus"],
) {
  return records.filter((record) => record.caseStatus === status).length;
}

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function uniqueSorted(values: readonly number[]) {
  return [...new Set(values)].sort((a, b) => b - a);
}

function topCounts(values: readonly string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
