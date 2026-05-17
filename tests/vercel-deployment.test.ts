import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { buildRootMetadata } from "@/lib/observability/root-metadata";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import {
  isPrelaunchNoindexEnabled,
  prelaunchNoindexRobots,
} from "@/lib/seo/prelaunch";
import {
  listSitemapEntries,
  listSitemapIndexEntries,
} from "@/lib/seo/sitemaps";
import { buildVercelPrepValidationReport } from "@/scripts/validate-vercel-prep";

type VercelConfig = {
  $schema?: string;
  framework?: string;
  installCommand?: string;
  buildCommand?: string;
  env?: Record<string, string>;
  build?: {
    env?: Record<string, string>;
  };
  headers?: Array<{
    headers?: Array<{
      key?: string;
      value?: string;
    }>;
  }>;
};

describe("M27 Vercel deployment preparation", () => {
  it("keeps Vercel configuration explicit without committing env values", () => {
    const config = JSON.parse(
      readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
    ) as VercelConfig;
    const headerKeys = new Set(
      (config.headers ?? [])
        .flatMap((rule) => rule.headers ?? [])
        .map((header) => header.key?.toLowerCase())
        .filter((key): key is string => Boolean(key)),
    );

    expect(config.$schema).toBe("https://openapi.vercel.sh/vercel.json");
    expect(config.framework).toBe("nextjs");
    expect(config.installCommand).toBe("pnpm install --frozen-lockfile");
    expect(config.buildCommand).toBe("pnpm build");
    expect(config.env).toBeUndefined();
    expect(config.build?.env).toBeUndefined();
    expect([...headerKeys]).toEqual(
      expect.arrayContaining([
        "x-content-type-options",
        "referrer-policy",
        "x-frame-options",
        "permissions-policy",
      ]),
    );
  });

  it("documents deployment env placeholders and owner-gated DNS work", () => {
    const envExample = readFileSync(
      join(process.cwd(), ".env.example"),
      "utf8",
    );
    const doc = readFileSync(
      join(process.cwd(), "docs/VERCEL_DEPLOYMENT_M27.md"),
      "utf8",
    );

    expect(envExample).toContain("PRELAUNCH_NOINDEX=false");
    expect(doc).toContain("Environment Variable Checklist");
    expect(doc).toContain("PRELAUNCH_NOINDEX=true");
    expect(doc).toContain("Domain And DNS Checklist");
    expect(doc).toContain("owner approval");
  });

  it("supports a prelaunch noindex mode for private Vercel testing", () => {
    expect(isPrelaunchNoindexEnabled({ PRELAUNCH_NOINDEX: "true" })).toBe(true);
    expect(isPrelaunchNoindexEnabled({ PRELAUNCH_NOINDEX: "1" })).toBe(true);
    expect(isPrelaunchNoindexEnabled({ PRELAUNCH_NOINDEX: "false" })).toBe(
      false,
    );

    withEnv("PRELAUNCH_NOINDEX", "true", () => {
      const metadata = buildSeoMetadata({
        title: "测试页面",
        description: "测试描述",
        path: "/guides/test",
      });
      const rootMetadata = buildRootMetadata();

      expect(metadata.robots).toEqual(prelaunchNoindexRobots);
      expect(rootMetadata.robots).toEqual(prelaunchNoindexRobots);
      expect(robots().rules).toEqual([{ userAgent: "*", disallow: "/" }]);
      expect(listSitemapEntries("tools")).toEqual([]);
      expect(listSitemapIndexEntries()).toEqual([]);
    });
  });

  it("keeps normal indexability behavior when prelaunch mode is off", () => {
    withEnv("PRELAUNCH_NOINDEX", "false", () => {
      const metadata = buildSeoMetadata({
        title: "测试页面",
        description: "测试描述",
        path: "/guides/test",
      });

      expect(metadata.robots).toMatchObject({ index: true, follow: true });
      expect(robots().rules).toEqual([{ userAgent: "*", allow: "/" }]);
      expect(listSitemapEntries("tools").length).toBeGreaterThan(0);
      expect(listSitemapIndexEntries().length).toBeGreaterThan(0);
    });
  });

  it("passes the Vercel deployment preparation validator", () => {
    const report = buildVercelPrepValidationReport();

    expect(report.status).toBe("pass");
    expect(report.checks.filter((check) => !check.passed)).toEqual([]);
  });
});

function withEnv(
  name: string,
  value: string | undefined,
  callback: () => void,
) {
  const previous = process.env[name];

  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }

  try {
    callback();
  } finally {
    if (previous === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = previous;
    }
  }
}
