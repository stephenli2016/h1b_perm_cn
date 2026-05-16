import Link from "next/link";

import { RouteCard } from "@/components/route-card";
import { getRoute, siteConfig } from "@/lib/site";

const focusAreas = [
  {
    title: "查公司",
    body: "用 DOL OFLC 和 USCIS 官方公开数据观察雇主近年的 H-1B 与 PERM 记录。",
  },
  {
    title: "查工资",
    body: "把职位、地区和 prevailing wage 放在同一张图景里，辅助理解公开工资信号。",
  },
  {
    title: "查 PERM",
    body: "区分 PERM disclosure data、劳工认证和后续 I-140/I-485 阶段，避免把信号当结论。",
  },
  {
    title: "查排期",
    body: "用 Visa Bulletin 和 USCIS filing chart 信息解释中国大陆出生 EB 类别排期状态。",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
      <section className="grid items-center gap-10 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">
            {siteConfig.tagline}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl">
            给海外华人的职业移民公开数据工作台
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            VisaRadar CN 将围绕官方数据建立公司、工资、PERM
            和排期页面，帮助用户用中文理解数据含义、覆盖范围和限制。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent-strong)] hover:text-white"
              href="/h1b"
            >
              查看 H-1B 入口
            </Link>
            <Link
              className="rounded-md border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold shadow-sm"
              href="/tools"
            >
              浏览工具规划
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold">M02 信息架构已就位</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            当前页面已连接导航、页脚、合规提示和核心路线。真实数据、搜索和工具逻辑会在后续里程碑逐步加入。
          </p>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt className="text-[var(--muted)]">路线</dt>
              <dd className="font-medium">12 个公开入口</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt className="text-[var(--muted)]">公司页</dt>
              <dd className="font-medium">H-1B / PERM 动态模板</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt className="text-[var(--muted)]">索引策略</dt>
              <dd className="font-medium">低数据页先 noindex</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {focusAreas.map((area) => (
          <article
            className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
            key={area.title}
          >
            <h2 className="text-lg font-semibold">{area.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {area.body}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 pb-12 md:grid-cols-3">
        {["/h1b", "/perm", "/visa-bulletin"].map((path) => {
          const route = getRoute(path);

          if (!route) {
            return null;
          }

          return (
            <RouteCard
              description={route.description}
              href={route.path}
              key={route.path}
              meta="核心入口"
              title={route.title}
            />
          );
        })}
      </section>
    </main>
  );
}
