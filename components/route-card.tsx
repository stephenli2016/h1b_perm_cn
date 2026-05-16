import Link from "next/link";

type RouteCardProps = {
  title: string;
  description: string;
  href?: string;
  meta?: string;
};

export function RouteCard({ title, description, href, meta }: RouteCardProps) {
  const content = (
    <article className="h-full rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm transition hover:border-[var(--accent)]">
      {meta ? (
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
          {meta}
        </p>
      ) : null}
      <h2 className="mt-2 text-lg font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link className="block h-full" href={href}>
      {content}
    </Link>
  );
}
