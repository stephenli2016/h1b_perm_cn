import type { ReactNode } from "react";

type InterpretationPanelProps = {
  title: string;
  children: ReactNode;
};

export function InterpretationPanel({
  title,
  children,
}: InterpretationPanelProps) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-[var(--muted)]">
        {children}
      </div>
    </section>
  );
}
