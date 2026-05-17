import { describe, expect, it } from "vitest";

import {
  buildDataFreshnessReport,
  renderDataFreshnessReport,
} from "@/scripts/data-freshness";

describe("M25 data freshness CLI report", () => {
  it("summarizes local official-source fixture freshness", () => {
    const report = buildDataFreshnessReport({
      now: new Date("2026-05-17T00:00:00Z"),
    });
    const rendered = renderDataFreshnessReport(report);

    expect(report).toMatchObject({
      status: "pass",
      manifestUpdatedAt: "2026-05-17",
      manifestAgeDays: 0,
      sourceCount: 42,
      requiredSourceCount: 40,
      latestFiscalYear: 2026,
      latestVisaBulletinMonth: "2026-06",
      missingRequiredFixtures: [],
    });
    expect(rendered).toContain("Data freshness report");
    expect(rendered).toContain("Required fixtures present: 40/40");
  });
});
