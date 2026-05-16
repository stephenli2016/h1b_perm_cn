import { officialSourceNames } from "@/lib/site";

type SourceNoteProps = {
  names?: readonly string[];
  latestDataLabel?: string;
};

export function SourceNote({
  names = officialSourceNames,
  latestDataLabel = "尚未接入真实数据；后续里程碑会显示最新数据日期和覆盖财政年度。",
}: SourceNoteProps) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">数据来源与覆盖说明</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {latestDataLabel}
      </p>
      <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
        {names.map((name) => (
          <li className="rounded-md bg-slate-50 px-3 py-2" key={name}>
            {name}
          </li>
        ))}
      </ul>
    </section>
  );
}
