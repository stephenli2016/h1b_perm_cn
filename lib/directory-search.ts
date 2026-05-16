import type { PublicDirectorySearchInput } from "@/lib/db/public-query-repository";

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
  CERTIFIED: "Certified LCA",
  WITHDRAWN: "Withdrawn LCA",
  DENIED: "Denied LCA",
};

export const permStatusLabels: Record<string, string> = {
  Certified: "Certified PERM",
  Denied: "Denied PERM",
  Withdrawn: "Withdrawn PERM",
};

export const combinedStatusLabels: Record<string, string> = {
  CERTIFIED: "Certified",
  Certified: "Certified",
  DENIED: "Denied",
  Denied: "Denied",
  WITHDRAWN: "Withdrawn",
  Withdrawn: "Withdrawn",
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
  return labels[status] ?? status;
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
