import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  align?: "left" | "right";
  render: (row: Row) => ReactNode;
};

type DataTableProps<Row> = {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  emptyTitle = "暂无数据",
  emptyDescription = "当前 fixture 中没有符合条件的记录。",
}: DataTableProps<Row>) {
  if (rows.length === 0) {
    return (
      <EmptyState
        description={emptyDescription}
        title={emptyTitle}
        tone="muted"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--line)] bg-white shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50">
          <tr className="border-b border-[var(--line)] text-slate-600">
            {columns.map((column) => (
              <th
                className={`px-4 py-3 font-medium ${
                  column.align === "right" ? "text-right" : "text-left"
                }`}
                key={column.key}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className="border-b border-slate-100 text-slate-800 last:border-0"
              key={getRowKey(row, index)}
            >
              {columns.map((column) => (
                <td
                  className={`px-4 py-3 align-top ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                  key={column.key}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
