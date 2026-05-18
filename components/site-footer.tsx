import Link from "next/link";

import { footerNavGroups, siteConfig } from "@/lib/site";

const footerQuickLinks = [
  {
    href: "/companies",
    label: "查公司",
    description: "按公司、职位和地点看公开记录",
  },
  {
    href: "/tools/h1b-wage-level-checker",
    label: "查工资",
    description: "用通行工资背景理解工资",
  },
  {
    href: "/visa-bulletin",
    label: "查排期",
    description: "看中国 EB 类别月度排期",
  },
  {
    href: "/corrections",
    label: "提交纠错",
    description: "反馈来源、名称归并或隐私问题",
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1.6fr]">
          <div>
            <p className="text-base font-semibold">{siteConfig.chineseName}</p>
            <p className="mt-2 text-sm uppercase text-[var(--muted)]">
              {siteConfig.name}
            </p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">
              {siteConfig.tagline}
              。所有公开数据解释都应先看来源、覆盖期、样本量和限制。
            </p>
            <p className="mt-3 max-w-sm text-xs leading-5 text-[var(--muted)]">
              不提供法律、移民、税务、职业或财务建议；需要个案判断时请咨询持牌律师或合格专业人士。
            </p>
          </div>

          <section aria-label="常用动作">
            <h2 className="text-sm font-semibold">常用动作</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {footerQuickLinks.map((link) => (
                <Link
                  className="rounded-md border border-[var(--line)] p-3 text-sm transition hover:border-[var(--accent)] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                  href={link.href}
                  key={link.href}
                >
                  <span className="font-semibold text-[var(--accent-strong)]">
                    {link.label}
                  </span>
                  <span className="mt-1 block leading-5 text-[var(--muted)]">
                    {link.description}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>
      <div className="border-t border-[var(--line)] px-5 py-4 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} {siteConfig.name}.
        本站内容仅供信息参考，不构成法律、移民、税务或职业建议。
      </div>
    </footer>
  );
}
