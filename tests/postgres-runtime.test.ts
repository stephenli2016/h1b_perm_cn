import { describe, expect, it } from "vitest";

import {
  getDatabaseRuntimeStatus,
  getRuntimeDataMode,
  normalizeDatabaseUrlForPg,
} from "@/lib/db/postgres-fixture-data";

describe("Postgres runtime database mode", () => {
  it("keeps fixture mode as the default", () => {
    expect(getRuntimeDataMode({})).toBe("fixture");
    expect(getDatabaseRuntimeStatus({ LOCAL_DATA_MODE: "fixture" })).toEqual({
      mode: "fixture",
      configured: true,
    });
  });

  it("detects production database modes without exposing credentials", () => {
    const status = getDatabaseRuntimeStatus({
      LOCAL_DATA_MODE: "supabase",
      DATABASE_URL:
        "postgresql://postgres.secret:super-secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    });

    expect(getRuntimeDataMode({ LOCAL_DATA_MODE: "database" })).toBe(
      "postgres",
    );
    expect(status).toMatchObject({
      mode: "postgres",
      configured: true,
      host: "aws-0-us-east-1.pooler.supabase.com",
    });
    expect(JSON.stringify(status)).not.toContain("super-secret");
  });

  it("flags missing DATABASE_URL when database mode is enabled", () => {
    expect(getDatabaseRuntimeStatus({ LOCAL_DATA_MODE: "postgres" })).toEqual({
      mode: "postgres",
      configured: false,
      missing: ["DATABASE_URL"],
    });
  });

  it("normalizes Supabase pooler URLs for node-postgres SSL handling", () => {
    expect(
      normalizeDatabaseUrlForPg(
        "postgresql://postgres.ref:secret@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require",
      ),
    ).toBe(
      "postgresql://postgres.ref:secret@aws-1-us-east-1.pooler.supabase.com:5432/postgres",
    );
  });
});
