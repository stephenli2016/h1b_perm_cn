"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  normalizeCaseStatusForAllowed,
  normalizeStateCode,
  normalizeStateOptions,
} from "@/lib/directory-filter-normalization";

type DirectoryFilterFormProps = {
  action: string;
  values: {
    employer?: string;
    fiscalYear?: string;
    state?: string;
    city?: string;
    jobOrSoc?: string;
    caseStatus?: string;
  };
  fiscalYears: readonly number[];
  states: readonly string[];
  caseStatuses: readonly string[];
  caseStatusLabels?: Record<string, string>;
  submitLabel: string;
  resetLabel?: string;
};

export function DirectoryFilterForm({
  action,
  values,
  fiscalYears,
  states,
  caseStatuses,
  caseStatusLabels = {},
  submitLabel,
  resetLabel = "清除筛选",
}: DirectoryFilterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const selectedCaseStatus =
    normalizeCaseStatusForAllowed(values.caseStatus, caseStatuses) ?? "";
  const selectedState = normalizeStateCode(values.state) ?? "";
  const stateOptions = normalizeStateOptions(states);
  const isSearching = isPending || hasSubmitted;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const name of [
      "employer",
      "fiscalYear",
      "caseStatus",
      "state",
      "city",
      "jobOrSoc",
    ]) {
      const rawValue = formData.get(name);
      const value = typeof rawValue === "string" ? rawValue.trim() : "";

      if (value) {
        params.set(name, value);
      }
    }

    const query = params.toString();
    const target = query ? `${action}?${query}` : action;

    startTransition(() => {
      router.push(target);
    });
  }

  return (
    <form
      action={action}
      className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
      method="get"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          <span>雇主名称</span>
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
            defaultValue={values.employer}
            name="employer"
            placeholder="例如 Acme"
            type="search"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          <span>数据年份</span>
          <select
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
            defaultValue={values.fiscalYear ?? ""}
            name="fiscalYear"
          >
            <option value="">全部年份</option>
            {fiscalYears.map((year) => (
              <option key={year} value={year}>
                {year} 财年
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          <span>记录状态</span>
          <select
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
            defaultValue={selectedCaseStatus}
            name="caseStatus"
          >
            <option value="">全部状态</option>
            {caseStatuses.map((status) => (
              <option key={status} value={status}>
                {caseStatusLabels[status] ?? status}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          <span>州</span>
          <select
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
            defaultValue={selectedState}
            name="state"
          >
            <option value="">全部州</option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          <span>城市</span>
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
            defaultValue={values.city}
            name="city"
            placeholder="例如 Seattle"
            type="search"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          <span>职位 / SOC</span>
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
            defaultValue={values.jobOrSoc}
            name="jobOrSoc"
            placeholder="例如 Software 或 15-1252"
            type="search"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          aria-busy={isSearching}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] active:translate-y-px active:bg-[var(--accent-strong)] disabled:cursor-wait disabled:opacity-75"
          disabled={isSearching}
          type="submit"
        >
          {isSearching ? "正在搜索..." : submitLabel}
        </button>
        <a
          className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
          href={action}
        >
          {resetLabel}
        </a>
      </div>
    </form>
  );
}
