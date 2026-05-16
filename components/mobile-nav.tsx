import Link from "next/link";

import { primaryNavItems } from "@/lib/site";

export function MobileNav() {
  return (
    <details className="group lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)] marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]">
        <span>菜单</span>
        <span aria-hidden="true" className="text-[var(--accent)]">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">-</span>
        </span>
      </summary>
      <nav aria-label="移动端主导航" className="mt-3">
        <ul className="grid gap-2 rounded-lg border border-[var(--line)] bg-white p-2 shadow-sm">
          {primaryNavItems.map((item) => (
            <li key={item.path}>
              <Link
                className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-slate-100 hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                href={item.path}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
