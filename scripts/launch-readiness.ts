import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type LaunchReadinessStatus = "pass" | "warn" | "blocked" | "fail";
type LaunchReadinessCategory = "technical" | "approval" | "optional";

type LaunchReadinessCheck = {
  id: string;
  label: string;
  category: LaunchReadinessCategory;
  status: LaunchReadinessStatus;
  detail: string;
};

type SourceManifest = {
  updated_at?: string;
  sources?: Array<{
    id: string;
    source_name: string;
    official_url: string;
    fiscal_year?: number | null;
    fixture_path?: string | null;
    required?: boolean;
  }>;
};

type PackageJson = {
  scripts?: Record<string, string>;
};

export type LaunchReadinessReport = {
  status: LaunchReadinessStatus;
  technicalReady: boolean;
  approvalReady: boolean;
  publicLaunchReady: boolean;
  generatedAt: string;
  checks: LaunchReadinessCheck[];
};

type LaunchReadinessEvidence = {
  productionDataVerified?: boolean;
  publicLaunchApproved?: boolean;
  customDomainConnected?: boolean;
};

type LaunchReadinessRuntimeEnv = Record<string, string | undefined>;

const excludedDirs = new Set([
  ".git",
  ".next",
  "coverage",
  "data/normalized",
  "data/production",
  "data/raw",
  "dist",
  "docs/milestone_reports",
  "node_modules",
]);

const secretPatterns = [
  /sk-proj-[A-Za-z0-9_-]+/,
  /sk-[A-Za-z0-9]{20,}/,
  /^SUPABASE_SERVICE_ROLE_KEY=(?!replace)/,
  /^SUPABASE_ANON_KEY=(?!replace)/,
  /^DATABASE_URL=postgresql:\/\/[^\n]*supabase/i,
  /^VERCEL_TOKEN=/,
  /^AUTH_TOKEN=/,
  /PRIVATE KEY/,
];

const forbiddenClaimPatterns = [
  /这家公司一定/,
  /一定给你办/,
  /一定 sponsor/i,
  /保证办/,
  /保证获批/,
  /你的工资一定/,
  /你的排期一定/,
  /未来一定/,
  /一定会批准/,
  /一定可以提交/,
  /一定可以交/,
  /绕过移民/,
  /隐藏信息/,
  /伪造/,
  /misrepresent/i,
  /bypass immigration/i,
];

const safeNegationMarkers = [
  "不",
  "不会",
  "不是",
  "不等于",
  "不代表",
  "不能",
  "避免",
  "禁止",
  "风险",
  "误区",
];

const allowedOfficialHosts = new Set([
  "download.bls.gov",
  "www.dol.gov",
  "flag.dol.gov",
  "www.census.gov",
  "www.onetcenter.org",
  "www.uscis.gov",
  "travel.state.gov",
]);

const requiredLinkedPages = [
  "/terms",
  "/privacy",
  "/disclaimer",
  "/corrections",
  "/sources",
];

export function buildLaunchReadinessReport({
  cwd = process.cwd(),
  now = new Date(),
  evidence = {},
  runtimeEnv = process.env,
}: {
  cwd?: string;
  now?: Date;
  evidence?: LaunchReadinessEvidence;
  runtimeEnv?: LaunchReadinessRuntimeEnv;
} = {}): LaunchReadinessReport {
  const packageJson = readJson<PackageJson>(cwd, "package.json");
  const manifest = readJson<SourceManifest>(cwd, "data/source_manifest.json");
  const envExample = readText(cwd, ".env.example");
  const siteConfig = readText(cwd, "lib/site.ts");
  const complianceContent = readText(cwd, "lib/compliance/content.ts");
  const productionDataVerified =
    evidence.productionDataVerified ?? hasProductionDataEvidence(cwd);
  const publicLaunchApproved =
    evidence.publicLaunchApproved ?? hasPublicLaunchApprovalEvidence(cwd);
  const customDomainConnected =
    evidence.customDomainConnected ??
    hasCustomDomainEvidence(runtimeEnv, siteConfig);
  const checks: LaunchReadinessCheck[] = [
    checkNoSecrets(cwd),
    checkBuildScripts(packageJson),
    checkSitemapAndSeoCoverage(cwd),
    checkLowQualityNoindexCoverage(cwd),
    checkDisclaimers(siteConfig, complianceContent),
    checkRequiredLinkedPages(siteConfig),
    checkDataSourceDates(manifest),
    checkOfficialSources(manifest),
    checkForbiddenClaims(cwd),
    checkOptionalAnalytics(envExample),
    checkProductionDataReadiness(
      envExample,
      runtimeEnv,
      productionDataVerified,
    ),
    checkLegalApproval(complianceContent),
    checkProductionDeploymentApproval(publicLaunchApproved),
    checkCustomDomainDns(customDomainConnected),
  ];
  const hasFailures = checks.some((check) => check.status === "fail");
  const hasBlockers = checks.some((check) => check.status === "blocked");
  const hasWarnings = checks.some((check) => check.status === "warn");
  const technicalReady = checks
    .filter((check) => check.category === "technical")
    .every((check) => check.status !== "fail" && check.status !== "blocked");
  const approvalReady = checks
    .filter((check) => check.category === "approval")
    .every((check) => check.status !== "fail" && check.status !== "blocked");
  const status: LaunchReadinessStatus = hasFailures
    ? "fail"
    : hasBlockers
      ? "blocked"
      : hasWarnings
        ? "warn"
        : "pass";

  return {
    status,
    technicalReady,
    approvalReady,
    publicLaunchReady: technicalReady && approvalReady,
    generatedAt: now.toISOString(),
    checks,
  };
}

export function renderLaunchReadinessReport(report: LaunchReadinessReport) {
  return [
    "Production launch readiness",
    `Status: ${report.status}`,
    `Technical ready: ${report.technicalReady ? "yes" : "no"}`,
    `Approval ready: ${report.approvalReady ? "yes" : "no"}`,
    `Public launch ready: ${report.publicLaunchReady ? "yes" : "no"}`,
    `Generated at: ${report.generatedAt}`,
    ...report.checks.map(
      (check) =>
        `${check.status.toUpperCase()} [${check.category}] ${check.id} — ${
          check.label
        }: ${check.detail}`,
    ),
  ].join("\n");
}

function checkNoSecrets(cwd: string): LaunchReadinessCheck {
  const matches = listProjectFiles(cwd)
    .filter(
      (filePath) => relative(cwd, filePath) !== "scripts/launch-readiness.ts",
    )
    .flatMap((filePath) => {
      const body = readFileSync(filePath, "utf8");

      return body
        .split("\n")
        .map((line, index) => ({ filePath, line, lineNumber: index + 1 }))
        .filter(({ line }) =>
          secretPatterns.some((pattern) => pattern.test(line)),
        );
    })
    .map(
      (match) =>
        `${relative(cwd, match.filePath)}:${match.lineNumber}: ${match.line.trim()}`,
    );

  return {
    id: "secrets",
    label: "No secrets committed",
    category: "technical",
    status: matches.length === 0 ? "pass" : "fail",
    detail:
      matches.length === 0
        ? "No local secret patterns were found in tracked project text files."
        : `Potential secret patterns found: ${matches.join(" | ")}`,
  };
}

function checkBuildScripts(packageJson: PackageJson): LaunchReadinessCheck {
  const requiredScripts = ["lint", "typecheck", "test", "build"];
  const missing = requiredScripts.filter(
    (script) => !packageJson.scripts?.[script],
  );

  return {
    id: "build-validation",
    label: "Build and validation commands exist",
    category: "technical",
    status: missing.length === 0 ? "pass" : "fail",
    detail:
      missing.length === 0
        ? "Required package scripts exist; M28 also runs them directly."
        : `Missing package scripts: ${missing.join(", ")}`,
  };
}

function checkSitemapAndSeoCoverage(cwd: string): LaunchReadinessCheck {
  const requiredFiles = [
    "lib/seo/sitemaps.ts",
    "tests/seo.test.ts",
    "tests/technical-seo.test.tsx",
    "scripts/seo-audit.ts",
  ];
  const missing = requiredFiles.filter(
    (filePath) => !existsSync(join(cwd, filePath)),
  );

  return {
    id: "sitemaps",
    label: "Sitemap contains only approved indexable pages",
    category: "technical",
    status: missing.length === 0 ? "pass" : "fail",
    detail:
      missing.length === 0
        ? "Sitemap helpers and SEO audit tests are present; pnpm seo:audit validates exclusions."
        : `Missing SEO validation files: ${missing.join(", ")}`,
  };
}

function checkLowQualityNoindexCoverage(cwd: string): LaunchReadinessCheck {
  const requiredFiles = [
    "lib/seo/company-quality.ts",
    "tests/seo.test.ts",
    "lib/seo/prelaunch.ts",
  ];
  const missing = requiredFiles.filter(
    (filePath) => !existsSync(join(cwd, filePath)),
  );

  return {
    id: "noindex",
    label: "Low-quality pages noindex",
    category: "technical",
    status: missing.length === 0 ? "pass" : "fail",
    detail:
      missing.length === 0
        ? "Company quality and prelaunch noindex controls are implemented and covered by SEO tests."
        : `Missing noindex control files: ${missing.join(", ")}`,
  };
}

function checkDisclaimers(
  siteConfig: string,
  complianceContent: string,
): LaunchReadinessCheck {
  const requiredText = [
    "不构成法律、移民、税务、职业或财务建议",
    "公开数据仅供参考，不代表个案结果",
    "本站只整理和解释官方公开数据",
  ];
  const missing = requiredText.filter(
    (text) => !siteConfig.includes(text) && !complianceContent.includes(text),
  );

  return {
    id: "disclaimers",
    label: "Disclaimers visible",
    category: "technical",
    status: missing.length === 0 ? "pass" : "fail",
    detail:
      missing.length === 0
        ? "Sitewide short/full disclaimers and public compliance notice are present."
        : `Missing disclaimer text: ${missing.join(" | ")}`,
  };
}

function checkRequiredLinkedPages(siteConfig: string): LaunchReadinessCheck {
  const missing = requiredLinkedPages.filter(
    (path) => !siteConfig.includes(path),
  );

  return {
    id: "legal-links",
    label: "Terms/privacy/disclaimer/corrections/source pages linked",
    category: "technical",
    status: missing.length === 0 ? "pass" : "fail",
    detail:
      missing.length === 0
        ? "Required legal/source routes are present in the route map and footer groups."
        : `Missing route-map links: ${missing.join(", ")}`,
  };
}

function checkDataSourceDates(manifest: SourceManifest): LaunchReadinessCheck {
  const sources = manifest.sources ?? [];
  const fiscalYears = sources
    .map((source) => source.fiscal_year)
    .filter((year): year is number => typeof year === "number");
  const hasManifestDate = Boolean(manifest.updated_at);
  const hasFiscalYearCoverage = fiscalYears.length > 0;

  return {
    id: "source-dates",
    label: "Data source dates visible",
    category: "technical",
    status: hasManifestDate && hasFiscalYearCoverage ? "pass" : "fail",
    detail:
      hasManifestDate && hasFiscalYearCoverage
        ? `Manifest updated ${manifest.updated_at}; latest fiscal year ${Math.max(
            ...fiscalYears,
          )}.`
        : "Manifest is missing updated_at or fiscal year coverage.",
  };
}

function checkOfficialSources(manifest: SourceManifest): LaunchReadinessCheck {
  const sources = manifest.sources ?? [];
  const disallowed = sources.filter((source) => {
    const host = new URL(source.official_url).host;

    return !allowedOfficialHosts.has(host);
  });

  return {
    id: "official-sources",
    label: "No competitor-scraped data",
    category: "technical",
    status: disallowed.length === 0 ? "pass" : "fail",
    detail:
      disallowed.length === 0
        ? `${sources.length} manifest sources use approved official hosts.`
        : `Disallowed source hosts: ${disallowed
            .map((source) => `${source.id} -> ${source.official_url}`)
            .join(" | ")}`,
  };
}

function checkForbiddenClaims(cwd: string): LaunchReadinessCheck {
  const publicFiles = listProjectFiles(cwd).filter((filePath) => {
    const relativePath = relative(cwd, filePath);

    return /^(app|components|lib|data\/fixtures|README)/.test(relativePath);
  });
  const matches = publicFiles
    .flatMap((filePath) => {
      const body = readFileSync(filePath, "utf8");

      return body
        .split("\n")
        .map((line, index) => ({ filePath, line, lineNumber: index + 1 }))
        .filter(({ line }) =>
          forbiddenClaimPatterns.some((pattern) => pattern.test(line)),
        )
        .filter(
          ({ line }) =>
            !safeNegationMarkers.some((marker) => line.includes(marker)),
        );
    })
    .map(
      (match) =>
        `${relative(cwd, match.filePath)}:${match.lineNumber}: ${match.line.trim()}`,
    );

  return {
    id: "forbidden-claims",
    label: "No forbidden public claims",
    category: "technical",
    status: matches.length === 0 ? "pass" : "fail",
    detail:
      matches.length === 0
        ? "No unsafe guarantee/bypass claim patterns were found in public source files."
        : `Potential forbidden claims found: ${matches.join(" | ")}`,
  };
}

function checkOptionalAnalytics(envExample: string): LaunchReadinessCheck {
  const optionalKeys = [
    "NEXT_PUBLIC_GA_MEASUREMENT_ID=",
    "NEXT_PUBLIC_PLAUSIBLE_DOMAIN=",
    "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=",
    "NEXT_PUBLIC_BING_SITE_VERIFICATION=",
  ];
  const missing = optionalKeys.filter((key) => !envExample.includes(key));

  return {
    id: "analytics-webmaster",
    label: "Analytics/search console optional keys configured if provided",
    category: "optional",
    status: "warn",
    detail:
      missing.length === 0
        ? "Optional placeholders exist, but no real analytics/search console tokens are configured yet."
        : `Missing optional placeholders: ${missing.join(", ")}`,
  };
}

function checkProductionDataReadiness(
  envExample: string,
  runtimeEnv: LaunchReadinessRuntimeEnv,
  productionDataVerified: boolean,
): LaunchReadinessCheck {
  const localFixtureDefault = /^LOCAL_DATA_MODE=fixture$/m.test(envExample);
  const runtimeMode = runtimeEnv.LOCAL_DATA_MODE?.trim().toLowerCase();
  const runtimeDatabaseConfigured =
    isDatabaseRuntimeMode(runtimeMode) && Boolean(runtimeEnv.DATABASE_URL);
  const status: LaunchReadinessStatus =
    runtimeDatabaseConfigured || productionDataVerified ? "pass" : "blocked";
  const detail = runtimeDatabaseConfigured
    ? "Current runtime environment is configured for Postgres-backed production data; DATABASE_URL is present server-side."
    : productionDataVerified
      ? "P4 production evidence records Supabase/Postgres runtime smoke plus live company sitemap/page smoke. .env.example remains fixture by design for safe local defaults."
      : localFixtureDefault
        ? "Public launch is blocked: no production-data verification evidence was found, and .env.example intentionally defaults to fixture mode."
        : "Public launch is blocked: fixture mode is not the documented default, but no production-data verification evidence was found.";

  return {
    id: "production-data",
    label: "Production DB imported and verified",
    category: "technical",
    status,
    detail,
  };
}

function checkLegalApproval(complianceContent: string): LaunchReadinessCheck {
  return {
    id: "legal-approval",
    label: "Legal/compliance language approved for launch",
    category: "approval",
    status: complianceContent.includes("法律与合规文案草案")
      ? "blocked"
      : "pass",
    detail: complianceContent.includes("法律与合规文案草案")
      ? "Public launch is blocked until owner and qualified legal review approve legal/compliance pages."
      : "No legal draft marker found.",
  };
}

function checkProductionDeploymentApproval(
  publicLaunchApproved: boolean,
): LaunchReadinessCheck {
  return {
    id: "deployment-approval",
    label: "Production deployment and public indexing approved",
    category: "approval",
    status: publicLaunchApproved ? "pass" : "blocked",
    detail: publicLaunchApproved
      ? "M32 public launch evidence records owner-approved production publication with preview protection and prelaunch noindex removed."
      : "Public launch is blocked until the owner explicitly approves production deployment, protection removal, and public indexing.",
  };
}

function checkCustomDomainDns(
  customDomainConnected: boolean,
): LaunchReadinessCheck {
  return {
    id: "custom-domain-dns",
    label: "Custom domain/DNS connected if required",
    category: "optional",
    status: customDomainConnected ? "pass" : "warn",
    detail: customDomainConnected
      ? "Runtime site URL appears to use a custom domain."
      : "Production is public on the Vercel domain; custom domain/DNS remains optional and should be owner-approved before any DNS change.",
  };
}

function hasProductionDataEvidence(cwd: string) {
  const p4Report = readOptionalText(
    cwd,
    "docs/milestone_reports/P4_production_data_company_reopen.md",
  );
  const aggregateDoc = readOptionalText(
    cwd,
    "docs/PRODUCTION_AGGREGATES_M31.md",
  );

  return (
    p4Report.includes("company_page_metrics") &&
    p4Report.includes("2,000") &&
    p4Report.includes("pnpm db:runtime:smoke --require-postgres") &&
    p4Report.includes("company-pages.xml") &&
    aggregateDoc.includes("Runtime smoke status: pass")
  );
}

function hasPublicLaunchApprovalEvidence(cwd: string) {
  const publicLaunchReport = readOptionalText(
    cwd,
    "docs/milestone_reports/M32_public_launch.md",
  );

  return (
    publicLaunchReport.includes("Public Production Launch") &&
    publicLaunchReport.includes("PREVIEW_PROTECTION_ENABLED=false") &&
    publicLaunchReport.includes("PRELAUNCH_NOINDEX=false") &&
    publicLaunchReport.includes("Status: Ready")
  );
}

function hasCustomDomainEvidence(
  runtimeEnv: LaunchReadinessRuntimeEnv,
  siteConfig: string,
) {
  const siteUrl = (
    runtimeEnv.NEXT_PUBLIC_SITE_URL ??
    runtimeEnv.SITE_URL ??
    siteConfig.match(/https?:\/\/[^"'\s]+/)?.[0] ??
    ""
  ).trim();

  return (
    Boolean(siteUrl) &&
    !siteUrl.includes("localhost") &&
    !siteUrl.includes("127.0.0.1") &&
    !siteUrl.includes("vercel.app")
  );
}

function isDatabaseRuntimeMode(mode: string | undefined) {
  return mode === "postgres" || mode === "supabase" || mode === "database";
}

function readJson<T>(cwd: string, filePath: string): T {
  return JSON.parse(readText(cwd, filePath)) as T;
}

function readText(cwd: string, filePath: string) {
  return readFileSync(join(cwd, filePath), "utf8");
}

function readOptionalText(cwd: string, filePath: string) {
  const absolutePath = join(cwd, filePath);

  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

function listProjectFiles(cwd: string) {
  const output: string[] = [];
  const visit = (dirPath: string) => {
    const relativeDirPath = relative(cwd, dirPath);
    if (excludedDirs.has(relativeDirPath)) {
      return;
    }

    for (const entry of readdirSync(dirPath)) {
      if (excludedDirs.has(entry)) {
        continue;
      }
      const absolutePath = join(dirPath, entry);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        visit(absolutePath);
      } else if (isTextFile(absolutePath)) {
        output.push(absolutePath);
      }
    }
  };

  visit(cwd);

  return output;
}

function isTextFile(filePath: string) {
  return /\.(css|csv|html|json|md|mjs|sql|ts|tsx|txt|xml|yml|yaml)$/.test(
    filePath,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildLaunchReadinessReport();

  console.log(renderLaunchReadinessReport(report));
  process.exitCode = report.status === "fail" ? 1 : 0;
}
