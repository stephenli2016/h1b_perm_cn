export type CompanyPageMode = "h1b" | "perm";

export type CompanyPageQualityInput = {
  lcaCount5y: number;
  permCount5y: number;
  uscisRecordCount5y: number;
  jobTitleCount: number;
  locationCount: number;
  professionalSocRecordCount?: number;
  sourceCount?: number;
  hasLatestDataDate?: boolean;
  hasVisibleTables?: boolean;
  hasRelatedLinks?: boolean;
  explanationWordCountZh?: number;
};

export type CompanyIndexabilityDecision = {
  indexable: boolean;
  noindexReason?: string;
  noindexReasonZh?: string;
  matchedThresholds: readonly string[];
  qualityScore: number;
};

export const COMPANY_INDEXABILITY_THRESHOLDS = {
  recentLcaCount: 10,
  recentPermCount: 3,
  uscisEmployerHubRows: 3,
  minimumExplanationWordCountZh: 300,
} as const;

const DEFAULT_TEMPLATE_EXPLANATION_WORD_COUNT_ZH = 420;

export function companyPageQualityScore(input: CompanyPageQualityInput) {
  const normalized = normalizeQualityInput(input);
  const volumeScore =
    Math.min(normalized.lcaCount5y * 4, 48) +
    Math.min(normalized.permCount5y * 12, 48) +
    Math.min(normalized.uscisRecordCount5y * 8, 24);
  const diversityScore =
    Math.min(normalized.jobTitleCount * 5, 20) +
    Math.min(normalized.locationCount * 5, 20) +
    Math.min(normalized.professionalSocRecordCount * 2, 16);
  const sourceScore =
    Math.min(normalized.sourceCount * 5, 15) +
    (normalized.hasLatestDataDate ? 10 : 0);
  const contentScore =
    (normalized.hasVisibleTables ? 15 : 0) +
    (normalized.hasRelatedLinks ? 10 : 0) +
    Math.min(
      Math.floor(
        (normalized.explanationWordCountZh /
          COMPANY_INDEXABILITY_THRESHOLDS.minimumExplanationWordCountZh) *
          15,
      ),
      15,
    );

  return Math.min(
    100,
    volumeScore + diversityScore + sourceScore + contentScore,
  );
}

export function evaluateCompanyIndexability(
  input: CompanyPageQualityInput,
  mode?: CompanyPageMode,
): CompanyIndexabilityDecision {
  const normalized = normalizeQualityInput(input);
  const matchedThresholds = matchedVolumeThresholds(normalized, mode);
  const qualityScore = companyPageQualityScore(normalized);

  if (matchedThresholds.length === 0) {
    return {
      indexable: false,
      matchedThresholds,
      qualityScore,
      noindexReason:
        mode === "perm"
          ? "Does not meet the PERM page threshold: needs at least 3 recent PERM records."
          : mode === "h1b"
            ? "Does not meet the H-1B page threshold: needs at least 10 recent LCA records or 3 USCIS Employer Data Hub rows."
            : "Does not meet initial data threshold: needs at least 10 recent LCA records, 3 recent PERM records, or 3 USCIS Employer Data Hub rows.",
      noindexReasonZh:
        mode === "perm"
          ? "近 5 年 PERM 记录少于 3 条，暂不作为重点公开页面。"
          : mode === "h1b"
            ? "近 5 年 H-1B/LCA 记录少于 10 条，且 USCIS Employer Data Hub 记录少于 3 条，暂不作为重点公开页面。"
            : "近 5 年 H-1B/LCA、PERM 或 USCIS Employer Data Hub 记录不足，暂不作为重点公开页面。",
    };
  }

  if (!normalized.hasVisibleTables) {
    return {
      indexable: false,
      matchedThresholds,
      qualityScore,
      noindexReason:
        "Has enough volume signal but no unique visible table or chart.",
      noindexReasonZh:
        "虽然有数量信号，但缺少该公司独有的可见表格或图表，暂不作为重点公开页面。",
    };
  }

  if (normalized.jobTitleCount === 0 || normalized.locationCount === 0) {
    return {
      indexable: false,
      matchedThresholds,
      qualityScore,
      noindexReason:
        "Has enough volume signal but not enough job-title and location detail for an indexable company page.",
      noindexReasonZh:
        "虽然有数量信号，但职位或地点维度不足，暂不作为重点公开页面。",
    };
  }

  if (normalized.sourceCount === 0 || !normalized.hasLatestDataDate) {
    return {
      indexable: false,
      matchedThresholds,
      qualityScore,
      noindexReason:
        "Has enough volume signal but lacks source names or latest data date.",
      noindexReasonZh:
        "虽然有数量信号，但缺少数据来源或最新数据日期，暂不作为重点公开页面。",
    };
  }

  if (!normalized.hasRelatedLinks) {
    return {
      indexable: false,
      matchedThresholds,
      qualityScore,
      noindexReason:
        "Has enough volume signal but lacks useful internal links.",
      noindexReasonZh:
        "虽然有数量信号，但缺少相关公司、职位或地点入口，暂不作为重点公开页面。",
    };
  }

  if (
    normalized.explanationWordCountZh <
    COMPANY_INDEXABILITY_THRESHOLDS.minimumExplanationWordCountZh
  ) {
    return {
      indexable: false,
      matchedThresholds,
      qualityScore,
      noindexReason:
        "Has enough volume signal but lacks enough visible Chinese explanation.",
      noindexReasonZh:
        "虽然有数量信号，但页面中文解释内容不足，暂不作为重点公开页面。",
    };
  }

  return {
    indexable: true,
    matchedThresholds,
    qualityScore,
  };
}

export function getCompanyPageSeo(
  input: CompanyPageQualityInput | undefined,
  mode: CompanyPageMode,
) {
  if (!input) {
    return {
      indexable: false,
      robots: {
        index: false,
        follow: true,
      },
      matchedThresholds: [],
      qualityScore: 0,
      noindexReason: "No company-page metrics are available.",
      noindexReasonZh: "当前没有公司页质量评分数据，暂不作为重点公开页面。",
    };
  }

  const decision = evaluateCompanyIndexability(input, mode);

  return {
    ...decision,
    robots: {
      index: decision.indexable,
      follow: true,
    },
  };
}

function normalizeQualityInput(input: CompanyPageQualityInput) {
  return {
    ...input,
    professionalSocRecordCount: input.professionalSocRecordCount ?? 0,
    sourceCount: input.sourceCount ?? 1,
    hasLatestDataDate: input.hasLatestDataDate ?? true,
    hasVisibleTables:
      input.hasVisibleTables ??
      (input.jobTitleCount > 0 && input.locationCount > 0),
    hasRelatedLinks: input.hasRelatedLinks ?? true,
    explanationWordCountZh:
      input.explanationWordCountZh ??
      DEFAULT_TEMPLATE_EXPLANATION_WORD_COUNT_ZH,
  };
}

function matchedVolumeThresholds(
  input: ReturnType<typeof normalizeQualityInput>,
  mode?: CompanyPageMode,
) {
  const h1bThresholds =
    mode === undefined || mode === "h1b"
      ? [
          input.lcaCount5y >= COMPANY_INDEXABILITY_THRESHOLDS.recentLcaCount
            ? "recent_lca_count_10"
            : undefined,
          input.uscisRecordCount5y >=
          COMPANY_INDEXABILITY_THRESHOLDS.uscisEmployerHubRows
            ? "uscis_hub_rows_3"
            : undefined,
        ]
      : [];
  const permThresholds =
    mode === undefined || mode === "perm"
      ? [
          input.permCount5y >= COMPANY_INDEXABILITY_THRESHOLDS.recentPermCount
            ? "recent_perm_count_3"
            : undefined,
        ]
      : [];

  return [...h1bThresholds, ...permThresholds].filter(
    (threshold): threshold is string => Boolean(threshold),
  );
}
