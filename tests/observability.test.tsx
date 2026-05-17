import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  getObservabilityScriptDescriptors,
  ObservabilityScripts,
} from "@/components/observability/observability-scripts";
import {
  getPublicObservabilityConfig,
  hasAnyObservabilityEnabled,
} from "@/lib/observability/config";
import { buildRootMetadata } from "@/lib/observability/root-metadata";

describe("M25 observability placeholders", () => {
  it("keeps analytics and monitoring disabled without optional keys", () => {
    const config = getPublicObservabilityConfig({});
    const html = renderToStaticMarkup(<ObservabilityScripts config={config} />);

    expect(config.analytics.enabledProviders).toEqual([]);
    expect(config.monitoring.enabled).toBe(false);
    expect(hasAnyObservabilityEnabled(config)).toBe(false);
    expect(html).not.toContain("googletagmanager");
    expect(html).not.toContain("plausible");
    expect(config.ownerActions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("NEXT_PUBLIC_GA_MEASUREMENT_ID"),
        expect.stringContaining("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"),
        expect.stringContaining("NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT"),
      ]),
    );
  });

  it("enables GA4, Plausible, webmaster verification, and monitoring placeholders from env", () => {
    const config = getPublicObservabilityConfig({
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC12345",
      NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "visaradar.example",
      NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: "google-token_12345",
      NEXT_PUBLIC_BING_SITE_VERIFICATION: "bing-token_12345",
      NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT: "https://monitor.example/events",
      NEXT_PUBLIC_ERROR_MONITORING_ENVIRONMENT: "preview",
      NEXT_PUBLIC_RELEASE_SHA: "abc123",
    });
    const metadata = buildRootMetadata(config);
    const descriptors = getObservabilityScriptDescriptors(config);

    expect(config.analytics.enabledProviders).toEqual(["ga4", "plausible"]);
    expect(config.monitoring).toMatchObject({
      enabled: true,
      endpoint: "https://monitor.example/events",
      environment: "preview",
      release: "abc123",
    });
    expect(metadata.verification?.google).toBe("google-token_12345");
    expect(metadata.verification?.other).toEqual({
      "msvalidate.01": "bing-token_12345",
    });
    expect(descriptors.ga4?.src).toContain("googletagmanager.com/gtag/js");
    expect(descriptors.ga4?.inline).toContain("G-ABC12345");
    expect(descriptors.plausible).toEqual({
      domain: "visaradar.example",
      src: "https://plausible.io/js/script.js",
    });
  });

  it("rejects malformed public observability values instead of rendering unsafe scripts", () => {
    const config = getPublicObservabilityConfig({
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "bad<script>",
      NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "https://example.com/path",
      NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC: "http://plausible.example/script.js",
      NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: "<bad>",
      NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT: "http://evil.example/events",
    });
    const html = renderToStaticMarkup(<ObservabilityScripts config={config} />);

    expect(config.analytics.enabledProviders).toEqual([]);
    expect(config.monitoring.enabled).toBe(false);
    expect(config.warnings.length).toBeGreaterThanOrEqual(3);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("evil.example");
  });

  it("documents optional M25 keys in .env.example", () => {
    const envExample = readFileSync(".env.example", "utf8");
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(envExample).toContain("NEXT_PUBLIC_GA_MEASUREMENT_ID=");
    expect(envExample).toContain("NEXT_PUBLIC_PLAUSIBLE_DOMAIN=");
    expect(envExample).toContain("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=");
    expect(envExample).toContain("NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT=");
    expect(packageJson.scripts["seo:audit"]).toContain("scripts/seo-audit.ts");
    expect(packageJson.scripts["data:freshness"]).toContain(
      "scripts/data-freshness.ts",
    );
  });
});
