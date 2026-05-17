import { LegalDraftNotice } from "@/components/compliance/legal-draft-notice";
import { OfficialSourceList } from "@/components/compliance/official-source-list";
import { DisclaimerBox } from "@/components/ui/disclaimer-box";
import { RelatedLinks } from "@/components/ui/related-links";
import {
  getOfficialSource,
  type MethodologyPage,
} from "@/lib/compliance/content";
import { siteConfig } from "@/lib/site";

type MethodologyContentProps = {
  page: MethodologyPage;
};

export function MethodologyContent({ page }: MethodologyContentProps) {
  const sources = page.sourceIds
    .map((sourceId) => getOfficialSource(sourceId))
    .filter((source) => source !== undefined);

  return (
    <div className="space-y-6">
      <LegalDraftNotice />

      <section className="grid gap-4 lg:grid-cols-2">
        <MethodologyList title="我们使用的数据" items={page.dataWeUse} />
        <MethodologyList title="页面会展示什么" items={page.publicOutputs} />
        <MethodologyList title="不会做的推断" items={page.limits} />
        <MethodologyList
          title="隐私与质量控制"
          items={page.privacyAndQuality}
        />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">官方来源</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            本站只把这些来源作为数据输入或合规边界参考，不使用竞争网站、论坛或付费数据库作为数据源。
          </p>
        </div>
        <OfficialSourceList sources={sources} />
      </section>

      <RelatedLinks items={page.relatedLinks} title="相关页面" />

      <DisclaimerBox>
        <p>{siteConfig.fullDisclaimer}</p>
      </DisclaimerBox>

      <p className="text-xs text-[var(--muted)]">Last reviewed: 2026-05-17</p>
    </div>
  );
}

function MethodologyList({
  items,
  title,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
