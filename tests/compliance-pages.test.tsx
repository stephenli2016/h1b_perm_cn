import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CorrectionsPage from "@/app/corrections/page";
import { POST as submitCorrectionRequest } from "@/app/corrections/request/route";
import DisclaimerPage from "@/app/disclaimer/page";
import { MethodologyRoutePage } from "@/app/methodology/methodology-route";
import PrivacyPage from "@/app/privacy/page";
import SourcesPage from "@/app/sources/page";
import TermsPage from "@/app/terms/page";
import {
  correctionRequestTypes,
  methodologyPages,
  officialSources,
} from "@/lib/compliance/content";

describe("M24 legal, source, and correction workflow pages", () => {
  it("renders legal pages as owner/legal-review drafts with no-advice language", () => {
    const html = [
      renderToStaticMarkup(<DisclaimerPage />),
      renderToStaticMarkup(<PrivacyPage />),
      renderToStaticMarkup(<TermsPage />),
    ].join("\n");

    expect(html).toContain("法律与合规文案草案");
    expect(html).toContain("owner 和合格法律专业人士审阅批准");
    expect(html).toContain("不构成法律、移民、税务、职业或财务建议");
    expect(html).toContain("不是律师事务所");
  });

  it("renders source and methodology pages with official source context", () => {
    const sourceHtml = renderToStaticMarkup(<SourcesPage />);
    const methodologyHtml = methodologyPages
      .map((page) =>
        renderToStaticMarkup(<MethodologyRoutePage slug={page.slug} />),
      )
      .join("\n");

    expect(methodologyPages).toHaveLength(5);
    expect(sourceHtml).toContain("不使用竞争网站、论坛或付费数据库作为数据源");
    expect(methodologyHtml).toContain("LCA 是劳动条件申请");
    expect(methodologyHtml).toContain("信号不是 sponsor 成功率");
    expect(methodologyHtml).toContain("USCIS 当月 Adjustment of Status");
  });

  it("keeps official source registry on allowed public-source domains", () => {
    const allowedHosts = new Set([
      "www.dol.gov",
      "flag.dol.gov",
      "www.uscis.gov",
      "travel.state.gov",
    ]);

    expect(officialSources.length).toBeGreaterThanOrEqual(6);
    for (const source of officialSources) {
      expect(allowedHosts.has(new URL(source.url).host)).toBe(true);
      expect(source.lastVerified).toBe("2026-05-17");
    }
  });

  it("renders a no-secret local correction stub form", () => {
    const html = renderToStaticMarkup(<CorrectionsPage />);
    const fieldNames = [...html.matchAll(/\sname="([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(html).toContain('action="/corrections/request"');
    expect(html).toContain('method="post"');
    expect(html).toContain("不发送邮件、不写入数据库、不暴露 secrets");
    expect(html).toContain("提交本地 stub 请求");
    expect(fieldNames).toEqual(
      expect.arrayContaining([
        "requestType",
        "submitterEmail",
        "pageUrl",
        "employerName",
        "sourceUrl",
        "description",
        "acknowledgement",
      ]),
    );
    expect(fieldNames).not.toEqual(
      expect.arrayContaining([
        "passport",
        "aNumber",
        "i94",
        "receiptNumber",
        "ssn",
      ]),
    );
  });

  it("redirects correction submissions without echoing submitted description", async () => {
    const formData = new FormData();
    formData.set("requestType", correctionRequestTypes[0].value);
    formData.set("description", "please fix this private detail");
    formData.set("acknowledgement", "understood");
    formData.set("pageUrl", "http://localhost:3000/h1b/company/example");

    const response = await submitCorrectionRequest(
      new Request("http://localhost:3000/corrections/request", {
        body: formData,
        method: "POST",
      }),
    );
    const location = response.headers.get("location") ?? "";

    expect(response.status).toBe(303);
    expect(location).toContain("/corrections/received");
    expect(location).toContain("status=received");
    expect(location).toContain("type=data-error");
    expect(location).not.toContain("private");
    expect(location).not.toContain("example");
  });

  it("rejects malformed correction submissions into a generic confirmation URL", async () => {
    const formData = new FormData();
    formData.set("requestType", "not-a-real-type");
    formData.set("description", "bad request");
    formData.set("acknowledgement", "understood");

    const response = await submitCorrectionRequest(
      new Request("http://localhost:3000/corrections/request", {
        body: formData,
        method: "POST",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/corrections/received?status=invalid",
    );
  });
});
