import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getPreviewProtectionConfig,
  isPreviewProtectionAuthorized,
} from "@/lib/security/preview-protection";
import { shouldGenerateCompanyStaticParams } from "@/lib/seo/company-static-generation";
import { buildVercelPreviewValidationReport } from "@/scripts/validate-vercel-preview";

describe("M32 Vercel Supabase preview", () => {
  it("documents required private preview environment placeholders", () => {
    const envExample = readFileSync(
      join(process.cwd(), ".env.example"),
      "utf8",
    );
    const doc = readFileSync(
      join(process.cwd(), "docs/VERCEL_PREVIEW_M32.md"),
      "utf8",
    );

    expect(envExample).toContain("PREVIEW_PROTECTION_ENABLED=false");
    expect(envExample).toContain("PREVIEW_PROTECTION_PASSWORD=");
    expect(doc).toContain("LOCAL_DATA_MODE=postgres");
    expect(doc).toContain("PRELAUNCH_NOINDEX=true");
    expect(doc).toContain("PRERENDER_COMPANY_PAGES=false");
    expect(doc).toContain("Do not promote");
  });

  it("fails closed when preview protection is enabled without a password", () => {
    expect(
      isPreviewProtectionAuthorized({
        authorizationHeader: undefined,
        env: {
          PREVIEW_PROTECTION_ENABLED: "true",
        },
      }),
    ).toBe(false);
  });

  it("accepts only matching Basic Auth credentials when enabled", () => {
    const env = {
      PREVIEW_PROTECTION_ENABLED: "true",
      PREVIEW_PROTECTION_USERNAME: "owner",
      PREVIEW_PROTECTION_PASSWORD: "secret-preview-password",
    };
    const validHeader = `Basic ${btoa("owner:secret-preview-password")}`;
    const invalidHeader = `Basic ${btoa("owner:wrong")}`;

    expect(
      isPreviewProtectionAuthorized({
        authorizationHeader: validHeader,
        env,
      }),
    ).toBe(true);
    expect(
      isPreviewProtectionAuthorized({
        authorizationHeader: invalidHeader,
        env,
      }),
    ).toBe(false);
  });

  it("stays disabled by default for local development", () => {
    const config = getPreviewProtectionConfig({});

    expect(config.enabled).toBe(false);
    expect(
      isPreviewProtectionAuthorized({
        authorizationHeader: undefined,
        env: {},
      }),
    ).toBe(true);
  });

  it("keeps company pages dynamic in Supabase-backed preview builds", () => {
    expect(
      shouldGenerateCompanyStaticParams({
        LOCAL_DATA_MODE: "postgres",
        PRERENDER_COMPANY_PAGES: "false",
      }),
    ).toBe(false);
    expect(
      shouldGenerateCompanyStaticParams({
        LOCAL_DATA_MODE: "fixture",
      }),
    ).toBe(true);
    expect(
      shouldGenerateCompanyStaticParams({
        LOCAL_DATA_MODE: "postgres",
        PRERENDER_COMPANY_PAGES: "true",
      }),
    ).toBe(true);
  });

  it("passes the M32 preview validator", () => {
    const report = buildVercelPreviewValidationReport();

    expect(report.status).toBe("pass");
    expect(report.checks.filter((check) => !check.passed)).toEqual([]);
  });
});
