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
  return (
    <form
      action={action}
      className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
      method="get"
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
          <span>Fiscal year</span>
          <select
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
            defaultValue={values.fiscalYear ?? ""}
            name="fiscalYear"
          >
            <option value="">全部年份</option>
            {fiscalYears.map((year) => (
              <option key={year} value={year}>
                FY{year}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          <span>Case status</span>
          <select
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
            defaultValue={values.caseStatus ?? ""}
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
            defaultValue={values.state ?? ""}
            name="state"
          >
            <option value="">全部州</option>
            {states.map((state) => (
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
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
          type="submit"
        >
          {submitLabel}
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
