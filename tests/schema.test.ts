import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vitest";

import {
  migrationFiles,
  requiredIndexNames,
  requiredTableNames,
} from "@/lib/db/schema";

function loadMigrationSql() {
  return migrationFiles
    .map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"))
    .join("\n");
}

function createInMemoryDatabase() {
  const db = new DatabaseSync(":memory:");
  db.exec(loadMigrationSql());
  return db;
}

describe("database schema migration", () => {
  it("creates every M03 table", () => {
    const db = createInMemoryDatabase();
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    const tableNames = rows.map((row) => row.name);

    expect(tableNames).toEqual(expect.arrayContaining([...requiredTableNames]));

    db.close();
  });

  it("creates required lookup indexes", () => {
    const db = createInMemoryDatabase();
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all() as Array<{ name: string }>;
    const indexNames = rows.map((row) => row.name);

    expect(indexNames).toEqual(expect.arrayContaining([...requiredIndexNames]));

    db.close();
  });

  it("is safe to apply more than once", () => {
    const db = new DatabaseSync(":memory:");
    const migrationSql = loadMigrationSql();

    db.exec(migrationSql);
    db.exec(migrationSql);

    const employerCount = db
      .prepare("SELECT COUNT(*) as count FROM employers")
      .get() as { count: number };

    expect(employerCount.count).toBe(0);

    db.close();
  });
});
