import Link from "next/link";

import { MobileNav } from "@/components/mobile-nav";
import { primaryNavItems, siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-3 px-5 py-4 sm:px-8 lg:flex lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <Link
          className="inline-flex w-fit flex-col rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
          href="/"
        >
          <span className="text-base font-semibold">
            {siteConfig.chineseName}
          </span>
          <span className="text-xs uppercase text-[var(--accent)]">
            {siteConfig.name}
          </span>
        </Link>

        <MobileNav />

        <nav aria-label="主导航" className="hidden lg:block">
          <ul className="flex flex-wrap gap-2 text-sm">
            {primaryNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  className="inline-flex rounded-md px-3 py-2 font-medium text-[var(--muted)] hover:bg-slate-100 hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
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
