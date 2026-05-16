import Link from "next/link";

import { siteConfig } from "@/lib/site";

type DisclaimerStripProps = {
  compact?: boolean;
};

export function DisclaimerStrip({ compact = false }: DisclaimerStripProps) {
  return (
    <aside
      className={`border-y border-amber-200 bg-amber-50 text-[var(--warning)] ${
        compact ? "px-4 py-3 text-xs" : "px-5 py-3 text-sm"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 leading-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {compact ? siteConfig.shortDisclaimer : siteConfig.fullDisclaimer}
        </p>
        <Link
          className="shrink-0 font-semibold text-[var(--accent-strong)]"
          href="/disclaimer"
        >
          查看免责声明
        </Link>
      </div>
    </aside>
  );
}
