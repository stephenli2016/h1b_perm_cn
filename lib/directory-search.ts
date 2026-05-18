import type { PublicDirectorySearchInput } from "@/lib/db/public-query-repository";
import {
  type DisclosureStatusDataset,
  normalizeCaseStatusForAllowed,
  normalizeCaseStatusForDataset,
  normalizeStateCode,
} from "@/lib/directory-filter-normalization";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type DirectorySearchValues = {
  employer?: string;
  fiscalYear?: string;
  state?: string;
  city?: string;
  jobOrSoc?: string;
  caseStatus?: string;
  page?: string;
};

export const h1bStatusLabels: Record<string, string> = {
  CERTIFIED: "已认证",
  CERTIFIED_WITHDRAWN: "已撤回",
  CERTIFIEDWITHDRAWN: "已撤回",
  "CERTIFIED-WITHDRAWN": "已撤回",
  "CERTIFIED_-_WITHDRAWN": "已撤回",
  WITHDRAWN: "已撤回",
  DENIED: "未通过",
};

export const permStatusLabels: Record<string, string> = {
  Certified: "已认证",
  "Certified - Expired": "已认证",
  "Certified-Expired": "已认证",
  Denied: "未通过",
  Withdrawn: "已撤回",
};

export const combinedStatusLabels: Record<string, string> = {
  CERTIFIED: "已认证",
  Certified: "已认证",
  "Certified - Expired": "已认证",
  "Certified-Expired": "已认证",
  DENIED: "未通过",
  Denied: "未通过",
  CERTIFIED_WITHDRAWN: "已撤回",
  CERTIFIEDWITHDRAWN: "已撤回",
  "CERTIFIED-WITHDRAWN": "已撤回",
  "CERTIFIED_-_WITHDRAWN": "已撤回",
  WITHDRAWN: "已撤回",
  Withdrawn: "已撤回",
};

export function parseDirectorySearchParams(
  params: RawSearchParams | undefined,
): {
  values: DirectorySearchValues;
  input: PublicDirectorySearchInput;
  currentParams: Record<string, string | undefined>;
} {
  const values = {
    employer: firstValue(params?.employer),
    fiscalYear: firstValue(params?.fiscalYear),
    state: firstValue(params?.state),
    city: firstValue(params?.city),
    jobOrSoc: firstValue(params?.jobOrSoc),
    caseStatus: firstValue(params?.caseStatus),
    page: firstValue(params?.page),
  };

  return {
    values,
    input: {
      employer: values.employer,
      fiscalYear: parseOptionalNumber(values.fiscalYear),
      state: values.state,
      city: values.city,
      jobOrSoc: values.jobOrSoc,
      caseStatus: values.caseStatus,
      page: parseOptionalNumber(values.page),
    },
    currentParams: values,
  };
}

export function formatCurrency(amount: number, unit: "Year" | "Hour") {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);

  return `USD ${formatted}/${unit === "Year" ? "年" : "小时"}`;
}

export function statusLabel(
  status: string,
  labels: Record<string, string> = combinedStatusLabels,
) {
  const normalized = normalizeCaseStatusForAllowed(status, Object.keys(labels));

  return labels[normalized ?? status] ?? labels[status] ?? status;
}

export function activeFilterCount(values: DirectorySearchValues) {
  return [
    values.employer,
    values.fiscalYear,
    values.state,
    values.city,
    values.jobOrSoc,
    values.caseStatus,
  ].filter(Boolean).length;
}

function firstValue(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const trimmed = candidate?.trim();

  return trimmed || undefined;
}

function parseOptionalNumber(value: string | undefined) {
  return value === undefined ? undefined : Number(value);
}

const directorySearchKeys = [
  "employer",
  "fiscalYear",
  "caseStatus",
  "state",
  "city",
  "jobOrSoc",
  "page",
] as const;

export function getCleanDirectoryRedirectHref(
  basePath: string,
  rawParams: RawSearchParams | undefined,
  values: DirectorySearchValues,
  statusDataset: DisclosureStatusDataset = "combined",
) {
  const rawQuery = new URLSearchParams();
  let hasKnownParam = false;

  for (const key of directorySearchKeys) {
    const rawValue = Array.isArray(rawParams?.[key])
      ? rawParams?.[key]?.[0]
      : rawParams?.[key];

    if (rawValue !== undefined) {
      hasKnownParam = true;
      rawQuery.set(key, rawValue);
    }
  }

  if (!hasKnownParam) {
    return undefined;
  }

  const cleanQuery = buildDirectoryQuery(values, statusDataset);

  if (rawQuery.toString() === cleanQuery) {
    return undefined;
  }

  return cleanQuery ? `${basePath}?${cleanQuery}` : basePath;
}

function buildDirectoryQuery(
  values: DirectorySearchValues,
  statusDataset: DisclosureStatusDataset,
) {
  const params = new URLSearchParams();

  for (const key of directorySearchKeys) {
    const rawValue = values[key];
    const value =
      key === "state"
        ? normalizeStateCode(rawValue)
        : key === "caseStatus"
          ? normalizeCaseStatusForDataset(rawValue, statusDataset)
          : rawValue;

    if (!value) {
      continue;
    }

    if (key === "page" && Number(value) <= 1) {
      continue;
    }

    params.set(key, value.trim());
  }

  return params.toString();
}
