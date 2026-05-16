import Link from "next/link";

import { primaryNavItems, siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <Link className="inline-flex flex-col" href="/">
          <span className="text-base font-semibold">
            {siteConfig.chineseName}
          </span>
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--accent)]">
            {siteConfig.name}
          </span>
        </Link>

        <nav aria-label="主导航">
          <ul className="flex flex-wrap gap-2 text-sm">
            {primaryNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  className="inline-flex rounded-md px-3 py-2 font-medium text-[var(--muted)] hover:bg-slate-100 hover:text-[var(--foreground)]"
                  href={item.path}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
