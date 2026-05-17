"use client";

import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 lg:px-10">
      <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--accent)]">500</p>
        <h1 className="mt-3 text-3xl font-semibold">页面暂时无法加载</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">
          当前页面发生了临时错误。本站不会因为错误页收集额外个人身份信息；可以重试或回到公开数据入口。
        </p>
        {error.digest ? (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Error digest: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
            onClick={reset}
            type="button"
          >
            重试
          </button>
          <Link
            className="rounded-md border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold"
            href="/"
          >
            回到首页
          </Link>
        </div>
      </section>
    </main>
  );
}
