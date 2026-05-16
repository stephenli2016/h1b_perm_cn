import Link from "next/link";

import type { PublicDirectoryPagination } from "@/lib/db/public-query-repository";

type PaginationProps = {
  basePath: string;
  currentParams: Record<string, string | undefined>;
  pagination: PublicDirectoryPagination;
};

export function Pagination({
  basePath,
  currentParams,
  pagination,
}: PaginationProps) {
  return (
    <nav
      aria-label="搜索结果分页"
      className="flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-white p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-[var(--muted)]">
        第 {pagination.page} / {pagination.totalPages} 页，共{" "}
        {pagination.totalResults} 条结果
      </p>
      <div className="flex gap-2">
        {pagination.hasPreviousPage ? (
          <Link
            className="rounded-md border border-[var(--line)] px-3 py-2 font-semibold"
            href={pageHref(basePath, currentParams, pagination.page - 1)}
          >
            上一页
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="rounded-md border border-slate-100 px-3 py-2 text-slate-400"
          >
            上一页
          </span>
        )}

        {pagination.hasNextPage ? (
          <Link
            className="rounded-md border border-[var(--line)] px-3 py-2 font-semibold"
            href={pageHref(basePath, currentParams, pagination.page + 1)}
          >
            下一页
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="rounded-md border border-slate-100 px-3 py-2 text-slate-400"
          >
            下一页
          </span>
        )}
      </div>
    </nav>
  );
}

function pageHref(
  basePath: string,
  currentParams: Record<string, string | undefined>,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(currentParams)) {
    if (key !== "page" && value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
}
