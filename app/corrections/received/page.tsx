import Link from "next/link";
import type { Metadata } from "next";

import { LegalDraftNotice } from "@/components/compliance/legal-draft-notice";
import { PageShell } from "@/components/page-shell";
import { buildNoIndexSeoMetadata } from "@/lib/seo/metadata";

type CorrectionsReceivedPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = buildNoIndexSeoMetadata({
  title: "纠错请求已接收",
  description: "本地纠错请求 stub 的确认页面，不进入 sitemap。",
  path: "/corrections/received",
});

export default async function CorrectionsReceivedPage({
  searchParams,
}: CorrectionsReceivedPageProps) {
  const params = await searchParams;
  const status = firstValue(params?.status);
  const requestId = firstValue(params?.id);
  const isReceived = status === "received" && requestId;

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/corrections", label: "纠错" },
        { label: "请求确认" },
      ]}
      canonicalPath="/corrections/received"
      description="这个确认页只显示本地 stub 编号，不展示你提交的说明内容。"
      eyebrow="纠错"
      title={isReceived ? "纠错请求已接收" : "纠错请求未完成"}
    >
      <div className="space-y-6">
        <LegalDraftNotice />

        <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            {isReceived ? "本地 stub 编号" : "需要重新提交"}
          </h2>
          {isReceived ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              请求编号：{" "}
              <span className="font-semibold text-slate-950">{requestId}</span>
              。当前 MVP
              没有邮件或数据库连接，因此这只是本地确认页面；生产接入后会把请求写入安全的后台队列。
            </p>
          ) : (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              请求类型、问题说明或确认勾选缺失。请返回纠错页补全必要信息。
            </p>
          )}
          <Link
            className="mt-5 inline-flex rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] hover:text-white"
            href="/corrections"
          >
            返回纠错页
          </Link>
        </section>
      </div>
    </PageShell>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
