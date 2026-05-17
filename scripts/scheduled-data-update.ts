import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type DataFreshnessModule = typeof import("./data-freshness");

type SourceManifest = {
  updated_at?: string;
  sources?: SourceEntry[];
};

type SourceEntry = {
  id: string;
  source_name: string;
  official_url: string;
  fiscal_year?: number | null;
  quarter?: string | null;
  downloaded_path?: string | null;
  fixture_path?: string | null;
  required?: boolean;
};

type CheckStatus = "pass" | "warn" | "fail";

export type ScheduledDataUpdateCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
};

export type ScheduledDataUpdateReport = {
  status: CheckStatus;
  generatedAt: string;
  dryRun: boolean;
  networkChecks: boolean;
  autoPublish: false;
  anomalyCount: number;
  checks: ScheduledDataUpdateCheck[];
};

const allowedOfficialHosts = new Set([
  "download.bls.gov",
  "www.dol.gov",
  "flag.dol.gov",
  "www.uscis.gov",
  "travel.state.gov",
]);

const sourceManifestPath = "data/source_manifest.json";

export async function buildScheduledDataUpdateReport({
  cwd = process.cwd(),
  dryRun = true,
  networkChecks = false,
  now = new Date(process.env.SCHEDULED_UPDATE_NOW ?? Date.now()),
}: {
  cwd?: string;
  dryRun?: boolean;
  networkChecks?: boolean;
  now?: Date;
} = {}): Promise<ScheduledDataUpdateReport> {
  const { buildDataFreshnessReport } = await loadDataFreshnessModule();
  const manifest = JSON.parse(
    readFileSync(resolve(cwd, sourceManifestPath), "utf8"),
  ) as SourceManifest;
  const sources = manifest.sources ?? [];
  const freshness = buildDataFreshnessReport({ cwd, now });
  const checks: ScheduledDataUpdateCheck[] = [
    {
      id: "manifest",
      label: "Source manifest and fixture coverage",
      status: freshness.status === "fail" ? "fail" : "pass",
      detail:
        freshness.status === "fail"
          ? `Missing required fixtures: ${freshness.missingRequiredFixtures.join(
              ", ",
            )}`
          : `${freshness.requiredFixtureCount}/${freshness.requiredSourceCount} required sources have local fixture coverage.`,
    },
    checkOfficialHosts(sources),
    checkOflcDisclosureCoverage(sources, now),
    checkVisaBulletinCoverage(sources, now),
    checkUscisFilingChartCoverage(sources),
    checkProductionDownloadGaps(freshness.missingDownloadedFiles),
    checkNoAutoPublish(dryRun),
    checkNotificationPlaceholder(),
  ];

  if (networkChecks) {
    checks.push(await checkOfficialUrlsReachable(sources));
  } else {
    checks.push({
      id: "network-probes",
      label: "Official URL reachability",
      status: "pass",
      detail:
        "Skipped in local dry-run. The GitHub Actions workflow enables network probes and stores the report as an artifact.",
    });
  }

  const status = checks.some((check) => check.status === "fail")
    ? "fail"
    : checks.some((check) => check.status === "warn")
      ? "warn"
      : "pass";

  return {
    status,
    generatedAt: now.toISOString(),
    dryRun,
    networkChecks,
    autoPublish: false,
    anomalyCount: checks.filter((check) => check.status !== "pass").length,
    checks,
  };
}

async function loadDataFreshnessModule(): Promise<DataFreshnessModule> {
  const moduleUrl = new URL("./data-freshness.ts", import.meta.url).href;

  return (await import(moduleUrl)) as DataFreshnessModule;
}

export function renderScheduledDataUpdateReport(
  report: ScheduledDataUpdateReport,
) {
  return [
    "# Scheduled Data Update Dry Run",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    `Dry run: ${report.dryRun ? "yes" : "no"}`,
    `Network probes: ${report.networkChecks ? "enabled" : "disabled"}`,
    `Auto publish: ${report.autoPublish ? "yes" : "no"}`,
    `Anomalies flagged: ${report.anomalyCount}`,
    "",
    "| Check | Status | Detail |",
    "| --- | --- | --- |",
    ...report.checks.map(
      (check) =>
        `| ${escapeMarkdown(check.label)} | ${check.status} | ${escapeMarkdown(
          check.detail,
        )} |`,
    ),
    "",
    "## Automation Policy",
    "",
    "- This job never commits, deploys, imports production data, or changes sitemap/indexing state.",
    "- Warnings flag data gaps that need review; failures stop the workflow.",
    "- Suspicious data changes must be reviewed in a later milestone before publishing.",
  ].join("\n");
}

function checkOfficialHosts(
  sources: readonly SourceEntry[],
): ScheduledDataUpdateCheck {
  const disallowed = sources.filter(
    (source) => !allowedOfficialHosts.has(new URL(source.official_url).host),
  );

  return {
    id: "official-hosts",
    label: "Official-source host allowlist",
    status: disallowed.length === 0 ? "pass" : "fail",
    detail:
      disallowed.length === 0
        ? `${sources.length} source URLs use approved official hosts.`
        : `Disallowed hosts: ${disallowed
            .map((source) => `${source.id} -> ${source.official_url}`)
            .join(", ")}`,
  };
}

function checkOflcDisclosureCoverage(
  sources: readonly SourceEntry[],
  now: Date,
): ScheduledDataUpdateCheck {
  const oflcSources = sources.filter((source) =>
    /DOL OFLC (LCA|PERM|Prevailing Wage) Disclosure Data/i.test(
      source.source_name,
    ),
  );
  const latest = latestFiscalQuarter(oflcSources);
  const current = currentFiscalContext(now);

  if (!latest) {
    return {
      id: "oflc-disclosures",
      label: "DOL OFLC disclosure release coverage",
      status: "fail",
      detail: "No DOL OFLC disclosure sources are present in the manifest.",
    };
  }

  const lag = fiscalQuarterDistance(current, latest);
  const status: CheckStatus =
    latest.fiscalYear < current.fiscalYear || lag > 1 ? "warn" : "pass";

  return {
    id: "oflc-disclosures",
    label: "DOL OFLC disclosure release coverage",
    status,
    detail: `Latest manifest coverage is FY${latest.fiscalYear} ${latest.quarter}; current fiscal context is FY${current.fiscalYear} Q${current.quarter}. One-quarter lag is acceptable for dry-run monitoring.`,
  };
}

function checkVisaBulletinCoverage(
  sources: readonly SourceEntry[],
  now: Date,
): ScheduledDataUpdateCheck {
  const latest = latestMonthFromIds(
    sources,
    /^dos_visa_bulletin_(\d{4})_(\d{2})$/,
  );
  const currentMonth = monthKey(now);

  if (!latest) {
    return {
      id: "visa-bulletin",
      label: "Visa Bulletin monthly update coverage",
      status: "fail",
      detail: "No Visa Bulletin sources are present in the manifest.",
    };
  }

  return {
    id: "visa-bulletin",
    label: "Visa Bulletin monthly update coverage",
    status: latest.localeCompare(currentMonth) >= 0 ? "pass" : "warn",
    detail: `Latest Visa Bulletin fixture is ${latest}; current calendar month is ${currentMonth}.`,
  };
}

function checkUscisFilingChartCoverage(
  sources: readonly SourceEntry[],
): ScheduledDataUpdateCheck {
  const latestVisaBulletin = latestMonthFromIds(
    sources,
    /^dos_visa_bulletin_(\d{4})_(\d{2})$/,
  );
  const latestFilingChart = latestMonthFromIds(
    sources,
    /^uscis_filing_chart_(\d{4})_(\d{2})$/,
  );

  if (!latestVisaBulletin || !latestFilingChart) {
    return {
      id: "uscis-filing-chart",
      label: "USCIS filing chart coverage",
      status: "fail",
      detail: "Visa Bulletin or USCIS filing chart sources are missing.",
    };
  }

  return {
    id: "uscis-filing-chart",
    label: "USCIS filing chart coverage",
    status:
      latestFilingChart.localeCompare(latestVisaBulletin) >= 0
        ? "pass"
        : "warn",
    detail: `Latest USCIS filing chart fixture is ${latestFilingChart}; latest Visa Bulletin fixture is ${latestVisaBulletin}.`,
  };
}

function checkProductionDownloadGaps(
  missingDownloadedFiles: readonly string[],
): ScheduledDataUpdateCheck {
  return {
    id: "production-downloads",
    label: "Production download inventory",
    status: missingDownloadedFiles.length > 0 ? "warn" : "pass",
    detail:
      missingDownloadedFiles.length > 0
        ? `${missingDownloadedFiles.length} production download files are absent locally. This is expected before production import, but it remains flagged.`
        : "All manifest production download paths exist locally.",
  };
}

function checkNoAutoPublish(dryRun: boolean): ScheduledDataUpdateCheck {
  return {
    id: "auto-publish",
    label: "No automatic publishing",
    status: dryRun ? "pass" : "fail",
    detail: dryRun
      ? "Dry-run mode is active; the automation only reports and does not write production data."
      : "Dry-run mode is disabled, which is not allowed for M29.",
  };
}

function checkNotificationPlaceholder(): ScheduledDataUpdateCheck {
  return {
    id: "notification-placeholder",
    label: "Failure notification placeholder",
    status: "pass",
    detail:
      "GitHub Actions emits a failure notice. A real Slack/email webhook can be added later when the owner provides a destination secret.",
  };
}

async function checkOfficialUrlsReachable(
  sources: readonly SourceEntry[],
): Promise<ScheduledDataUpdateCheck> {
  const uniqueUrls = [...new Set(sources.map((source) => source.official_url))];
  const results = await Promise.all(
    uniqueUrls.map(async (url) => {
      try {
        const response = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(12_000),
        });

        if (response.ok || response.status === 405 || response.status === 403) {
          return { ok: true, url, status: response.status };
        }

        return { ok: false, url, status: response.status };
      } catch (error) {
        return {
          ok: false,
          url,
          status: error instanceof Error ? error.message : "unknown error",
        };
      }
    }),
  );
  const failed = results.filter((result) => !result.ok);

  return {
    id: "network-probes",
    label: "Official URL reachability",
    status: failed.length === 0 ? "pass" : "warn",
    detail:
      failed.length === 0
        ? `${results.length} official URL probe(s) responded.`
        : `${failed.length}/${results.length} official URL probe(s) need review: ${failed
            .map((result) => `${result.url} (${result.status})`)
            .join("; ")}`,
  };
}

function latestFiscalQuarter(sources: readonly SourceEntry[]) {
  const values = sources
    .map((source) => {
      const quarter = parseQuarter(source.quarter);

      if (!source.fiscal_year || !quarter) {
        return null;
      }

      return {
        fiscalYear: source.fiscal_year,
        quarter,
        sortKey: source.fiscal_year * 10 + quarter,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .sort((left, right) => left.sortKey - right.sortKey);

  return values.at(-1) ?? null;
}

function currentFiscalContext(now: Date) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const fiscalYear = month >= 10 ? year + 1 : year;
  const quarter = month >= 10 ? 1 : month <= 3 ? 2 : month <= 6 ? 3 : 4;

  return {
    fiscalYear,
    quarter,
  };
}

function fiscalQuarterDistance(
  current: { fiscalYear: number; quarter: number },
  latest: { fiscalYear: number; quarter: number },
) {
  return (
    (current.fiscalYear - latest.fiscalYear) * 4 +
    (current.quarter - latest.quarter)
  );
}

function latestMonthFromIds(sources: readonly SourceEntry[], pattern: RegExp) {
  return sources
    .map((source) => source.id.match(pattern))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => `${match[1]}-${match[2]}`)
    .sort()
    .at(-1);
}

function monthKey(now: Date) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function parseQuarter(value: string | null | undefined) {
  const match = value?.match(/^Q([1-4])$/i);

  return match ? Number(match[1]) : null;
}

function escapeMarkdown(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

async function main() {
  const args = process.argv.slice(2);
  const outputFlagIndex = args.indexOf("--output");
  const outputPath = outputFlagIndex >= 0 ? args[outputFlagIndex + 1] : null;
  const wantsJson = args.includes("--json");
  const networkChecks = args.includes("--network");
  const githubSummary = args.includes("--github-summary");
  const dryRun = args.includes("--dry-run") || !args.includes("--apply");
  const report = await buildScheduledDataUpdateReport({
    dryRun,
    networkChecks,
  });
  const rendered = wantsJson
    ? JSON.stringify(report, null, 2)
    : renderScheduledDataUpdateReport(report);

  console.log(rendered);

  if (outputPath) {
    const absoluteOutputPath = resolve(process.cwd(), outputPath);
    mkdirSync(dirname(absoluteOutputPath), { recursive: true });
    writeFileSync(absoluteOutputPath, `${rendered}\n`);
  }

  if (githubSummary && process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${rendered}\n`, {
      flag: "a",
    });
  }

  process.exitCode = report.status === "fail" ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
