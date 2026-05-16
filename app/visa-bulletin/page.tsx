import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { SourceNote } from "@/components/source-note";
import {
  getLatestVisaBulletinMonth,
  listVisaBulletinRows,
} from "@/lib/db/local-repository";

export const metadata: Metadata = {
  title: "中国职业移民排期",
  description:
    "中国大陆出生 EB-1、EB-2、EB-3 Visa Bulletin 和 USCIS filing chart 中文解释入口。",
  alternates: {
    canonical: "/visa-bulletin",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function VisaBulletinPage() {
  const latestMonth = getLatestVisaBulletinMonth();
  const rows = latestMonth ? listVisaBulletinRows(latestMonth.monthKey) : [];

  return (
    <PageShell
      description="中国大陆出生 EB-1、EB-2、EB-3 的 Department of State Visa Bulletin fixture 数据，以及 USCIS 当月 filing chart 选择。"
      eyebrow="Visa Bulletin"
      title="中国职业移民排期"
    >
      {latestMonth ? (
        <section className="space-y-4">
          <div className="grid gap-3 border-y border-slate-200 py-4 text-sm text-slate-700 md:grid-cols-3">
            <div>
              <div className="font-medium text-slate-950">月份</div>
              <div>{latestMonth.monthKey}</div>
            </div>
            <div>
              <div className="font-medium text-slate-950">
                USCIS filing chart
              </div>
              <div>{chartLabelZh(latestMonth.uscisFilingChart)}</div>
            </div>
            <div>
              <div className="font-medium text-slate-950">最近来源日期</div>
              <div>{latestMonth.publishedAt}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-3 pr-4 font-medium">类别</th>
                  <th className="px-4 py-3 font-medium">Final Action Date</th>
                  <th className="px-4 py-3 font-medium">Dates for Filing</th>
                  <th className="px-4 py-3 font-medium">当月 I-485 对照表</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const selected =
                    latestMonth.uscisFilingChart === "final_action"
                      ? row.finalAction
                      : row.datesForFiling;

                  return (
                    <tr
                      className="border-b border-slate-100 text-slate-800"
                      key={row.category}
                    >
                      <td className="py-3 pr-4 font-medium text-slate-950">
                        {row.category}
                      </td>
                      <td className="px-4 py-3">
                        {formatCutoff(row.finalAction)}
                      </td>
                      <td className="px-4 py-3">
                        {formatCutoff(row.datesForFiling)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-950">
                        {formatCutoff(selected)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            日期对照只表示公开表格中的 cut-off date。是否能提交 I-485 还要看
            USCIS
            当月选择、个人类别、chargeability、身份和案件事实。本站内容仅供信息参考，不构成法律、移民、税务或职业建议。
          </p>
        </section>
      ) : (
        <p className="text-sm text-slate-600">
          暂无本地 Visa Bulletin fixture。
        </p>
      )}

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="border-t border-slate-200 pt-4">
          <h2 className="text-base font-semibold text-slate-950">
            Final Action Date
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            通常用于判断是否有移民签证名额可用于最终批准或签证签发。
          </p>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <h2 className="text-base font-semibold text-slate-950">
            Dates for Filing
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            通常用于国务院/NVC 文件准备；在美国境内调整身份时，还要看 USCIS
            当月是否允许使用。
          </p>
        </div>
      </section>

      <div className="mt-6">
        <SourceNote
          latestDataLabel={
            latestMonth
              ? `本页使用本地 fixture 展示 ${latestMonth.monthKey} 及相邻月份的职业移民排期结构；生产发布前仍需按官方页面刷新当月数据。`
              : "本页尚无本地 Visa Bulletin fixture。"
          }
          names={[
            "U.S. Department of State Visa Bulletin",
            "USCIS Adjustment of Status filing chart",
          ]}
        />
      </div>
    </PageShell>
  );
}

function chartLabelZh(chart: "final_action" | "dates_for_filing") {
  return chart === "final_action" ? "Final Action Dates" : "Dates for Filing";
}

function formatCutoff(
  date:
    | {
        cutoffDate?: string;
        cutoffStatus: "date" | "current" | "unavailable";
        rawValue: string;
      }
    | undefined,
) {
  if (!date) {
    return "暂无";
  }
  if (date.cutoffStatus === "current") {
    return "Current";
  }
  if (date.cutoffStatus === "unavailable") {
    return "Unavailable";
  }
  return date.cutoffDate ?? date.rawValue;
}
