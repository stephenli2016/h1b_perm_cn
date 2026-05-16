import { localFixtureData } from "@/data/fixtures/local-fixtures";
import {
  companyPageQualityScore,
  evaluateCompanyIndexability,
  type CompanyPageQualityInput,
} from "@/lib/seo/company-quality";
import type {
  CompanyPageMetrics,
  Employer,
  FixtureData,
  H1BLcaRecord,
  PermRecord,
  PwdRecord,
  VisaBulletinDate,
  VisaBulletinMonth,
} from "@/lib/db/types";

export { companyPageQualityScore } from "@/lib/seo/company-quality";

export type EmployerSearchResult = {
  employer: Employer;
  matchedAliases: string[];
};

export type EmployerAliasResolution = {
  rawName: string;
  normalizedName: string;
  employer?: Employer;
  alias?: {
    rawName: string;
    sourceSystem: string;
    confidenceScore: number;
    reviewStatus: string;
  };
  confidenceScore: number;
  reviewStatus: "auto" | "manual" | "needs_review" | "unmatched";
  matchMethod: "alias" | "canonical_name" | "unmatched";
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

export type UscisH1BSummaryInput = {
  employerId?: string;
  employerName?: string;
  fiscalYear?: number;
};

export type UscisH1BEmployerFiscalYearSummary = {
  fiscalYear: number;
  totalRecords: number;
  initialApprovals: number;
  initialDenials: number;
  continuingApprovals: number;
  continuingDenials: number;
  initialDecisions: number;
  continuingDecisions: number;
  firstDecisions: number;
  cities: readonly string[];
  states: readonly string[];
  naicsCodes: readonly string[];
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

export type VisaBulletinPriorityDateInput = VisaBulletinLookupInput & {
  priorityDate: string;
};

export type VisaBulletinPriorityDateResult = {
  status: "current" | "not_current" | "unavailable" | "not_found";
  canProceedByChart: boolean;
  month?: VisaBulletinMonth;
  date?: VisaBulletinDate;
  messageZh: string;
};

export type VisaBulletinTableRow = {
  category: VisaBulletinDate["category"];
  finalAction?: VisaBulletinDate;
  datesForFiling?: VisaBulletinDate;
};

export type CompanyIndexabilityDecision = {
  indexable: boolean;
  noindexReason?: string;
  noindexReasonZh?: string;
  matchedThresholds: readonly string[];
  qualityScore: number;
};

export type CompanyPageCandidate = {
  employer: Employer;
  metrics: CompanyPageMetrics;
  rank: number;
  aliasCount: number;
  minAliasConfidence: number | undefined;
};

export type CompanyCandidateOptions = {
  currentFiscalYear?: number;
  recentYearWindow?: number;
  limit?: number;
  includeNoindex?: boolean;
};

export function getLocalFixtureData(): FixtureData {
  return localFixtureData;
}

export function normalizeEmployerName(value: string) {
  const withoutDiacritics = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  return withoutDiacritics
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(
      /\b(limited liability company|incorporated|corporation|company|limited)\b/g,
      " ",
    )
    .replace(
      /\b(l\.?\s*l\.?\s*c\.?|l\.?\s*l\.?\s*p\.?|l\.?\s*p\.?|p\.?\s*l\.?\s*l\.?\s*c\.?|p\.?\s*c\.?)\b/g,
      " ",
    )
    .replace(/\b(inc|llc|corp|co|ltd|llp|lp|pllc|pc|na)\b/g, " ")
    .replace(/\bthe\b/g, " ")
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

export function resolveEmployerAlias(
  rawName: string,
  data: FixtureData = localFixtureData,
): EmployerAliasResolution {
  const normalizedName = normalizeEmployerName(rawName);

  if (!normalizedName) {
    return {
      rawName,
      normalizedName,
      confidenceScore: 0,
      reviewStatus: "unmatched",
      matchMethod: "unmatched",
    };
  }

  const alias = data.employerAliases.find(
    (candidate) => candidate.normalizedName === normalizedName,
  );

  if (alias) {
    return {
      rawName,
      normalizedName,
      employer: data.employers.find(
        (employer) => employer.id === alias.employerId,
      ),
      alias,
      confidenceScore: alias.confidenceScore,
      reviewStatus: alias.reviewStatus,
      matchMethod: "alias",
    };
  }

  const employer = data.employers.find(
    (candidate) => candidate.normalizedName === normalizedName,
  );

  if (employer) {
    return {
      rawName,
      normalizedName,
      employer,
      confidenceScore: 0.92,
      reviewStatus: "auto",
      matchMethod: "canonical_name",
    };
  }

  return {
    rawName,
    normalizedName,
    confidenceScore: 0,
    reviewStatus: "unmatched",
    matchMethod: "unmatched",
  };
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
    metrics: calculateCompanyPageMetrics(data).find(
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

export function summarizeUscisH1BEmployerData(
  input: UscisH1BSummaryInput,
  data: FixtureData = localFixtureData,
): UscisH1BEmployerFiscalYearSummary[] {
  const normalizedEmployerName = input.employerName
    ? normalizeEmployerName(input.employerName)
    : undefined;
  const records = data.uscisH1BEmployerRecords
    .filter(
      (record) => !input.employerId || record.employerId === input.employerId,
    )
    .filter(
      (record) =>
        !normalizedEmployerName ||
        normalizeEmployerName(record.rawEmployerName) ===
          normalizedEmployerName,
    )
    .filter(
      (record) =>
        input.fiscalYear === undefined ||
        record.fiscalYear === input.fiscalYear,
    );
  const byFiscalYear = new Map<number, typeof records>();

  for (const record of records) {
    byFiscalYear.set(record.fiscalYear, [
      ...(byFiscalYear.get(record.fiscalYear) ?? []),
      record,
    ]);
  }

  return [...byFiscalYear.entries()]
    .sort(([leftYear], [rightYear]) => rightYear - leftYear)
    .map(([fiscalYear, yearRecords]) => {
      const initialApprovals = sum(
        yearRecords.map((record) => record.initialApprovals),
      );
      const initialDenials = sum(
        yearRecords.map((record) => record.initialDenials),
      );
      const continuingApprovals = sum(
        yearRecords.map((record) => record.continuingApprovals),
      );
      const continuingDenials = sum(
        yearRecords.map((record) => record.continuingDenials),
      );

      return {
        fiscalYear,
        totalRecords: yearRecords.length,
        initialApprovals,
        initialDenials,
        continuingApprovals,
        continuingDenials,
        initialDecisions: initialApprovals + initialDenials,
        continuingDecisions: continuingApprovals + continuingDenials,
        firstDecisions:
          initialApprovals +
          initialDenials +
          continuingApprovals +
          continuingDenials,
        cities: uniqueStrings(yearRecords.map((record) => record.city)),
        states: uniqueStrings(yearRecords.map((record) => record.state)),
        naicsCodes: uniqueStrings(
          yearRecords.map((record) => record.naicsCode),
        ),
      };
    });
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

export function getLatestVisaBulletinMonth(
  data: FixtureData = localFixtureData,
) {
  return [...data.visaBulletinMonths].sort((a, b) =>
    b.monthKey.localeCompare(a.monthKey),
  )[0];
}

export function listVisaBulletinRows(
  monthKey: string,
  data: FixtureData = localFixtureData,
): VisaBulletinTableRow[] {
  const month = data.visaBulletinMonths.find(
    (candidate) => candidate.monthKey === monthKey,
  );

  if (!month) {
    return [];
  }

  const records = data.visaBulletinDates.filter(
    (record) => record.bulletinMonthId === month.id,
  );
  const categories: VisaBulletinDate["category"][] = ["EB-1", "EB-2", "EB-3"];

  return categories.map((category) => ({
    category,
    finalAction: records.find(
      (record) =>
        record.category === category && record.chartType === "final_action",
    ),
    datesForFiling: records.find(
      (record) =>
        record.category === category && record.chartType === "dates_for_filing",
    ),
  }));
}

export function checkVisaBulletinPriorityDate(
  input: VisaBulletinPriorityDateInput,
  data: FixtureData = localFixtureData,
): VisaBulletinPriorityDateResult {
  const cutoff = getVisaBulletinCutoff(input, data);

  if (!cutoff) {
    return {
      status: "not_found",
      canProceedByChart: false,
      messageZh: "未找到对应月份、类别和地区的排期记录。",
    };
  }

  if (cutoff.date.cutoffStatus === "current") {
    return {
      status: "current",
      canProceedByChart: true,
      month: cutoff.month,
      date: cutoff.date,
      messageZh:
        "该类别在所选表格中显示为 Current。仍需确认 USCIS 当月采用哪张表以及个人资格。",
    };
  }

  if (
    cutoff.date.cutoffStatus === "unavailable" ||
    cutoff.date.cutoffDate === undefined
  ) {
    return {
      status: "unavailable",
      canProceedByChart: false,
      month: cutoff.month,
      date: cutoff.date,
      messageZh: "该类别在所选表格中显示为 Unavailable。",
    };
  }

  const canProceedByChart = input.priorityDate < cutoff.date.cutoffDate;

  return {
    status: canProceedByChart ? "current" : "not_current",
    canProceedByChart,
    month: cutoff.month,
    date: cutoff.date,
    messageZh: canProceedByChart
      ? "优先日早于所选表格日期。公开日期对照通常表示该表下排期已到，但不等于一定可以提交或获批。"
      : "优先日不早于所选表格日期。按该表格做公开日期对照时，通常还未到。",
  };
}

export function listIndexableCompanyCandidates(
  data: FixtureData = localFixtureData,
) {
  return calculateCompanyPageMetrics(data)
    .filter((metrics) => getCompanyIndexabilityDecision(metrics).indexable)
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

export function calculateCompanyPageMetrics(
  data: FixtureData = localFixtureData,
  options: CompanyCandidateOptions = {},
): CompanyPageMetrics[] {
  const recentYearWindow = options.recentYearWindow ?? 5;
  const currentFiscalYear =
    options.currentFiscalYear ?? getLatestEmployerFiscalYear(data);
  const oldestFiscalYear = currentFiscalYear - recentYearWindow + 1;
  const h1bRecordsByEmployer = groupRecentEmployerRecords(
    data.h1bLcaRecords,
    oldestFiscalYear,
    currentFiscalYear,
  );
  const permRecordsByEmployer = groupRecentEmployerRecords(
    data.permRecords,
    oldestFiscalYear,
    currentFiscalYear,
  );
  const uscisRecordsByEmployer = groupRecentEmployerRecords(
    data.uscisH1BEmployerRecords,
    oldestFiscalYear,
    currentFiscalYear,
  );
  const sourceFilesById = new Map(
    data.sourceFiles.map((sourceFile) => [sourceFile.id, sourceFile]),
  );

  return data.employers
    .map((employer) => {
      const h1bRecords = h1bRecordsByEmployer.get(employer.id) ?? [];
      const permRecords = permRecordsByEmployer.get(employer.id) ?? [];
      const uscisRecords = uscisRecordsByEmployer.get(employer.id) ?? [];
      const fiscalYears = [
        ...h1bRecords.map((record) => record.fiscalYear),
        ...permRecords.map((record) => record.fiscalYear),
        ...uscisRecords.map((record) => record.fiscalYear),
      ];
      const jobTitleCount = new Set([
        ...h1bRecords.map((record) => normalizeTextKey(record.jobTitle)),
        ...permRecords.map((record) => normalizeTextKey(record.jobTitle)),
      ]).size;
      const locationCount = new Set([
        ...h1bRecords.map((record) =>
          normalizeLocationKey(record.worksiteCity, record.worksiteState),
        ),
        ...permRecords.map((record) =>
          normalizeLocationKey(record.worksiteCity, record.worksiteState),
        ),
        ...uscisRecords.map((record) =>
          normalizeLocationKey(record.city, record.state),
        ),
      ]).size;
      const metricsBase = {
        lcaCount5y: h1bRecords.length,
        permCount5y: permRecords.length,
        uscisRecordCount5y: uscisRecords.length,
        jobTitleCount,
        locationCount,
        latestFiscalYear: Math.max(...fiscalYears, 0),
      };
      const sourceIds = new Set([
        ...h1bRecords.map((record) => record.sourceFileId),
        ...permRecords.map((record) => record.sourceFileId),
        ...uscisRecords.map((record) => record.sourceFileId),
      ]);
      const sourceFiles = [...sourceIds]
        .map((sourceId) => sourceFilesById.get(sourceId))
        .filter((sourceFile): sourceFile is NonNullable<typeof sourceFile> =>
          Boolean(sourceFile),
        );
      const professionalSocRecordCount = countProfessionalSocRecords([
        ...h1bRecords.map((record) => record.socCode),
        ...permRecords.map((record) => record.socCode),
      ]);
      const qualityInput = {
        ...metricsBase,
        professionalSocRecordCount,
        sourceCount: sourceIds.size,
        hasLatestDataDate: sourceFiles.some((sourceFile) =>
          Boolean(sourceFile.latestDataDate),
        ),
        hasVisibleTables:
          h1bRecords.length + permRecords.length > 0 &&
          jobTitleCount > 0 &&
          locationCount > 0,
        hasRelatedLinks: h1bRecords.length + permRecords.length > 0,
      };
      const decision = getCompanyIndexabilityDecision(qualityInput);

      return {
        id: `metric-${employer.slug}`,
        employerId: employer.id,
        ...metricsBase,
        qualityScore: companyPageQualityScore(qualityInput),
        indexable: decision.indexable,
        noindexReason: decision.noindexReason,
      };
    })
    .sort(compareCompanyMetrics);
}

export function getCompanyIndexabilityDecision(
  metrics: Pick<
    CompanyPageMetrics,
    | "lcaCount5y"
    | "permCount5y"
    | "uscisRecordCount5y"
    | "jobTitleCount"
    | "locationCount"
  > &
    Partial<CompanyPageQualityInput>,
): CompanyIndexabilityDecision {
  return evaluateCompanyIndexability(metrics);
}

export function listTopCompanyCandidates(
  data: FixtureData = localFixtureData,
  options: CompanyCandidateOptions = {},
): CompanyPageCandidate[] {
  const includeNoindex = options.includeNoindex ?? true;
  const limit = options.limit ?? 2000;
  const ranked = calculateCompanyPageMetrics(data, options)
    .filter((metrics) => includeNoindex || metrics.indexable)
    .slice(0, limit)
    .map((metrics, index) => {
      const aliases = data.employerAliases.filter(
        (alias) => alias.employerId === metrics.employerId,
      );

      return {
        employer: data.employers.find(
          (employer) => employer.id === metrics.employerId,
        ),
        metrics,
        rank: index + 1,
        aliasCount: aliases.length,
        minAliasConfidence:
          aliases.length > 0
            ? Math.min(...aliases.map((alias) => alias.confidenceScore))
            : undefined,
      };
    });

  return ranked.filter(
    (candidate): candidate is CompanyPageCandidate =>
      candidate.employer !== undefined,
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

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values)].sort();
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

function getLatestEmployerFiscalYear(data: FixtureData) {
  return Math.max(
    ...data.h1bLcaRecords.map((record) => record.fiscalYear),
    ...data.permRecords.map((record) => record.fiscalYear),
    ...data.uscisH1BEmployerRecords.map((record) => record.fiscalYear),
    0,
  );
}

function groupRecentEmployerRecords<
  TRecord extends { employerId: string; fiscalYear: number },
>(
  records: readonly TRecord[],
  oldestFiscalYear: number,
  currentFiscalYear: number,
) {
  const recordsByEmployer = new Map<string, TRecord[]>();

  for (const record of records) {
    if (
      record.fiscalYear < oldestFiscalYear ||
      record.fiscalYear > currentFiscalYear
    ) {
      continue;
    }

    const employerRecords = recordsByEmployer.get(record.employerId);
    if (employerRecords) {
      employerRecords.push(record);
    } else {
      recordsByEmployer.set(record.employerId, [record]);
    }
  }

  return recordsByEmployer;
}

function countProfessionalSocRecords(socCodes: readonly string[]) {
  return socCodes.filter((socCode) =>
    /^(11|13|15|17|19|23|27|29)-/.test(socCode),
  ).length;
}

function compareCompanyMetrics(
  left: CompanyPageMetrics,
  right: CompanyPageMetrics,
) {
  return (
    right.qualityScore - left.qualityScore ||
    right.lcaCount5y - left.lcaCount5y ||
    right.permCount5y - left.permCount5y ||
    left.employerId.localeCompare(right.employerId)
  );
}

function normalizeTextKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeLocationKey(city: string, state: string) {
  return `${city.toLowerCase()}-${state.toUpperCase()}`.replace(
    /[^a-z0-9-]+/g,
    "",
  );
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
