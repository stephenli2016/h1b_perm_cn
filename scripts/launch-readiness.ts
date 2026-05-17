import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type LaunchReadinessStatus = "pass" | "warn" | "blocked" | "fail";

type LaunchReadinessCheck = {
  id: string;
  label: string;
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
  publicLaunchReady: boolean;
  generatedAt: string;
  checks: LaunchReadinessCheck[];
};

const excludedDirs = new Set([
  ".git",
  ".next",
  "coverage",
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
  "www.dol.gov",
  "flag.dol.gov",
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
}: {
  cwd?: string;
  now?: Date;
} = {}): LaunchReadinessReport {
  const packageJson = readJson<PackageJson>(cwd, "package.json");
  const manifest = readJson<SourceManifest>(cwd, "data/source_manifest.json");
  const envExample = readText(cwd, ".env.example");
  const siteConfig = readText(cwd, "lib/site.ts");
  const complianceContent = readText(cwd, "lib/compliance/content.ts");
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
    checkProductionDataReadiness(envExample),
    checkLegalApproval(complianceContent),
    checkProductionDeploymentApproval(),
  ];
  const hasFailures = checks.some((check) => check.status === "fail");
  const hasBlockers = checks.some((check) => check.status === "blocked");
  const hasWarnings = checks.some((check) => check.status === "warn");
  const status: LaunchReadinessStatus = hasFailures
    ? "fail"
    : hasBlockers
      ? "blocked"
      : hasWarnings
        ? "warn"
        : "pass";

  return {
    status,
    publicLaunchReady: status === "pass",
    generatedAt: now.toISOString(),
    checks,
  };
}

export function renderLaunchReadinessReport(report: LaunchReadinessReport) {
  return [
    "Production launch readiness",
    `Status: ${report.status}`,
    `Public launch ready: ${report.publicLaunchReady ? "yes" : "no"}`,
    `Generated at: ${report.generatedAt}`,
    ...report.checks.map(
      (check) =>
        `${check.status.toUpperCase()} ${check.id} — ${check.label}: ${
          check.detail
        }`,
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
    "法律与合规文案草案",
  ];
  const missing = requiredText.filter(
    (text) => !siteConfig.includes(text) && !complianceContent.includes(text),
  );

  return {
    id: "disclaimers",
    label: "Disclaimers visible",
    status: missing.length === 0 ? "pass" : "fail",
    detail:
      missing.length === 0
        ? "Sitewide short/full disclaimers and legal draft warning are present."
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
    status: missing.length === 0 ? "warn" : "fail",
    detail:
      missing.length === 0
        ? "Optional placeholders exist, but no real analytics/search console tokens are configured yet."
        : `Missing optional placeholders: ${missing.join(", ")}`,
  };
}

function checkProductionDataReadiness(
  envExample: string,
): LaunchReadinessCheck {
  const localFixtureDefault = /^LOCAL_DATA_MODE=fixture$/m.test(envExample);

  return {
    id: "production-data",
    label: "Production DB imported or launch fixture mode disabled",
    status: localFixtureDefault ? "blocked" : "pass",
    detail: localFixtureDefault
      ? "Public launch is blocked: production official-data import has not run and local fixture mode remains the documented default."
      : "Fixture mode is not the documented launch default.",
  };
}

function checkLegalApproval(complianceContent: string): LaunchReadinessCheck {
  return {
    id: "legal-approval",
    label: "Legal/compliance language approved for launch",
    status: complianceContent.includes("法律与合规文案草案")
      ? "blocked"
      : "pass",
    detail: complianceContent.includes("法律与合规文案草案")
      ? "Public launch is blocked until owner and qualified legal review approve legal/compliance pages."
      : "No legal draft marker found.",
  };
}

function checkProductionDeploymentApproval(): LaunchReadinessCheck {
  return {
    id: "deployment-approval",
    label: "Production deployment and DNS explicitly approved",
    status: "blocked",
    detail:
      "Public launch is blocked until the owner explicitly approves Vercel production deployment, domain connection, DNS, and public indexing.",
  };
}

function readJson<T>(cwd: string, filePath: string): T {
  return JSON.parse(readText(cwd, filePath)) as T;
}

function readText(cwd: string, filePath: string) {
  return readFileSync(join(cwd, filePath), "utf8");
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
