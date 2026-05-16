import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "muted" | "warning";
};

export function EmptyState({
  title,
  description,
  action,
  tone = "muted",
}: EmptyStateProps) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-[var(--warning)]"
      : "border-[var(--line)] bg-white text-[var(--muted)]";

  return (
    <section className={`rounded-lg border p-5 shadow-sm ${toneClass}`}>
      <h2 className="text-base font-semibold text-[var(--foreground)]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
