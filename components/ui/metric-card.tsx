import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
  trend?: ReactNode;
};

export function MetricCard({
  label,
  value,
  description,
  trend,
}: MetricCardProps) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium text-[var(--muted)]">{label}</h2>
        {trend ? (
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-[var(--accent-strong)]">
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
        {value}
      </p>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
      ) : null}
    </article>
  );
}
