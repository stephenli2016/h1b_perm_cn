import Link from "next/link";
import type { ReactNode } from "react";

import { siteConfig } from "@/lib/site";

type DisclaimerBoxProps = {
  title?: string;
  children?: ReactNode;
  compact?: boolean;
};

export function DisclaimerBox({
  title = "重要提示",
  children,
  compact = false,
}: DisclaimerBoxProps) {
  return (
    <aside
      aria-label={title}
      className={`border border-amber-200 bg-amber-50 text-[var(--warning)] ${
        compact ? "rounded-md p-4 text-sm" : "rounded-lg p-5 text-sm"
      }`}
    >
      <h2 className="font-semibold text-amber-950">{title}</h2>
      <div className="mt-2 leading-6">
        {children ?? <p>{siteConfig.fullDisclaimer}</p>}
      </div>
      <Link
        className="mt-3 inline-flex rounded-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        href="/disclaimer"
      >
        查看完整免责声明
      </Link>
    </aside>
  );
}
