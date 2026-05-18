import type { ReactNode } from "react";

type FeedbackStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function LoadingState({
  title = "正在加载",
  description = "请稍候，数据正在准备中。",
}: Partial<FeedbackStateProps>) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-3 w-3 rounded-full bg-[var(--accent)]"
        />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
    </section>
  );
}

export function ErrorState({ title, description, action }: FeedbackStateProps) {
  return (
    <section
      aria-live="assertive"
      className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-900 shadow-sm"
      role="alert"
    >
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
