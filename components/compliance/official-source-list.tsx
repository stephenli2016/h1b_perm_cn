import type { OfficialSource } from "@/lib/compliance/content";

type OfficialSourceListProps = {
  sources: readonly OfficialSource[];
};

export function OfficialSourceList({ sources }: OfficialSourceListProps) {
  return (
    <section className="grid gap-4">
      {sources.map((source) => (
        <article
          className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
          key={source.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{source.nameZh}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {source.nameEn} · {source.agency}
              </p>
            </div>
            <a
              className="inline-flex rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent-strong)] hover:bg-slate-50 hover:text-[var(--accent-strong)]"
              href={source.url}
              rel="noreferrer"
              target="_blank"
            >
              打开官方来源
            </a>
          </div>
          <dl className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)] md:grid-cols-3">
            <div>
              <dt className="font-semibold text-slate-900">覆盖内容</dt>
              <dd className="mt-1">{source.coversZh}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">本站用途</dt>
              <dd className="mt-1">{source.useZh}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">谨慎边界</dt>
              <dd className="mt-1">{source.cautionZh}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Source verified: {source.lastVerified}
          </p>
        </article>
      ))}
    </section>
  );
}
