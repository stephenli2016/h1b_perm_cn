import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type ValidationCheck = {
  name: string;
  passed: boolean;
  detail?: string;
};

export type VercelPreviewValidationReport = {
  status: "pass" | "fail";
  checks: ValidationCheck[];
};

export function buildVercelPreviewValidationReport({
  cwd = process.cwd(),
}: {
  cwd?: string;
} = {}): VercelPreviewValidationReport {
  const envExample = readFileSync(join(cwd, ".env.example"), "utf8");
  const vercelConfig = readFileSync(join(cwd, "vercel.json"), "utf8");
  const m32DocPath = join(cwd, "docs/VERCEL_PREVIEW_M32.md");
  const m32Doc = existsSync(m32DocPath) ? readFileSync(m32DocPath, "utf8") : "";
  const proxyPath = join(cwd, "proxy.ts");
  const proxy = existsSync(proxyPath) ? readFileSync(proxyPath, "utf8") : "";
  const previewProtection = readFileSync(
    join(cwd, "lib/security/preview-protection.ts"),
    "utf8",
  );

  const checks: ValidationCheck[] = [
    {
      name: "preview protection proxy exists",
      passed:
        previewProtection.includes("PREVIEW_PROTECTION_ENABLED") &&
        proxy.includes("export function proxy") &&
        proxy.includes("WWW-Authenticate"),
    },
    {
      name: ".env.example documents preview protection placeholders",
      passed:
        envExample.includes("PREVIEW_PROTECTION_ENABLED=false") &&
        envExample.includes("PREVIEW_PROTECTION_USERNAME=preview") &&
        envExample.includes("PREVIEW_PROTECTION_PASSWORD="),
    },
    {
      name: ".env.example keeps prelaunch noindex available",
      passed: envExample.includes("PRELAUNCH_NOINDEX=false"),
    },
    {
      name: ".env.example documents server-side Postgres mode",
      passed:
        envExample.includes("LOCAL_DATA_MODE=fixture") &&
        envExample.includes("DATABASE_URL=") &&
        envExample.includes("DATABASE_POOL_MAX=1") &&
        envExample.includes("PRERENDER_COMPANY_PAGES=false"),
    },
    {
      name: "Vercel config still does not commit env values",
      passed:
        !/"env"\s*:/.test(vercelConfig) &&
        !/"build"\s*:\s*\{/.test(vercelConfig),
    },
    {
      name: "M32 docs identify required Vercel preview env vars",
      passed:
        m32Doc.includes("PREVIEW_PROTECTION_ENABLED") &&
        m32Doc.includes("LOCAL_DATA_MODE=postgres") &&
        m32Doc.includes("PRELAUNCH_NOINDEX=true") &&
        m32Doc.includes("PRERENDER_COMPANY_PAGES=false") &&
        m32Doc.includes("DATABASE_URL"),
    },
    {
      name: "M32 docs keep production launch gated",
      passed:
        m32Doc.includes("Do not promote") &&
        m32Doc.includes("PRELAUNCH_NOINDEX=false"),
    },
  ];

  return {
    status: checks.every((check) => check.passed) ? "pass" : "fail",
    checks,
  };
}

export function renderVercelPreviewValidationReport(
  report: VercelPreviewValidationReport,
) {
  return [
    "Vercel preview validation",
    `Status: ${report.status}`,
    ...report.checks.map((check) => {
      const status = check.passed ? "PASS" : "FAIL";
      const detail = check.detail ? ` (${check.detail})` : "";

      return `${status} ${check.name}${detail}`;
    }),
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildVercelPreviewValidationReport();

  console.log(renderVercelPreviewValidationReport(report));
  process.exitCode = report.status === "pass" ? 0 : 1;
}
