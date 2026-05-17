import Link from "next/link";
import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { buildNoIndexSeoMetadata } from "@/lib/seo/metadata";

type CorrectionsReceivedPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = buildNoIndexSeoMetadata({
  title: "纠错请求已接收",
  description: "纠错请求确认页面，不进入 sitemap，也不回显提交内容。",
  path: "/corrections/received",
});

export default async function CorrectionsReceivedPage({
  searchParams,
}: CorrectionsReceivedPageProps) {
  const params = await searchParams;
  const status = firstValue(params?.status);
  const requestId = firstValue(params?.id);
  const isReceived = status === "received" && requestId;
  const isUnavailable = status === "unavailable";

  return (
    <PageShell
      breadcrumbs={[
        { href: "/", label: "首页" },
        { href: "/corrections", label: "纠错" },
        { label: "请求确认" },
      ]}
      canonicalPath="/corrections/received"
      description="这个确认页只显示请求编号，不展示你提交的说明内容。"
      eyebrow="纠错"
      title={
        isReceived
          ? "纠错请求已接收"
          : isUnavailable
            ? "纠错表单暂时不可用"
            : "纠错请求未完成"
      }
    >
      <div className="space-y-6">
        <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            {isReceived
              ? "请求编号"
              : isUnavailable
                ? "请使用邮件备用路径"
                : "需要重新提交"}
          </h2>
          {isReceived ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              请求编号：{" "}
              <span className="font-semibold text-slate-950">{requestId}</span>
              。我们会按官方来源、字段映射、雇主名称归并和隐私风险顺序复核。这个页面不会展示你提交的说明、邮箱或来源
              URL。
            </p>
          ) : isUnavailable ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              当前表单暂时无法接收请求。请返回纠错页使用邮件备用路径，并继续避免发送证件号码、完整住址或个人案情材料。
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
