import { legalDraftNotice } from "@/lib/compliance/content";

export function LegalDraftNotice() {
  return (
    <aside className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-[var(--warning)]">
      <h2 className="font-semibold text-amber-950">{legalDraftNotice.title}</h2>
      <p className="mt-2 leading-6">{legalDraftNotice.body}</p>
    </aside>
  );
}
