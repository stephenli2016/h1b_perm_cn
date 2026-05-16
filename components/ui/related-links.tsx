import Link from "next/link";

export type RelatedLinkItem = {
  title: string;
  href: string;
  description?: string;
  meta?: string;
};

type RelatedLinksProps = {
  title?: string;
  items: readonly RelatedLinkItem[];
};

export function RelatedLinks({ title = "相关链接", items }: RelatedLinksProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              className="block rounded-md border border-slate-200 p-4 transition hover:border-[var(--accent)] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
              href={item.href}
            >
              {item.meta ? (
                <span className="text-xs font-semibold uppercase text-[var(--accent)]">
                  {item.meta}
                </span>
              ) : null}
              <span className="mt-1 block font-semibold text-[var(--foreground)]">
                {item.title}
              </span>
              {item.description ? (
                <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
