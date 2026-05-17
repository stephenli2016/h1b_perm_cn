import { describe, expect, it } from "vitest";

import {
  calculateCompanyImmigrationSignal,
  COMPANY_IMMIGRATION_SIGNAL_DIMENSIONS,
} from "@/lib/company-immigration-signals";
import { createPublicQueryRepository } from "@/lib/db/public-query-repository";
import { getLocalFixtureData } from "@/lib/db/local-repository";

describe("company immigration public-data signals", () => {
  it("builds transparent dimensions without legal outcome claims", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.getCompanyProfileBySlug({
      slug: "brightline-health",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    expect(result.data.immigrationSignal).toMatchObject({
      labelZh: "公开数据友好度信号",
      maxScore: 100,
      band: "visible_activity",
      lowSample: {
        flagged: false,
      },
      methodologyHref: "/tools/company-immigration-score",
    });
    expect(
      result.data.immigrationSignal.dimensions.map((row) => row.key),
    ).toEqual(COMPANY_IMMIGRATION_SIGNAL_DIMENSIONS.map((row) => row.key));
    expect(result.data.immigrationSignal.dimensions).toHaveLength(6);
    expect(result.data.immigrationSignal.interpretationNoteZh).toContain(
      "不是 H-1B、PERM、I-140、I-485 或绿卡结果的获批概率",
    );
    expect(result.data.immigrationSignal.dimensions[1]?.evidenceZh).toContain(
      "近 5 年 PERM 记录：3 条",
    );
  });

  it("flags low-sample company signals and caps the visible score", () => {
    const repo = createPublicQueryRepository({ cacheEnabled: false });
    const result = repo.getCompanyProfileBySlug({
      slug: "cedar-fintech-labs",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.messageZh);
    }

    expect(result.data.immigrationSignal.lowSample).toMatchObject({
      flagged: true,
    });
    expect(result.data.immigrationSignal.band).toBe("low_sample");
    expect(result.data.immigrationSignal.score).toBeLessThanOrEqual(45);
    expect(result.data.immigrationSignal.lowSample.messageZh).toContain(
      "样本太少",
    );
  });

  it("can score directly from official-source fixture record families", () => {
    const data = getLocalFixtureData();
    const employer = data.employers.find(
      (candidate) => candidate.slug === "acme-analytics",
    );

    expect(employer).toBeDefined();
    const signal = calculateCompanyImmigrationSignal({
      employer: employer!,
      h1bRecords: data.h1bLcaRecords.filter(
        (record) => record.employerId === employer!.id,
      ),
      permRecords: data.permRecords.filter(
        (record) => record.employerId === employer!.id,
      ),
      uscisRecords: data.uscisH1BEmployerRecords.filter(
        (record) => record.employerId === employer!.id,
      ),
      pwdRecords: data.pwdRecords,
      aliases: data.employerAliases.filter(
        (alias) => alias.employerId === employer!.id,
      ),
      sourceNames: [
        "DOL OFLC LCA / H-1B disclosure data",
        "DOL OFLC PERM disclosure data",
        "USCIS H-1B Employer Data Hub",
      ],
      latestDataDate: "2025-09-30",
      currentFiscalYear: 2025,
    });

    expect(signal.score).toBeGreaterThan(55);
    expect(signal.lowSample.flagged).toBe(false);
    expect(
      signal.dimensions.find((row) => row.key === "wage_context"),
    ).toMatchObject({
      level: "strong",
    });
  });
});
