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

export type PrevailingWageLookupResult = {
  status: "matched" | "fallback" | "not_found";
  record?: PwdRecord;
  matchScope?: "city_state" | "area_name" | "state";
  message: string;
};

export type WageLevelMatchResult = {
  band:
    | "below_level_1"
    | "level_1_to_2"
    | "level_2_to_3"
    | "level_3_to_4"
    | "level_4_or_above"
    | "unknown";
  lowerLevel?: 1 | 2 | 3 | 4;
  lowerAmount?: number;
  nextLevel?: 1 | 2 | 3 | 4;
  nextAmount?: number;
  message: string;
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
  return lookupPrevailingWage(input, data).record;
}

export function lookupPrevailingWage(
  input: WageLookupInput,
  data: FixtureData = localFixtureData,
): PrevailingWageLookupResult {
  const cityKey = locationKey(input.city);
  const state = input.state.toUpperCase();
  const socCode = input.socCode.trim();
  const candidates = data.pwdRecords
    .filter((record) => record.socCode === socCode)
    .filter((record) => record.state.toUpperCase() === state)
    .filter(
      (record) =>
        input.effectiveYear === undefined ||
        record.effectiveYear === input.effectiveYear,
    )
    .sort((a, b) => b.effectiveYear - a.effectiveYear);

  if (candidates.length === 0) {
    return {
      status: "not_found",
      message: "No wage record matched the requested SOC, state, and year.",
    };
  }

  if (!cityKey) {
    return {
      status: "matched",
      record: candidates[0],
      matchScope: "state",
      message: "Matched by SOC, state, and year.",
    };
  }

  const cityMatch = candidates.find(
    (record) => locationKey(record.city) === cityKey,
  );

  if (cityMatch) {
    return {
      status: "matched",
      record: cityMatch,
      matchScope: "city_state",
      message: "Matched by exact city, state, SOC, and year.",
    };
  }

  const areaMatch = candidates.find((record) =>
    locationKey(record.areaName).includes(cityKey),
  );

  if (areaMatch) {
    return {
      status: "matched",
      record: areaMatch,
      matchScope: "area_name",
      message:
        "Matched by SOC, state, year, and area name containing the requested city.",
    };
  }

  const stateMatch = candidates.find(
    (record) => !record.city || /statewide/i.test(record.areaName),
  );

  if (stateMatch) {
    return {
      status: "fallback",
      record: stateMatch,
      matchScope: "state",
      message:
        "No city or area match was found; returned a state-level wage record.",
    };
  }

  return {
    status: "not_found",
    message:
      "No city, area, or state-level wage record matched the requested location.",
  };
}

export function matchWageAmountToLevels(
  record: PwdRecord,
  wageAmount: number,
): WageLevelMatchResult {
  const levels = [
    { level: 1 as const, amount: record.wageLevel1 },
    { level: 2 as const, amount: record.wageLevel2 },
    { level: 3 as const, amount: record.wageLevel3 },
    { level: 4 as const, amount: record.wageLevel4 },
  ].filter((level) => Number.isFinite(level.amount));

  if (levels.length === 0) {
    return {
      band: "unknown",
      message: "No wage level amounts are available for this record.",
    };
  }

  const firstLevel = levels[0];
  if (wageAmount < firstLevel.amount) {
    return {
      band: "below_level_1",
      nextLevel: firstLevel.level,
      nextAmount: firstLevel.amount,
      message: "The wage is below the first available wage level amount.",
    };
  }

  for (const [index, level] of levels.entries()) {
    const nextLevel = levels[index + 1];

    if (!nextLevel) {
      return {
        band: "level_4_or_above",
        lowerLevel: level.level,
        lowerAmount: level.amount,
        message:
          "The wage is at or above the highest available wage level amount.",
      };
    }

    if (wageAmount < nextLevel.amount) {
      const band = wageBandBetween(level.level, nextLevel.level);

      return {
        band,
        lowerLevel: level.level,
        lowerAmount: level.amount,
        nextLevel: nextLevel.level,
        nextAmount: nextLevel.amount,
        message:
          band === "unknown"
            ? "The wage falls between non-adjacent available wage level amounts."
            : "The wage falls between two available wage level amounts.",
      };
    }
  }

  return {
    band: "unknown",
    message: "Could not compare the wage to the available levels.",
  };
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

function locationKey(value: string | undefined) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, "") ?? "";
}

function wageBandBetween(
  lowerLevel: 1 | 2 | 3 | 4,
  nextLevel: 1 | 2 | 3 | 4,
): WageLevelMatchResult["band"] {
  if (lowerLevel === 1 && nextLevel === 2) {
    return "level_1_to_2";
  }
  if (lowerLevel === 2 && nextLevel === 3) {
    return "level_2_to_3";
  }
  if (lowerLevel === 3 && nextLevel === 4) {
    return "level_3_to_4";
  }
  return "unknown";
}
