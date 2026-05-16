import type {
  PublicVisaBulletinPriorityDateInput,
  PublicVisaBulletinPriorityDatePayload,
} from "@/lib/db/public-query-repository";
import type { VisaBulletinDate } from "@/lib/db/types";
import type { RawSearchParams } from "@/lib/directory-search";

export type PriorityDateSearchValues = {
  category?: VisaBulletinDate["category"];
  chargeabilityArea?: VisaBulletinDate["chargeabilityArea"];
  priorityDate?: string;
  chartType?: VisaBulletinDate["chartType"];
  monthKey?: string;
};

export const priorityDateCategories = ["EB-1", "EB-2", "EB-3"] as const;
export const priorityDateChartTypes = [
  "final_action",
  "dates_for_filing",
] as const;

export const defaultPriorityDateExample = {
  category: "EB-2" as const,
  chargeabilityArea: "china-mainland" as const,
  priorityDate: "2021-08-31",
  chartType: "final_action" as const,
};

export function parsePriorityDateSearchParams(
  params: RawSearchParams | undefined,
): {
  values: PriorityDateSearchValues;
  input: PublicVisaBulletinPriorityDateInput;
  hasSubmittedValues: boolean;
} {
  const category = normalizeCategory(firstValue(params?.category));
  const chartType = normalizeChartType(firstValue(params?.chartType));
  const chargeabilityArea = normalizeChargeabilityArea(
    firstValue(params?.chargeabilityArea),
  );
  const values = {
    category,
    chargeabilityArea,
    priorityDate: firstValue(params?.priorityDate),
    chartType,
    monthKey: firstValue(params?.monthKey),
  };
  const hasSubmittedValues = Boolean(
    values.category ||
    values.chargeabilityArea ||
    values.priorityDate ||
    values.chartType ||
    values.monthKey,
  );

  return {
    values,
    input: {
      category: values.category,
      chargeabilityArea: values.chargeabilityArea,
      priorityDate: values.priorityDate,
      chartType: values.chartType,
      monthKey: values.monthKey,
    },
    hasSubmittedValues,
  };
}

export function priorityDateValuesWithDefaults(
  values: PriorityDateSearchValues,
  latestMonthKey?: string,
): Required<PriorityDateSearchValues> {
  return {
    category: values.category ?? defaultPriorityDateExample.category,
    chargeabilityArea:
      values.chargeabilityArea ?? defaultPriorityDateExample.chargeabilityArea,
    priorityDate:
      values.priorityDate ?? defaultPriorityDateExample.priorityDate,
    chartType: values.chartType ?? defaultPriorityDateExample.chartType,
    monthKey: values.monthKey ?? latestMonthKey ?? "",
  };
}

export function chartTypeLabelZh(chartType: VisaBulletinDate["chartType"]) {
  return chartType === "final_action"
    ? "Final Action Dates"
    : "Dates for Filing";
}

export function chargeabilityAreaLabelZh(
  area: VisaBulletinDate["chargeabilityArea"],
) {
  return area === "china-mainland" ? "中国大陆出生" : area;
}

export function formatVisaCutoff(
  date:
    | {
        cutoffDate?: string;
        cutoffStatus: "date" | "current" | "unavailable";
        rawValue: string;
      }
    | undefined,
) {
  if (!date) {
    return "暂无";
  }
  if (date.cutoffStatus === "current") {
    return "Current / 无排期";
  }
  if (date.cutoffStatus === "unavailable") {
    return "Unavailable / 暂不可用";
  }

  return date.cutoffDate ?? date.rawValue;
}

export function priorityDateResultLabel(
  status: PublicVisaBulletinPriorityDatePayload["resultStatus"],
) {
  const labels: Record<
    PublicVisaBulletinPriorityDatePayload["resultStatus"],
    string
  > = {
    current: "所选表格下排期已到",
    current_all: "所选表格显示 Current",
    not_current: "所选表格下尚未到",
    unavailable: "所选表格显示 Unavailable",
  };

  return labels[status];
}

function firstValue(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const trimmed = candidate?.trim();

  return trimmed || undefined;
}

function normalizeCategory(
  value: string | undefined,
): VisaBulletinDate["category"] | undefined {
  return priorityDateCategories.find((category) => category === value);
}

function normalizeChartType(
  value: string | undefined,
): VisaBulletinDate["chartType"] | undefined {
  return priorityDateChartTypes.find((chartType) => chartType === value);
}

function normalizeChargeabilityArea(
  value: string | undefined,
): VisaBulletinDate["chargeabilityArea"] | undefined {
  return value === "china-mainland" ? value : undefined;
}
