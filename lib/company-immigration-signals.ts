import type {
  Employer,
  EmployerAlias,
  H1BLcaRecord,
  PermRecord,
  PwdRecord,
  UscisH1BEmployerRecord,
} from "@/lib/db/types";

export type CompanyImmigrationSignalDimensionKey =
  | "recent_lca_activity"
  | "perm_activity"
  | "repeat_filing_history"
  | "data_consistency"
  | "job_location_diversity"
  | "wage_context";

export type CompanyImmigrationSignalLevel = "limited" | "some" | "strong";

export type CompanyImmigrationSignalBand =
  | "low_sample"
  | "limited_public_record"
  | "visible_activity"
  | "multi_signal"
  | "rich_public_record";

export type CompanyImmigrationSignalDimension = {
  key: CompanyImmigrationSignalDimensionKey;
  labelZh: string;
  maxScore: number;
  score: number;
  level: CompanyImmigrationSignalLevel;
  explanationZh: string;
  evidenceZh: readonly string[];
};

export type CompanyImmigrationSignal = {
  score: number;
  maxScore: 100;
  labelZh: string;
  band: CompanyImmigrationSignalBand;
  bandLabelZh: string;
  lowSample: {
    flagged: boolean;
    messageZh?: string;
  };
  dimensions: readonly CompanyImmigrationSignalDimension[];
  methodologyHref: string;
  interpretationNoteZh: string;
};

export type CompanyImmigrationSignalInput = {
  employer: Employer;
  h1bRecords: readonly H1BLcaRecord[];
  permRecords: readonly PermRecord[];
  uscisRecords: readonly UscisH1BEmployerRecord[];
  pwdRecords?: readonly PwdRecord[];
  aliases?: readonly EmployerAlias[];
  sourceNames?: readonly string[];
  latestDataDate?: string;
  currentFiscalYear?: number;
};

type DimensionDefinition = {
  key: CompanyImmigrationSignalDimensionKey;
  labelZh: string;
  maxScore: number;
  descriptionZh: string;
};

export const COMPANY_IMMIGRATION_SIGNAL_METHODOLOGY_HREF =
  "/tools/company-immigration-score";

export const COMPANY_IMMIGRATION_SIGNAL_DIMENSIONS: readonly DimensionDefinition[] =
  [
    {
      key: "recent_lca_activity",
      labelZh: "近期 LCA 活动",
      maxScore: 18,
      descriptionZh:
        "近 5 个 fiscal years 中是否有 H-1B/LCA 公开记录，以及记录是否包含 certified LCA。",
    },
    {
      key: "perm_activity",
      labelZh: "PERM 活动",
      maxScore: 18,
      descriptionZh:
        "近 5 个 fiscal years 中是否有 PERM disclosure records，以及是否出现 certified PERM 记录。",
    },
    {
      key: "repeat_filing_history",
      labelZh: "跨年重复记录",
      maxScore: 16,
      descriptionZh:
        "公开记录是否跨越多个财年，以及是否同时存在 H-1B 与 PERM 两类历史活动。",
    },
    {
      key: "data_consistency",
      labelZh: "数据一致性与来源",
      maxScore: 16,
      descriptionZh: "是否有多个官方来源、最新数据日期和可审计的雇主别名映射。",
    },
    {
      key: "job_location_diversity",
      labelZh: "职位/地点覆盖",
      maxScore: 16,
      descriptionZh:
        "公开记录是否覆盖多个职位、SOC 或工作地点，用于判断页面是否有足够可比较背景。",
    },
    {
      key: "wage_context",
      labelZh: "工资上下文",
      maxScore: 16,
      descriptionZh:
        "是否存在 H-1B 工资样本，以及能否与 prevailing wage 官方来源数据建立公开背景对照。",
    },
  ];

export function calculateCompanyImmigrationSignal(
  input: CompanyImmigrationSignalInput,
): CompanyImmigrationSignal {
  const currentFiscalYear =
    input.currentFiscalYear ?? inferCurrentFiscalYear(input);
  const oldestFiscalYear = currentFiscalYear - 4;
  const h1bRecords = recentRecords(
    input.h1bRecords,
    oldestFiscalYear,
    currentFiscalYear,
  );
  const permRecords = recentRecords(
    input.permRecords,
    oldestFiscalYear,
    currentFiscalYear,
  );
  const uscisRecords = recentRecords(
    input.uscisRecords,
    oldestFiscalYear,
    currentFiscalYear,
  );
  const dimensions = [
    buildRecentLcaActivityDimension(h1bRecords, uscisRecords),
    buildPermActivityDimension(permRecords),
    buildRepeatFilingHistoryDimension(h1bRecords, permRecords, uscisRecords),
    buildDataConsistencyDimension(input),
    buildJobLocationDiversityDimension(h1bRecords, permRecords, uscisRecords),
    buildWageContextDimension(h1bRecords, input.pwdRecords ?? []),
  ];
  const rawScore = dimensions.reduce((sum, dimension) => {
    return sum + dimension.score;
  }, 0);
  const filingRecordCount = h1bRecords.length + permRecords.length;
  const totalPublicRecordCount =
    h1bRecords.length + permRecords.length + uscisRecords.length;
  const lowSampleFlagged = totalPublicRecordCount < 3 || filingRecordCount < 3;
  const score = lowSampleFlagged ? Math.min(rawScore, 45) : rawScore;
  const band = signalBand(score, lowSampleFlagged);

  return {
    score,
    maxScore: 100,
    labelZh: "公开数据友好度信号",
    band,
    bandLabelZh: signalBandLabelZh(band),
    lowSample: {
      flagged: lowSampleFlagged,
      messageZh: lowSampleFlagged
        ? `近 5 个财年只有 ${filingRecordCount} 条 H-1B/PERM 公开记录、${totalPublicRecordCount} 条相关公开记录。样本太少，只能说明公开数据覆盖有限，不能推断雇主政策或个案结果。`
        : undefined,
    },
    dimensions,
    methodologyHref: COMPANY_IMMIGRATION_SIGNAL_METHODOLOGY_HREF,
    interpretationNoteZh:
      "公开数据友好度信号只衡量官方公开记录的覆盖、连续性和可解释程度，不是 H-1B、PERM、I-140、I-485 或绿卡结果的获批概率。",
  };
}

function buildRecentLcaActivityDimension(
  h1bRecords: readonly H1BLcaRecord[],
  uscisRecords: readonly UscisH1BEmployerRecord[],
): CompanyImmigrationSignalDimension {
  const certifiedCount = h1bRecords.filter(
    (record) => record.caseStatus === "CERTIFIED",
  ).length;
  const score =
    Math.min(h1bRecords.length * 3, 12) +
    (certifiedCount > 0 ? 3 : 0) +
    Math.min(uscisRecords.length * 1.5, 3);

  return buildDimension({
    key: "recent_lca_activity",
    score,
    evidenceZh: [
      `近 5 年 LCA 记录：${h1bRecords.length} 条`,
      `已认证 LCA：${certifiedCount} 条`,
      `USCIS Employer Data Hub 行：${uscisRecords.length} 条`,
    ],
    explanationZh:
      "LCA 与 USCIS Employer Data Hub 只能说明公开记录中有 H-1B 相关活动，不代表申请批准或未来担保承诺。",
  });
}

function buildPermActivityDimension(
  permRecords: readonly PermRecord[],
): CompanyImmigrationSignalDimension {
  const certifiedCount = permRecords.filter(
    (record) => record.caseStatus === "Certified",
  ).length;
  const score =
    Math.min(permRecords.length * 5, 15) + (certifiedCount > 0 ? 3 : 0);

  return buildDimension({
    key: "perm_activity",
    score,
    evidenceZh: [
      `近 5 年 PERM 记录：${permRecords.length} 条`,
      `已认证 PERM：${certifiedCount} 条`,
    ],
    explanationZh:
      "PERM 劳工认证是公开记录，不等于 I-140、I-485 或绿卡最终获批。",
  });
}

function buildRepeatFilingHistoryDimension(
  h1bRecords: readonly H1BLcaRecord[],
  permRecords: readonly PermRecord[],
  uscisRecords: readonly UscisH1BEmployerRecord[],
): CompanyImmigrationSignalDimension {
  const fiscalYears = uniqueNumbers([
    ...h1bRecords.map((record) => record.fiscalYear),
    ...permRecords.map((record) => record.fiscalYear),
    ...uscisRecords.map((record) => record.fiscalYear),
  ]);
  const hasH1B = h1bRecords.length + uscisRecords.length > 0;
  const hasPerm = permRecords.length > 0;
  const score =
    Math.min(fiscalYears.length * 4, 12) + (hasH1B && hasPerm ? 4 : 0);

  return buildDimension({
    key: "repeat_filing_history",
    score,
    evidenceZh: [
      `覆盖 fiscal years：${fiscalYears.length > 0 ? fiscalYears.map((year) => `FY${year}`).join("、") : "暂无"}`,
      `同时有 H-1B 与 PERM 公开活动：${hasH1B && hasPerm ? "是" : "否"}`,
    ],
    explanationZh:
      "跨年记录说明公开活动有一定连续性，但不能说明雇主一定会为某个候选人继续办理。",
  });
}

function buildDataConsistencyDimension(
  input: CompanyImmigrationSignalInput,
): CompanyImmigrationSignalDimension {
  const sourceCount = input.sourceNames?.length ?? 0;
  const aliasCount = input.aliases?.length ?? 0;
  const needsReviewCount =
    input.aliases?.filter((alias) => alias.reviewStatus === "needs_review")
      .length ?? 0;
  const strongAliasCount =
    input.aliases?.filter(
      (alias) =>
        alias.reviewStatus !== "needs_review" && alias.confidenceScore >= 0.9,
    ).length ?? 0;
  const score =
    Math.min(sourceCount * 4, 8) +
    (input.latestDataDate ? 4 : 0) +
    (aliasCount === 0 || strongAliasCount > 0 ? 4 : 0) -
    (needsReviewCount > 0 ? 3 : 0);

  return buildDimension({
    key: "data_consistency",
    score: Math.max(0, score),
    evidenceZh: [
      `官方来源数：${sourceCount}`,
      `最新数据日期：${input.latestDataDate ?? "暂无"}`,
      `雇主别名映射：${aliasCount} 条，需人工复核 ${needsReviewCount} 条`,
    ],
    explanationZh:
      "来源和别名映射越清晰，页面越容易审计；这仍然只代表数据展示质量，不代表雇主好坏。",
  });
}

function buildJobLocationDiversityDimension(
  h1bRecords: readonly H1BLcaRecord[],
  permRecords: readonly PermRecord[],
  uscisRecords: readonly UscisH1BEmployerRecord[],
): CompanyImmigrationSignalDimension {
  const jobTitleCount = uniqueStrings([
    ...h1bRecords.map((record) => record.jobTitle),
    ...permRecords.map((record) => record.jobTitle),
  ]).length;
  const socCount = uniqueStrings([
    ...h1bRecords.map((record) => record.socCode),
    ...permRecords.map((record) => record.socCode),
  ]).length;
  const locationCount = uniqueStrings([
    ...h1bRecords.map((record) =>
      locationKey(record.worksiteCity, record.worksiteState),
    ),
    ...permRecords.map((record) =>
      locationKey(record.worksiteCity, record.worksiteState),
    ),
    ...uscisRecords.map((record) => locationKey(record.city, record.state)),
  ]).length;
  const score =
    Math.min(jobTitleCount * 3, 6) +
    Math.min(socCount * 2, 4) +
    Math.min(locationCount * 3, 6);

  return buildDimension({
    key: "job_location_diversity",
    score,
    evidenceZh: [
      `职位名称：${jobTitleCount} 类`,
      `SOC code：${socCount} 类`,
      `工作地点：${locationCount} 个`,
    ],
    explanationZh:
      "职位和地点维度越丰富，页面越适合做公开数据比较；维度少时应避免强结论。",
  });
}

function buildWageContextDimension(
  h1bRecords: readonly H1BLcaRecord[],
  pwdRecords: readonly PwdRecord[],
): CompanyImmigrationSignalDimension {
  const wageRecords = h1bRecords.filter((record) =>
    Number.isFinite(record.annualizedWageFrom),
  );
  const matchedPwdContextCount = wageRecords.filter((record) =>
    pwdRecords.some(
      (pwd) =>
        pwd.socCode === record.socCode &&
        pwd.state === record.worksiteState &&
        pwd.effectiveYear === record.fiscalYear,
    ),
  ).length;
  const score =
    Math.min(wageRecords.length * 4, 8) +
    Math.min(matchedPwdContextCount * 2, 5) +
    (wageRecords.length > 0 ? 3 : 0);

  return buildDimension({
    key: "wage_context",
    score,
    evidenceZh: [
      `H-1B 工资样本：${wageRecords.length} 条`,
      `可对照 PWD 官方来源背景：${matchedPwdContextCount} 条`,
    ],
    explanationZh:
      "工资上下文只说明公开工资字段是否足够做背景对照，不判断工资、职位或申请是否合规。",
  });
}

function buildDimension(input: {
  key: CompanyImmigrationSignalDimensionKey;
  score: number;
  evidenceZh: readonly string[];
  explanationZh: string;
}): CompanyImmigrationSignalDimension {
  const definition = COMPANY_IMMIGRATION_SIGNAL_DIMENSIONS.find(
    (candidate) => candidate.key === input.key,
  );

  if (!definition) {
    throw new Error(`Unknown immigration signal dimension: ${input.key}`);
  }

  const score = Math.max(
    0,
    Math.min(Math.round(input.score), definition.maxScore),
  );
  const ratio = score / definition.maxScore;

  return {
    key: input.key,
    labelZh: definition.labelZh,
    maxScore: definition.maxScore,
    score,
    level: ratio >= 0.7 ? "strong" : ratio >= 0.35 ? "some" : "limited",
    explanationZh: input.explanationZh,
    evidenceZh: input.evidenceZh,
  };
}

function signalBand(
  score: number,
  lowSampleFlagged: boolean,
): CompanyImmigrationSignalBand {
  if (lowSampleFlagged) {
    return "low_sample";
  }
  if (score >= 75) {
    return "rich_public_record";
  }
  if (score >= 55) {
    return "multi_signal";
  }
  if (score >= 30) {
    return "visible_activity";
  }

  return "limited_public_record";
}

function signalBandLabelZh(band: CompanyImmigrationSignalBand) {
  const labels: Record<CompanyImmigrationSignalBand, string> = {
    low_sample: "低样本，仅供背景参考",
    limited_public_record: "公开记录有限",
    visible_activity: "有可见公开活动",
    multi_signal: "多维公开记录",
    rich_public_record: "公开记录较丰富",
  };

  return labels[band];
}

function inferCurrentFiscalYear(input: CompanyImmigrationSignalInput) {
  const fiscalYears = [
    ...input.h1bRecords.map((record) => record.fiscalYear),
    ...input.permRecords.map((record) => record.fiscalYear),
    ...input.uscisRecords.map((record) => record.fiscalYear),
  ];

  return fiscalYears.length > 0
    ? Math.max(...fiscalYears)
    : new Date().getUTCFullYear();
}

function recentRecords<T extends { fiscalYear: number }>(
  records: readonly T[],
  oldestFiscalYear: number,
  currentFiscalYear: number,
) {
  return records.filter(
    (record) =>
      record.fiscalYear >= oldestFiscalYear &&
      record.fiscalYear <= currentFiscalYear,
  );
}

function uniqueNumbers(values: readonly number[]) {
  return [...new Set(values)].sort((left, right) => right - left);
}

function uniqueStrings(values: readonly string[]) {
  return [
    ...new Set(
      values
        .map((value) =>
          value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim(),
        )
        .filter(Boolean),
    ),
  ].sort();
}

function locationKey(city: string, state: string) {
  return `${city}, ${state}`;
}
