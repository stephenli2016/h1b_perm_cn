import type { ReactNode } from "react";

import type { BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  breadcrumbs?: readonly BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  children,
}: PageShellProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      <section className="pb-8">
        {eyebrow ? (
          <p className="text-sm font-semibold text-[var(--accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)] sm:text-lg">
          {description}
        </p>
        {actions ? (
          <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
        ) : null}
      </section>
      {children}
    </main>
  );
}
