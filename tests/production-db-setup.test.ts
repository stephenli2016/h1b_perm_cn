import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  productionMigrationFiles,
  requiredProductionIndexNames,
  requiredProductionTableNames,
} from "@/lib/db/schema";
import { buildProductionDatabaseValidationReport } from "@/scripts/validate-production-db";

function loadProductionMigrationSql() {
  return productionMigrationFiles
    .map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"))
    .join("\n");
}

describe("production database setup", () => {
  it("keeps a Postgres migration for every normalized table", () => {
    const sql = loadProductionMigrationSql();

    for (const table of requiredProductionTableNames) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\s*\\(`,
          "i",
        ),
      );
    }
  });

  it("keeps required lookup indexes in the Postgres migration", () => {
    const sql = loadProductionMigrationSql();

    for (const index of requiredProductionIndexNames) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+index\\s+if\\s+not\\s+exists\\s+${index}\\s+on\\s+public\\.`,
          "i",
        ),
      );
    }
  });

  it("enables RLS without opening direct public table access", () => {
    const sql = loadProductionMigrationSql();

    for (const table of requiredProductionTableNames) {
      expect(sql).toMatch(
        new RegExp(
          `alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`,
          "i",
        ),
      );
    }

    expect(sql).not.toMatch(
      /\bgrant\s+[^;]*\bon\s+(all\s+tables\s+in\s+schema\s+public|table\s+public\.[a-z_]+|public\.[a-z_]+)\s+to\s+(anon|authenticated)\b/i,
    );
    expect(sql).not.toMatch(
      /\bcreate\s+policy\b[\s\S]*?\bto\s+(anon|authenticated)\b/i,
    );
  });

  it("documents placeholder database env vars without exposing service role", () => {
    const envExample = readFileSync(
      join(process.cwd(), ".env.example"),
      "utf8",
    );

    expect(envExample).toContain("DATABASE_URL=");
    expect(envExample).toContain("SUPABASE_URL=");
    expect(envExample).toContain("SUPABASE_ANON_KEY=");
    expect(envExample).toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(envExample).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
    expect(envExample).toContain(
      "SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key-server-only",
    );
  });

  it("passes the production database validation script", () => {
    const report = buildProductionDatabaseValidationReport();

    expect(report.status).toBe("pass");
    expect(report.checks.filter((check) => !check.passed)).toEqual([]);
  });

  it("exposes a package command for production DB validation", () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts["db:production:validate"]).toBe(
      "node --no-warnings --experimental-strip-types scripts/validate-production-db.ts",
    );
  });
});
