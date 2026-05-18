export type DisclosureStatusDataset = "h1b" | "perm" | "combined";

const STATE_NAME_TO_CODE: Record<string, string> = {
  ALABAMA: "AL",
  ALASKA: "AK",
  "AMERICAN SAMOA": "AS",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  "DISTRICT OF COLUMBIA": "DC",
  FLORIDA: "FL",
  GEORGIA: "GA",
  GUAM: "GU",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  "NORTHERN MARIANA ISLANDS": "MP",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  "PUERTO RICO": "PR",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  "VIRGIN ISLANDS": "VI",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
};

const STATE_CODE_TO_NAME = Object.fromEntries(
  Object.entries(STATE_NAME_TO_CODE).map(([name, code]) => [code, name]),
);

const STATUS_ORDER: Record<DisclosureStatusDataset, readonly string[]> = {
  h1b: ["CERTIFIED", "WITHDRAWN", "DENIED"],
  perm: ["Certified", "Withdrawn", "Denied"],
  combined: ["CERTIFIED", "WITHDRAWN", "DENIED"],
};

export function normalizeStateCode(value: string | undefined) {
  const normalized = value?.trim().toUpperCase().replace(/\s+/g, " ");

  if (!normalized) {
    return undefined;
  }

  if (/^[A-Z]{2}$/.test(normalized) && STATE_CODE_TO_NAME[normalized]) {
    return normalized;
  }

  return STATE_NAME_TO_CODE[normalized];
}

export function normalizeStateOptions(values: readonly string[]) {
  return [
    ...new Set(
      values
        .map(normalizeStateCode)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
}

export function getStateFilterAliases(stateCode: string) {
  const code = normalizeStateCode(stateCode);

  if (!code) {
    return [];
  }

  return [code, STATE_CODE_TO_NAME[code]].filter((value): value is string =>
    Boolean(value),
  );
}

export function normalizeCaseStatusForDataset(
  value: string | undefined,
  dataset: DisclosureStatusDataset,
) {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  const key = normalized.toUpperCase().replace(/[^A-Z]/g, "");

  if (key.includes("WITHDRAW")) {
    return dataset === "perm" ? "Withdrawn" : "WITHDRAWN";
  }

  if (key.includes("DENIED") || key.includes("DENY")) {
    return dataset === "perm" ? "Denied" : "DENIED";
  }

  if (key.includes("CERTIFIED") || key.includes("CERTIFICATION")) {
    return dataset === "perm" ? "Certified" : "CERTIFIED";
  }

  return undefined;
}

export function normalizeCaseStatusForAllowed(
  value: string | undefined,
  allowedStatuses: readonly string[],
) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const exact = allowedStatuses.find(
    (status) => status.toLowerCase() === trimmed.toLowerCase(),
  );

  if (exact) {
    return exact;
  }

  for (const dataset of ["h1b", "perm", "combined"] as const) {
    const normalized = normalizeCaseStatusForDataset(trimmed, dataset);
    const matched = allowedStatuses.find(
      (status) =>
        normalized && status.toLowerCase() === normalized.toLowerCase(),
    );

    if (matched) {
      return matched;
    }
  }

  return undefined;
}

export function normalizeCaseStatusOptions(
  values: readonly string[],
  dataset: DisclosureStatusDataset,
) {
  const options = new Set<string>();

  for (const value of values) {
    const normalized = normalizeCaseStatusForDataset(value, dataset);

    if (normalized) {
      options.add(normalized);
    }
  }

  return STATUS_ORDER[dataset].filter((status) => options.has(status));
}
