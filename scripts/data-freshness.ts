import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

type SourceManifest = {
  updated_at?: string;
  sources?: SourceEntry[];
};

type SourceEntry = {
  id: string;
  source_name: string;
  fiscal_year?: number | null;
  quarter?: string | null;
  fixture_path?: string | null;
  downloaded_path?: string | null;
  required?: boolean;
};

export type DataFreshnessReport = {
  status: "pass" | "warn" | "fail";
  manifestPath: string;
  manifestUpdatedAt: string | null;
  manifestAgeDays: number | null;
  sourceCount: number;
  requiredSourceCount: number;
  requiredFixtureCount: number;
  missingRequiredFixtures: string[];
  missingOptionalFixtures: string[];
  missingDownloadedFiles: string[];
  latestFiscalYear: number | null;
  latestVisaBulletinMonth: string | null;
  warnings: string[];
};

export function buildDataFreshnessReport({
  cwd = process.cwd(),
  manifestPath = "data/source_manifest.json",
  now = new Date(process.env.DATA_FRESHNESS_NOW ?? Date.now()),
}: {
  cwd?: string;
  manifestPath?: string;
  now?: Date;
} = {}): DataFreshnessReport {
  const absoluteManifestPath = resolve(cwd, manifestPath);
  const manifest = JSON.parse(
    readFileSync(absoluteManifestPath, "utf8"),
  ) as SourceManifest;
  const sources = manifest.sources ?? [];
  const missingRequiredFixtures = listMissingFixtures(cwd, sources, true);
  const missingOptionalFixtures = listMissingFixtures(cwd, sources, false);
  const missingDownloadedFiles = sources
    .filter((source) => source.downloaded_path)
    .filter((source) => !existsSync(resolve(cwd, source.downloaded_path!)))
    .map((source) => source.id);
  const manifestAgeDays = manifest.updated_at
    ? daysBetween(new Date(`${manifest.updated_at}T00:00:00Z`), now)
    : null;
  const latestFiscalYear = latestNumber(
    sources
      .map((source) => source.fiscal_year)
      .filter((year): year is number => typeof year === "number"),
  );
  const latestVisaBulletinMonth = latestVisaMonth(sources);
  const warnings = [
    manifestAgeDays !== null && manifestAgeDays > 45
      ? `Manifest updated ${manifestAgeDays} days ago; refresh official-source inventory before launch.`
      : undefined,
    missingOptionalFixtures.length > 0
      ? `${missingOptionalFixtures.length} optional fixture file(s) are missing.`
      : undefined,
    missingDownloadedFiles.length > 0
      ? `${missingDownloadedFiles.length} downloaded production file(s) are absent in local fixture mode.`
      : undefined,
  ].filter((warning): warning is string => Boolean(warning));
  const status = missingRequiredFixtures.length > 0 ? "fail" : "pass";

  return {
    status,
    manifestPath: relative(cwd, absoluteManifestPath),
    manifestUpdatedAt: manifest.updated_at ?? null,
    manifestAgeDays,
    sourceCount: sources.length,
    requiredSourceCount: sources.filter((source) => source.required).length,
    requiredFixtureCount: sources.filter(
      (source) => source.required && source.fixture_path,
    ).length,
    missingRequiredFixtures,
    missingOptionalFixtures,
    missingDownloadedFiles,
    latestFiscalYear,
    latestVisaBulletinMonth,
    warnings,
  };
}

export function renderDataFreshnessReport(report: DataFreshnessReport) {
  return [
    "Data freshness report",
    `Status: ${report.status}`,
    `Manifest: ${report.manifestPath}`,
    `Manifest updated: ${report.manifestUpdatedAt ?? "unknown"}`,
    `Manifest age days: ${report.manifestAgeDays ?? "unknown"}`,
    `Sources: ${report.sourceCount}`,
    `Required sources: ${report.requiredSourceCount}`,
    `Required fixtures present: ${
      report.requiredFixtureCount - report.missingRequiredFixtures.length
    }/${report.requiredFixtureCount}`,
    `Latest fiscal year: ${report.latestFiscalYear ?? "unknown"}`,
    `Latest Visa Bulletin fixture: ${
      report.latestVisaBulletinMonth ?? "unknown"
    }`,
    `Missing required fixtures: ${
      report.missingRequiredFixtures.length > 0
        ? report.missingRequiredFixtures.join(", ")
        : "none"
    }`,
    `Warnings: ${
      report.warnings.length > 0 ? report.warnings.join(" | ") : "none"
    }`,
  ].join("\n");
}

function listMissingFixtures(
  cwd: string,
  sources: SourceEntry[],
  required: boolean,
) {
  return sources
    .filter((source) => Boolean(source.fixture_path))
    .filter((source) => Boolean(source.required) === required)
    .filter((source) => !existsSync(resolve(cwd, source.fixture_path!)))
    .map((source) => source.id);
}

function daysBetween(start: Date, end: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay),
  );
}

function latestNumber(values: readonly number[]) {
  return values.length > 0 ? Math.max(...values) : null;
}

function latestVisaMonth(sources: readonly SourceEntry[]) {
  const months = sources
    .map((source) => source.id.match(/^dos_visa_bulletin_(\d{4})_(\d{2})$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => `${match[1]}-${match[2]}`)
    .sort();

  return months.at(-1) ?? null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildDataFreshnessReport();
  const wantsJson = process.argv.includes("--json");
  console.log(
    wantsJson
      ? JSON.stringify(report, null, 2)
      : renderDataFreshnessReport(report),
  );
  process.exitCode = report.status === "fail" ? 1 : 0;
}
