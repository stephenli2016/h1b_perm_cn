import Link from "next/link";

import { footerNavGroups, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <p className="text-base font-semibold">{siteConfig.chineseName}</p>
          <p className="mt-2 text-sm uppercase text-[var(--muted)]">
            {siteConfig.name}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">
            {siteConfig.tagline}。所有公开数据解释都应先看来源、覆盖期和限制。
          </p>
        </div>

        {footerNavGroups.map((group) => (
          <nav aria-label={group.title} key={group.title}>
            <h2 className="text-sm font-semibold">{group.title}</h2>
            <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
              {group.links.map((link) => (
                <li key={link.path}>
                  <Link
                    className="rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                    href={"samplePath" in link ? link.samplePath : link.path}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-[var(--line)] px-5 py-4 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} {siteConfig.name}.
        本站内容仅供信息参考，不构成法律、移民、税务或职业建议。
      </div>
    </footer>
  );
}
