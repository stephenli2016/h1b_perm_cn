import { describe, expect, it } from "vitest";

import {
  buildH1BTransferChecklist,
  buildPermRestartTimeline,
} from "@/lib/career-decision-tools";

const forbiddenAdviceClaims =
  /这家公司一定|一定会获批|一定可以|保证获批|H-1B 成功率|绿卡成功率|你的 case/i;

describe("M21 career decision tools", () => {
  it("builds a generic H-1B transfer checklist without sensitive inputs", () => {
    const result = buildH1BTransferChecklist({
      companyDataFocus: "h1b",
      scenario: "cap-exempt-to-cap-subject",
      startTiming: "not-sure",
    });

    expect(result.reviewIntensity).toBe("attorney-review");
    expect(result.reviewLabelZh).toBe("建议律师逐项核对");
    expect(result.relatedLinks[0]?.href).toBe("/h1b");
    expect(Object.keys(result.input)).toEqual([
      "scenario",
      "startTiming",
      "companyDataFocus",
    ]);
    expect(result.privacyNoteZh).toContain("不要求输入");
    expect(
      result.checklistSections.some((section) =>
        section.items.some((item) => item.includes("cap registration")),
      ),
    ).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(forbiddenAdviceClaims);
  });

  it("builds a PERM restart timeline as relative process education", () => {
    const result = buildPermRestartTimeline({
      companyDataFocus: "perm",
      scenario: "new-employer",
      stage: "filed-pending",
    });

    expect(result.restartSignal).toBe("likely-restart");
    expect(result.restartLabelZh).toBe("通常需要重新规划 PERM");
    expect(result.relatedLinks[0]?.href).toBe("/perm");
    expect(result.summaryZh).toContain("不计算真实日期");
    expect(Object.keys(result.input)).toEqual([
      "scenario",
      "stage",
      "companyDataFocus",
    ]);
    expect(result.timelineSteps.map((step) => step.title)).toContain(
      "ETA-9089 / PERM filing",
    );
    expect(JSON.stringify(result)).not.toMatch(forbiddenAdviceClaims);
  });

  it("normalizes invalid options to conservative defaults", () => {
    const h1b = buildH1BTransferChecklist({
      companyDataFocus: "unknown" as never,
      scenario: "unknown" as never,
      startTiming: "unknown" as never,
    });
    const perm = buildPermRestartTimeline({
      companyDataFocus: "unknown" as never,
      scenario: "unknown" as never,
      stage: "unknown" as never,
    });

    expect(h1b.input).toEqual({
      companyDataFocus: "both",
      scenario: "standard-transfer",
      startTiming: "not-sure",
    });
    expect(perm.input).toEqual({
      companyDataFocus: "both",
      scenario: "new-employer",
      stage: "not-started",
    });
  });
});
