import { correctionRequestTypes } from "@/lib/compliance/content";

export function CorrectionRequestForm() {
  return (
    <form
      action="/corrections/request"
      className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm"
      method="post"
    >
      <div>
        <h2 className="text-lg font-semibold">提交纠错请求</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          MVP 阶段表单只走本地
          stub：提交后生成公开请求编号，不发送邮件、不写入数据库、不暴露
          secrets。
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          请求类型
          <select
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-normal"
            name="requestType"
            required
          >
            {correctionRequestTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.labelZh}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          联系邮箱（可选）
          <input
            autoComplete="email"
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-normal"
            name="submitterEmail"
            placeholder="name@example.com"
            type="email"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          问题页面 URL（可选）
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-normal"
            name="pageUrl"
            placeholder="https://example.com/h1b/company/..."
            type="url"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          公司名称或页面标题（可选）
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-normal"
            maxLength={160}
            name="employerName"
            placeholder="公司名、别名或页面标题"
            type="text"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold md:col-span-2">
          可核验官方来源 URL（可选）
          <input
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-normal"
            name="sourceUrl"
            placeholder="https://www.dol.gov/... 或 https://www.uscis.gov/..."
            type="url"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold md:col-span-2">
          问题说明
          <textarea
            className="min-h-36 rounded-md border border-[var(--line)] px-3 py-2 text-sm font-normal leading-6"
            maxLength={2000}
            name="description"
            placeholder="请描述需要复核的字段、归并问题或隐私风险。不要提交证件号码、完整住址、receipt number、雇佣合同或个人案情细节。"
            required
          />
        </label>
      </div>

      <label className="mt-5 flex gap-3 text-sm leading-6 text-[var(--muted)]">
        <input
          className="mt-1 h-4 w-4 rounded border-[var(--line)]"
          name="acknowledgement"
          required
          type="checkbox"
          value="understood"
        />
        我理解此表单不是法律咨询通道；如需要个案建议，应咨询持牌律师或合格专业人士。
      </label>

      <button
        className="mt-6 inline-flex rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
        type="submit"
      >
        提交本地 stub 请求
      </button>
    </form>
  );
}
