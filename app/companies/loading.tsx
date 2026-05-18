export default function CompaniesLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
      <div className="mb-8">
        <div className="h-3 w-32 rounded-full bg-slate-200" />
        <div className="mt-5 h-9 w-72 rounded-full bg-slate-200" />
        <div className="mt-4 h-4 max-w-xl rounded-full bg-slate-100" />
      </div>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          正在打开公司目录...
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="grid gap-2" key={index}>
              <div className="h-3 w-20 rounded-full bg-slate-200" />
              <div className="h-9 rounded-md bg-slate-100" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            className="h-24 rounded-lg border border-[var(--line)] bg-white shadow-sm"
            key={index}
          />
        ))}
      </section>
    </main>
  );
}
