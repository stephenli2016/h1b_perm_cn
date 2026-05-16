import type { PublicH1BWageLevelCheckInput } from "@/lib/db/public-query-repository";
import type { RawSearchParams } from "@/lib/directory-search";

export type WageLevelSearchValues = {
  socOrJobTitle?: string;
  city?: string;
  state?: string;
  offeredWage?: string;
  wageYear?: string;
  wageUnit?: "Year" | "Hour";
};

export const defaultWageLevelExample = {
  socOrJobTitle: "15-1252",
  city: "Seattle",
  state: "WA",
  offeredWage: 119600,
  wageYear: 2025,
  wageUnit: "Year" as const,
};

export function parseWageLevelSearchParams(
  params: RawSearchParams | undefined,
): {
  values: WageLevelSearchValues;
  input: PublicH1BWageLevelCheckInput;
  hasSubmittedValues: boolean;
} {
  const values = {
    socOrJobTitle: firstValue(params?.socOrJobTitle),
    city: firstValue(params?.city),
    state: firstValue(params?.state),
    offeredWage: firstValue(params?.offeredWage),
    wageYear: firstValue(params?.wageYear),
    wageUnit: normalizeWageUnit(firstValue(params?.wageUnit)),
  };
  const hasSubmittedValues = Boolean(
    values.socOrJobTitle ||
    values.city ||
    values.state ||
    values.offeredWage ||
    values.wageYear ||
    values.wageUnit,
  );

  return {
    values,
    input: {
      socOrJobTitle: values.socOrJobTitle,
      city: values.city,
      state: values.state,
      offeredWage: parseOptionalNumber(values.offeredWage),
      wageYear: parseOptionalNumber(values.wageYear),
      wageUnit: values.wageUnit,
    },
    hasSubmittedValues,
  };
}

export function wageLevelValuesWithDefaults(
  values: WageLevelSearchValues,
): Required<WageLevelSearchValues> {
  return {
    socOrJobTitle:
      values.socOrJobTitle ?? defaultWageLevelExample.socOrJobTitle,
    city: values.city ?? defaultWageLevelExample.city,
    state: values.state ?? defaultWageLevelExample.state,
    offeredWage:
      values.offeredWage ?? String(defaultWageLevelExample.offeredWage),
    wageYear: values.wageYear ?? String(defaultWageLevelExample.wageYear),
    wageUnit: values.wageUnit ?? defaultWageLevelExample.wageUnit,
  };
}

function firstValue(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const trimmed = candidate?.trim();

  return trimmed || undefined;
}

function parseOptionalNumber(value: string | undefined) {
  return value === undefined ? undefined : Number(value);
}

function normalizeWageUnit(
  value: string | undefined,
): "Year" | "Hour" | undefined {
  if (value === "Hour") {
    return "Hour";
  }
  if (value === "Year") {
    return "Year";
  }

  return undefined;
}
