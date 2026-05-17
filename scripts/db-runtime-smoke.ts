type PostgresFixtureDataModule =
  typeof import("../lib/db/postgres-fixture-data");

async function main() {
  const { getDatabaseRuntimeStatus, loadPostgresFixtureData } =
    await loadPostgresFixtureDataModule();
  const args = process.argv.slice(2);
  const requirePostgres = args.includes("--require-postgres");
  const allowEmpty = args.includes("--allow-empty");
  const status = getDatabaseRuntimeStatus();

  if (status.mode === "fixture") {
    console.log("Database runtime smoke test");
    console.log("Status: skipped");
    console.log("Reason: LOCAL_DATA_MODE is fixture.");
    process.exitCode = requirePostgres ? 1 : 0;
    return;
  }

  if (!status.configured) {
    console.log("Database runtime smoke test");
    console.log("Status: fail");
    console.log(`Missing: ${(status.missing ?? []).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const data = await loadPostgresFixtureData({ forceRefresh: true });
  const counts = {
    employers: data.employers.length,
    aliases: data.employerAliases.length,
    locations: data.locations.length,
    sourceFiles: data.sourceFiles.length,
    h1bLcaRecords: data.h1bLcaRecords.length,
    permRecords: data.permRecords.length,
    pwdRecords: data.pwdRecords.length,
    uscisH1BEmployerRecords: data.uscisH1BEmployerRecords.length,
    visaBulletinMonths: data.visaBulletinMonths.length,
    visaBulletinDates: data.visaBulletinDates.length,
    companyPageMetrics: data.companyPageMetrics.length,
    guidePages: data.guidePages.length,
    recentEtlRuns: data.etlRuns.length,
  };
  const emptyCriticalTables =
    counts.employers === 0 ||
    counts.sourceFiles === 0 ||
    counts.visaBulletinMonths === 0;

  console.log("Database runtime smoke test");
  console.log(`Status: ${emptyCriticalTables ? "warn" : "pass"}`);
  console.log(`Mode: ${status.mode}`);
  console.log(`Host: ${status.host ?? "unknown"}`);
  console.log(JSON.stringify(counts, null, 2));

  process.exitCode = emptyCriticalTables && !allowEmpty ? 2 : 0;
}

async function loadPostgresFixtureDataModule(): Promise<PostgresFixtureDataModule> {
  const moduleUrl = new URL(
    "../lib/db/postgres-fixture-data.ts",
    import.meta.url,
  ).href;

  return (await import(moduleUrl)) as PostgresFixtureDataModule;
}

await main();
