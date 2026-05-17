import { legalDraftNotice } from "@/lib/compliance/content";

export function LegalDraftNotice() {
  return (
    <aside className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
      <h2 className="font-semibold text-slate-950">{legalDraftNotice.title}</h2>
      <p className="mt-2 leading-6">{legalDraftNotice.body}</p>
    </aside>
  );
}
