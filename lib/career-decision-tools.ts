export type H1BTransferScenario =
  | "standard-transfer"
  | "near-expiry-or-gap"
  | "cap-exempt-to-cap-subject"
  | "material-change";

export type H1BTransferStartTiming =
  | "after-filing"
  | "after-approval"
  | "not-sure";

export type CompanyDataFocus = "h1b" | "perm" | "both";

export type H1BTransferChecklistInput = {
  scenario?: H1BTransferScenario;
  startTiming?: H1BTransferStartTiming;
  companyDataFocus?: CompanyDataFocus;
};

export type PermRestartScenario =
  | "new-employer"
  | "same-employer-new-role"
  | "same-employer-similar-role";

export type PermStage =
  | "not-started"
  | "pwd-or-recruitment"
  | "filed-pending"
  | "certified-or-i140";

export type PermRestartTimelineInput = {
  scenario?: PermRestartScenario;
  stage?: PermStage;
  companyDataFocus?: CompanyDataFocus;
};

export type ReviewIntensity = "standard" | "heightened" | "attorney-review";

export type CareerDecisionSource = {
  title: string;
  url: string;
};

export type CareerDecisionLink = {
  title: string;
  href: string;
  description: string;
  meta: string;
};

export type ChecklistSection = {
  title: string;
  description: string;
  items: readonly string[];
};

export type H1BTransferChecklistResult = {
  input: Required<H1BTransferChecklistInput>;
  labelZh: string;
  reviewIntensity: ReviewIntensity;
  reviewLabelZh: string;
  summaryZh: string;
  checklistSections: readonly ChecklistSection[];
  privacyNoteZh: string;
  interpretationNoteZh: string;
  relatedLinks: readonly CareerDecisionLink[];
  officialSources: readonly CareerDecisionSource[];
};

export type TimelineStep = {
  step: number;
  title: string;
  description: string;
  checkpoints: readonly string[];
};

export type PermRestartTimelineResult = {
  input: Required<PermRestartTimelineInput>;
  labelZh: string;
  restartSignal: "likely-restart" | "needs-review" | "background-only";
  restartLabelZh: string;
  summaryZh: string;
  timelineSteps: readonly TimelineStep[];
  privacyNoteZh: string;
  interpretationNoteZh: string;
  relatedLinks: readonly CareerDecisionLink[];
  officialSources: readonly CareerDecisionSource[];
};

export const h1bTransferScenarios = [
  {
    value: "standard-transfer",
    labelZh: "常规 H-1B 换雇主",
  },
  {
    value: "near-expiry-or-gap",
    labelZh: "身份/授权日期接近到期或有空档",
  },
  {
    value: "cap-exempt-to-cap-subject",
    labelZh: "免抽签雇主转需抽签雇主（cap-exempt → cap-subject）",
  },
  {
    value: "material-change",
    labelZh: "职位、地点或工作条件明显变化",
  },
] as const satisfies readonly {
  value: H1BTransferScenario;
  labelZh: string;
}[];

export const h1bTransferStartTimings = [
  {
    value: "after-filing",
    labelZh: "想在新申请正式提交后开始",
  },
  {
    value: "after-approval",
    labelZh: "想等批准（approval）后再开始",
  },
  {
    value: "not-sure",
    labelZh: "还不确定开始节点",
  },
] as const satisfies readonly {
  value: H1BTransferStartTiming;
  labelZh: string;
}[];

export const permRestartScenarios = [
  {
    value: "new-employer",
    labelZh: "跳到新雇主",
  },
  {
    value: "same-employer-new-role",
    labelZh: "同雇主但新职位/新地点",
  },
  {
    value: "same-employer-similar-role",
    labelZh: "同雇主且职位基本相似",
  },
] as const satisfies readonly {
  value: PermRestartScenario;
  labelZh: string;
}[];

export const permStages = [
  {
    value: "not-started",
    labelZh: "PERM 还没开始",
  },
  {
    value: "pwd-or-recruitment",
    labelZh: "通行工资或招聘步骤（PWD / recruitment）阶段",
  },
  {
    value: "filed-pending",
    labelZh: "ETA-9089 已提交等待中",
  },
  {
    value: "certified-or-i140",
    labelZh: "PERM 已认证或 I-140 阶段",
  },
] as const satisfies readonly {
  value: PermStage;
  labelZh: string;
}[];

export const companyDataFocusOptions = [
  {
    value: "both",
    labelZh: "同时查看 H-1B 与 PERM 数据",
  },
  {
    value: "h1b",
    labelZh: "优先查看 H-1B / LCA 数据",
  },
  {
    value: "perm",
    labelZh: "优先查看 PERM 数据",
  },
] as const satisfies readonly {
  value: CompanyDataFocus;
  labelZh: string;
}[];

export const h1bTransferOfficialSources: readonly CareerDecisionSource[] = [
  {
    title: "USCIS H-1B Specialty Occupations",
    url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations",
  },
  {
    title: "USCIS Form I-129",
    url: "https://www.uscis.gov/i-129",
  },
  {
    title: "DOL OFLC LCA / H-1B disclosure data",
    url: "https://www.dol.gov/agencies/eta/foreign-labor/performance",
  },
];

export const permRestartOfficialSources: readonly CareerDecisionSource[] = [
  {
    title: "DOL FLAG Permanent Labor Certification (PERM)",
    url: "https://flag.dol.gov/programs/perm",
  },
  {
    title: "DOL OFLC PERM disclosure data",
    url: "https://www.dol.gov/agencies/eta/foreign-labor/performance",
  },
  {
    title: "USCIS Green Card for Employment-Based Immigrants",
    url: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-employment-based-immigrants",
  },
];

export function buildH1BTransferChecklist(
  input: H1BTransferChecklistInput = {},
): H1BTransferChecklistResult {
  const normalized = normalizeH1BTransferInput(input);
  const scenario = scenarioLabel(h1bTransferScenarios, normalized.scenario);
  const reviewIntensity = h1bReviewIntensity(normalized);

  return {
    input: normalized,
    labelZh: scenario,
    reviewIntensity,
    reviewLabelZh: reviewIntensityLabelZh(reviewIntensity),
    summaryZh:
      "这个清单把 H-1B 换雇主常见核对点拆成雇主、申请、LCA/工作地点、开始节点和公开数据背景。它不收集你的身份日期、收据号、工资或雇主名称。",
    checklistSections: [
      buildH1BPetitionSection(normalized),
      buildH1BWorksiteSection(normalized),
      buildH1BStartTimingSection(normalized),
      buildH1BCompanyDataSection(normalized.companyDataFocus),
    ],
    privacyNoteZh:
      "本工具只使用通用场景选项，不要求输入 I-94、收据号（receipt number）、工资、护照、家庭成员或具体雇主名称。",
    interpretationNoteZh:
      "清单只用于准备和提问，不判断你是否可以开始工作、是否会获批，或是否满足任何个人身份要求。",
    relatedLinks: companyDataLinks(normalized.companyDataFocus),
    officialSources: h1bTransferOfficialSources,
  };
}

export function buildPermRestartTimeline(
  input: PermRestartTimelineInput = {},
): PermRestartTimelineResult {
  const normalized = normalizePermRestartInput(input);
  const restartSignal = permRestartSignal(normalized);
  const scenario = scenarioLabel(permRestartScenarios, normalized.scenario);

  return {
    input: normalized,
    labelZh: scenario,
    restartSignal,
    restartLabelZh: restartSignalLabelZh(restartSignal),
    summaryZh:
      "这个估算器只展示 PERM 相关流程节点的相对顺序，帮助你和雇主或律师沟通。它不计算真实日期，也不要求输入个人优先日（priority date）、收据号（receipt number）或身份信息。",
    timelineSteps: buildPermTimelineSteps(normalized),
    privacyNoteZh:
      "本工具只使用通用场景选项，不收集优先日（priority date）、I-140 收据号、工资、家庭信息、身份日期或具体雇主名称。",
    interpretationNoteZh:
      "PERM 是雇主和具体职位机会相关的劳工认证流程。此页面不判断现有 PERM 是否可继续使用，也不提供换工作法律建议。",
    relatedLinks: companyDataLinks(normalized.companyDataFocus),
    officialSources: permRestartOfficialSources,
  };
}

function normalizeH1BTransferInput(
  input: H1BTransferChecklistInput,
): Required<H1BTransferChecklistInput> {
  return {
    scenario: isKnownValue(h1bTransferScenarios, input.scenario)
      ? input.scenario
      : "standard-transfer",
    startTiming: isKnownValue(h1bTransferStartTimings, input.startTiming)
      ? input.startTiming
      : "not-sure",
    companyDataFocus: isKnownValue(
      companyDataFocusOptions,
      input.companyDataFocus,
    )
      ? input.companyDataFocus
      : "both",
  };
}

function normalizePermRestartInput(
  input: PermRestartTimelineInput,
): Required<PermRestartTimelineInput> {
  return {
    scenario: isKnownValue(permRestartScenarios, input.scenario)
      ? input.scenario
      : "new-employer",
    stage: isKnownValue(permStages, input.stage) ? input.stage : "not-started",
    companyDataFocus: isKnownValue(
      companyDataFocusOptions,
      input.companyDataFocus,
    )
      ? input.companyDataFocus
      : "both",
  };
}

function buildH1BPetitionSection(
  input: Required<H1BTransferChecklistInput>,
): ChecklistSection {
  const items = [
    "确认新雇主是否会由合适的申请雇主提交 Form I-129，而不是只停留在口头 offer。",
    "确认职位、SOC/职责、工资、工作地点和预计开始日期是否与申请 / LCA 材料一致。",
    "保留 offer、职位说明、提交确认、收据通知和批准通知的副本，供律师或 HR 核对。",
  ];

  if (input.scenario === "cap-exempt-to-cap-subject") {
    items.push(
      "如果从免抽签雇主（cap-exempt）转向需抽签雇主（cap-subject），把抽签注册、抽中结果和需抽签 H-1B 申请问题单独列出来。",
    );
  }

  return {
    title: "申请核对",
    description: "先确认新雇主和提交路径，而不是只看职位名称。",
    items,
  };
}

function buildH1BWorksiteSection(
  input: Required<H1BTransferChecklistInput>,
): ChecklistSection {
  const items = [
    "核对实际工作地点、远程/混合安排和 LCA 覆盖地点是否一致。",
    "核对工资口径是否不低于同类岗位工资或适用通行工资（prevailing wage）背景；这一步需要雇主/律师做正式判断。",
    "用公司页公开 LCA 样本看该雇主是否有类似职位和地点历史记录，但不要把历史记录当成承诺。",
  ];

  if (input.scenario === "material-change") {
    items.push(
      "如果职位职责、地点、工资或工作条件明显变化，把是否需要修正或新申请作为律师核对点。",
    );
  }

  return {
    title: "LCA / 工作地点 / 工资核对",
    description: "H-1B 换雇主不只是换公司名，也要看实际工作条件。",
    items,
  };
}

function buildH1BStartTimingSection(
  input: Required<H1BTransferChecklistInput>,
): ChecklistSection {
  const items = [
    "USCIS 公开说明中提到，符合 portability 条件的 H-1B worker 通常可在新雇主正式提交 non-frivolous Form I-129 后，或申请中的预计开始日期较晚者开始。",
    "把“已提交（filed）”“收到收据（receipt issued）”“已批准（approved）”三个节点分开问清楚；不同雇主政策可能更保守。",
    "不要仅凭口头说法决定开始日期；让雇主移民事务负责人或律师确认个人适用性。",
  ];

  if (input.startTiming === "after-approval") {
    items.push(
      "如果计划等批准后开始，确认工资单、离职通知期和旧雇主结束日期如何衔接。",
    );
  }
  if (input.scenario === "near-expiry-or-gap") {
    items.push(
      "如果 I-94、合法停留或就业授权日期接近结束，把宽限期、及时提交和离职日期作为高优先级问题。",
    );
  }

  return {
    title: "开始工作节点",
    description: "把官方规则、雇主政策和个人身份事实分开处理。",
    items,
  };
}

function buildH1BCompanyDataSection(focus: CompanyDataFocus): ChecklistSection {
  const focusText =
    focus === "h1b"
      ? "优先查看 H-1B/LCA 历史记录。"
      : focus === "perm"
        ? "如果换雇主同时影响绿卡规划，也查看 PERM 历史记录。"
        : "同时查看 H-1B/LCA 与 PERM 历史记录。";

  return {
    title: "公开数据背景",
    description: "公开数据可以帮助准备问题，但不能替代雇主政策或律师判断。",
    items: [
      focusText,
      "查看该公司近年 LCA 职位、工作地点和工资字段是否与你关心的岗位有可比背景。",
      "查看公司页的公开数据友好度信号，判断公开记录是否足够丰富；低样本时避免强结论。",
      "把公开数据当作面试和 HR 沟通前的准备材料，不当作是否接受 offer 的唯一依据。",
    ],
  };
}

function buildPermTimelineSteps(
  input: Required<PermRestartTimelineInput>,
): TimelineStep[] {
  const restartText =
    input.scenario === "new-employer"
      ? "新雇主通常需要围绕自己的永久职位机会（permanent job opportunity）重新评估 PERM 路径。"
      : input.scenario === "same-employer-new-role"
        ? "同雇主但职位或地点变化时，需要核对原 PERM 是否仍对应同一个永久职位机会。"
        : "职位基本相似时也应核对岗位职责、地点、工资和组织架构是否仍匹配。";

  return [
    {
      step: 1,
      title: "确认雇主与永久职位机会",
      description: restartText,
      checkpoints: [
        "确认担保雇主、职位名称、职责、地点和最低要求是否已稳定。",
        "把旧 PERM、旧职位和新职位差异整理成给律师的问题清单。",
      ],
    },
    {
      step: 2,
      title: "通行工资 / PWD 背景",
      description:
        "PERM 通常需要围绕职位和地区确认通行工资（prevailing wage）背景，正式判断由雇主和律师处理。",
      checkpoints: [
        "用公开 PWD / 工资工具做背景了解，不把它当作正式工资决定（wage determination）。",
        "如果岗位地点或职责变化明显，把工资和最低要求（minimum requirements）单独核对。",
      ],
    },
    {
      step: 3,
      title: "招聘步骤（recruitment）准备",
      description:
        "DOL PERM 流程关注是否有足够符合条件并可用的美国工人（able, willing, qualified, and available U.S. workers）。",
      checkpoints: [
        "确认招聘步骤、广告、岗位要求和时间线由雇主/律师统一管理。",
        "不要自行改写招聘材料或岗位要求；把问题交给雇主移民事务负责人。",
      ],
    },
    {
      step: 4,
      title: "ETA-9089 / PERM 申请",
      description:
        "PERM 申请是雇主提交给 DOL 的劳工认证申请，不等于 I-140 或绿卡批准。",
      checkpoints: [
        "确认是否已经提交、是否仍在等待、是否有审计（audit）或监督招聘（supervised recruitment）背景。",
        "如果准备跳槽，不要把等待中的 PERM 当作可自动转移的资产。",
      ],
    },
    {
      step: 5,
      title: "PERM 已认证后的后续节点",
      description:
        "PERM 已认证之后通常还涉及 I-140、优先日（priority date）、排期和身份路径等不同问题。",
      checkpoints: [
        input.stage === "certified-or-i140"
          ? "如果已有已认证 PERM 或 I-140，和律师核对优先日（priority date）、I-140 状态和新工作计划的关系。"
          : "如果尚未到 PERM 已认证阶段，把后续 I-140 和排期问题作为背景准备。",
        "用 Visa Bulletin 工具理解公开排期，不把它当作个人申请结论。",
      ],
    },
  ];
}

function h1bReviewIntensity(
  input: Required<H1BTransferChecklistInput>,
): ReviewIntensity {
  if (
    input.scenario === "near-expiry-or-gap" ||
    input.scenario === "cap-exempt-to-cap-subject"
  ) {
    return "attorney-review";
  }
  if (
    input.scenario === "material-change" ||
    input.startTiming === "not-sure"
  ) {
    return "heightened";
  }

  return "standard";
}

function permRestartSignal(
  input: Required<PermRestartTimelineInput>,
): PermRestartTimelineResult["restartSignal"] {
  if (input.scenario === "new-employer") {
    return "likely-restart";
  }
  if (
    input.scenario === "same-employer-new-role" ||
    input.stage === "certified-or-i140"
  ) {
    return "needs-review";
  }

  return "background-only";
}

function companyDataLinks(focus: CompanyDataFocus): CareerDecisionLink[] {
  const baseLinks: CareerDecisionLink[] = [
    {
      title: "公司目录",
      href: "/companies",
      description: "按雇主、职位、地点和状态查 H-1B/PERM 公开记录。",
      meta: "数据入口",
    },
    {
      title: "公开数据友好度信号",
      href: "/tools/company-immigration-score",
      description: "理解公司页信号分如何按公开数据维度生成。",
      meta: "方法",
    },
  ];
  const h1bLink: CareerDecisionLink = {
    title: "H-1B 公司数据库",
    href: "/h1b",
    description: "查看 LCA、USCIS Employer Data Hub 和 H-1B 背景信号。",
    meta: "H-1B",
  };
  const permLink: CareerDecisionLink = {
    title: "PERM / 绿卡公司数据库",
    href: "/perm",
    description: "查看 PERM disclosure records 和公司绿卡公开数据信号。",
    meta: "PERM",
  };

  if (focus === "h1b") {
    return [h1bLink, ...baseLinks, permLink];
  }
  if (focus === "perm") {
    return [permLink, ...baseLinks, h1bLink];
  }

  return [h1bLink, permLink, ...baseLinks];
}

function reviewIntensityLabelZh(value: ReviewIntensity) {
  const labels: Record<ReviewIntensity, string> = {
    standard: "标准核对",
    heightened: "重点核对",
    "attorney-review": "建议律师逐项核对",
  };

  return labels[value];
}

function restartSignalLabelZh(
  value: PermRestartTimelineResult["restartSignal"],
) {
  const labels: Record<PermRestartTimelineResult["restartSignal"], string> = {
    "likely-restart": "通常需要重新规划 PERM",
    "needs-review": "需要逐项核对是否重启",
    "background-only": "先做背景核对",
  };

  return labels[value];
}

function scenarioLabel<
  Option extends {
    value: string;
    labelZh: string;
  },
>(options: readonly Option[], value: Option["value"]) {
  return options.find((option) => option.value === value)?.labelZh ?? value;
}

function isKnownValue<
  Option extends {
    value: string;
  },
>(
  options: readonly Option[],
  value: string | undefined,
): value is Option["value"] {
  return Boolean(value && options.some((option) => option.value === value));
}
