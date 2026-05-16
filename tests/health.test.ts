import { describe, expect, it } from "vitest";

import { GET } from "@/app/health/route";
import { siteConfig } from "@/lib/site";

describe("health route", () => {
  it("returns the service identity", async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      service: siteConfig.name,
      chineseName: siteConfig.chineseName,
    });
  });
});

describe("site config", () => {
  it("keeps the required Chinese disclaimer available", () => {
    expect(siteConfig.fullDisclaimer).toContain(
      "不构成法律、移民、税务、职业或财务建议",
    );
  });
});
