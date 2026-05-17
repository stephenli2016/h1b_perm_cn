import { readFileSync } from "node:fs";
import { join } from "node:path";

const vercelConfigPath = "vercel.json";
const envExamplePath = ".env.example";
const deploymentDocPath = "docs/VERCEL_DEPLOYMENT_M27.md";
const packageJsonPath = "package.json";

type VercelHeader = {
  key?: string;
  value?: string;
};

type VercelHeaderRule = {
  source?: string;
  headers?: VercelHeader[];
};

type VercelConfig = {
  $schema?: string;
  framework?: string;
  installCommand?: string;
  buildCommand?: string;
  env?: Record<string, string>;
  build?: {
    env?: Record<string, string>;
  };
  public?: boolean;
  headers?: VercelHeaderRule[];
};

type PackageJson = {
  packageManager?: string;
  scripts?: Record<string, string>;
};

type ValidationCheck = {
  name: string;
  passed: boolean;
  detail?: string;
};

export type VercelPrepValidationReport = {
  status: "pass" | "fail";
  checks: ValidationCheck[];
};

export function buildVercelPrepValidationReport({
  cwd = process.cwd(),
}: {
  cwd?: string;
} = {}): VercelPrepValidationReport {
  const vercelConfig = JSON.parse(
    readFileSync(join(cwd, vercelConfigPath), "utf8"),
  ) as VercelConfig;
  const packageJson = JSON.parse(
    readFileSync(join(cwd, packageJsonPath), "utf8"),
  ) as PackageJson;
  const envExample = readFileSync(join(cwd, envExamplePath), "utf8");
  const deploymentDoc = readFileSync(join(cwd, deploymentDocPath), "utf8");
  const headerKeys = new Set(
    (vercelConfig.headers ?? [])
      .flatMap((rule) => rule.headers ?? [])
      .map((header) => header.key?.toLowerCase())
      .filter((key): key is string => Boolean(key)),
  );
  const checks: ValidationCheck[] = [
    {
      name: "vercel.json uses the official schema",
      passed: vercelConfig.$schema === "https://openapi.vercel.sh/vercel.json",
    },
    {
      name: "Vercel framework preset is Next.js",
      passed: vercelConfig.framework === "nextjs",
    },
    {
      name: "Vercel build command uses the package script",
      passed: vercelConfig.buildCommand === "pnpm build",
    },
    {
      name: "Vercel install command keeps the lockfile frozen",
      passed: vercelConfig.installCommand === "pnpm install --frozen-lockfile",
    },
    {
      name: "package metadata pins pnpm",
      passed: packageJson.packageManager?.startsWith("pnpm@") ?? false,
    },
    {
      name: "production build script is present",
      passed: packageJson.scripts?.build === "next build --webpack",
    },
    {
      name: "vercel.json does not store environment variables",
      passed:
        vercelConfig.env === undefined && vercelConfig.build?.env === undefined,
      detail:
        "Secrets and environment values belong in Vercel Project Settings, not vercel.json.",
    },
    {
      name: "deployment logs/source are not made public",
      passed: vercelConfig.public !== true,
    },
    {
      name: "baseline security headers are configured",
      passed: [
        "x-content-type-options",
        "referrer-policy",
        "x-frame-options",
        "permissions-policy",
      ].every((header) => headerKeys.has(header)),
    },
    {
      name: ".env.example includes prelaunch noindex control",
      passed: envExample.includes("PRELAUNCH_NOINDEX=false"),
    },
    {
      name: "deployment doc includes env checklist",
      passed:
        deploymentDoc.includes("Environment Variable Checklist") &&
        deploymentDoc.includes("PRELAUNCH_NOINDEX"),
    },
    {
      name: "deployment doc includes DNS and owner approval guidance",
      passed:
        deploymentDoc.includes("Domain And DNS Checklist") &&
        deploymentDoc.includes("owner approval"),
    },
  ];

  return {
    status: checks.every((check) => check.passed) ? "pass" : "fail",
    checks,
  };
}

export function renderVercelPrepValidationReport(
  report: VercelPrepValidationReport,
) {
  return [
    "Vercel deployment prep validation",
    `Status: ${report.status}`,
    ...report.checks.map((check) => {
      const status = check.passed ? "PASS" : "FAIL";
      const detail = check.detail ? ` (${check.detail})` : "";

      return `${status} ${check.name}${detail}`;
    }),
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildVercelPrepValidationReport();

  console.log(renderVercelPrepValidationReport(report));
  process.exitCode = report.status === "pass" ? 0 : 1;
}
