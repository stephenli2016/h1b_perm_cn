import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import type {
  CompanyImmigrationSignal,
  CompanyImmigrationSignalDimension,
} from "@/lib/company-immigration-signals";

const signalColumns: DataTableColumn<CompanyImmigrationSignalDimension>[] = [
  {
    key: "dimension",
    header: "维度",
    render: (row) => (
      <div>
        <p className="font-medium text-slate-950">{row.labelZh}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {levelLabelZh(row.level)}
        </p>
      </div>
    ),
  },
  {
    key: "score",
    header: "信号分",
    align: "right",
    render: (row) => `${row.score} / ${row.maxScore}`,
  },
  {
    key: "evidence",
    header: "公开证据",
    render: (row) => (
      <div className="space-y-1">
        {row.evidenceZh.map((item) => (
          <p key={item}>{item}</p>
        ))}
        <p className="pt-1 text-xs leading-5 text-[var(--muted)]">
          {row.explanationZh}
        </p>
      </div>
    ),
  },
];

export function CompanyImmigrationSignalPanel({
  signal,
}: {
  signal: CompanyImmigrationSignal;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{signal.labelZh}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {signal.interpretationNoteZh}
          </p>
        </div>
        <Link
          className="text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
          href={signal.methodologyHref}
        >
          查看方法说明
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          description="这个数字衡量公开数据覆盖与可解释程度，不是批准率或担保承诺。"
          label="综合信号"
          trend={signal.lowSample.flagged ? "低样本" : "公开数据"}
          trendTone={signal.lowSample.flagged ? "warning" : "positive"}
          value={`${signal.score} / ${signal.maxScore}`}
        />
        <MetricCard
          description="标签根据记录数量、跨年连续性、来源和可解释维度生成。"
          label="信号标签"
          trendTone={signal.lowSample.flagged ? "warning" : "positive"}
          value={signal.bandLabelZh}
        />
        <MetricCard
          description={
            signal.lowSample.messageZh ??
            "样本量达到当前公开信号展示标准，但仍不代表个案结果。"
          }
          label="样本提示"
          trend={signal.lowSample.flagged ? "谨慎" : "可比较"}
          trendTone={signal.lowSample.flagged ? "warning" : "positive"}
          value={signal.lowSample.flagged ? "低样本" : "样本较足"}
        />
      </section>

      <DataTable
        caption="公司公开数据友好度信号维度明细"
        columns={signalColumns}
        getRowKey={(row) => row.key}
        rows={signal.dimensions}
      />
    </section>
  );
}

function levelLabelZh(level: CompanyImmigrationSignalDimension["level"]) {
  const labels: Record<CompanyImmigrationSignalDimension["level"], string> = {
    limited: "公开证据有限",
    some: "有部分公开证据",
    strong: "公开证据较充分",
  };

  return labels[level];
}
