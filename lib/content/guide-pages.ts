export type ContentKind = "tool" | "guide";

export type ContentCategory =
  | "核心工具"
  | "H-1B 数据解释"
  | "Prevailing Wage 和薪资"
  | "PERM 和绿卡"
  | "排期与中国 backlog"
  | "求职与公司判断";

export type ContentPriority = 1 | 2 | 3;

export type OfficialSourceId =
  | "dolForeignLabor"
  | "dolPerformance"
  | "dolWages"
  | "flagWageData"
  | "flagWageSearch"
  | "flagPerm"
  | "uscisH1B"
  | "uscisI129"
  | "uscisEmployerHub"
  | "uscisEmployerHubFiles"
  | "uscisStemOpt"
  | "uscisOpt"
  | "uscisGracePeriod"
  | "uscisEmploymentGreenCard"
  | "uscisI140"
  | "dosVisaBulletin"
  | "uscisFilingChart";

export type OfficialSource = {
  id: OfficialSourceId;
  title: string;
  url: string;
};

export type ContentPage = {
  order: number;
  path: string;
  slug: string;
  kind: ContentKind;
  category: ContentCategory;
  priority: ContentPriority;
  title: string;
  metaDescription: string;
  eyebrow: string;
  summary: string;
  sourceContext: string;
  checklistTitle: string;
  checklist: readonly string[];
  exampleTitle: string;
  example: string;
  mistakes: readonly string[];
  relatedPaths: readonly string[];
  sourceIds: readonly OfficialSourceId[];
  lastReviewed: string;
};

export const officialContentSources = {
  dolForeignLabor: {
    id: "dolForeignLabor",
    title: "DOL OFLC Foreign Labor Certification",
    url: "https://www.dol.gov/agencies/eta/foreign-labor",
  },
  dolPerformance: {
    id: "dolPerformance",
    title: "DOL OFLC Performance Data",
    url: "https://www.dol.gov/agencies/eta/foreign-labor/performance",
  },
  dolWages: {
    id: "dolWages",
    title: "DOL Foreign Labor Wages",
    url: "https://www.dol.gov/agencies/eta/foreign-labor/wages",
  },
  flagWageData: {
    id: "flagWageData",
    title: "FLAG Wage Data",
    url: "https://flag.dol.gov/wage-data",
  },
  flagWageSearch: {
    id: "flagWageSearch",
    title: "FLAG Wage Search",
    url: "https://flag.dol.gov/wage-data/wage-search",
  },
  flagPerm: {
    id: "flagPerm",
    title: "FLAG Permanent Labor Certification (PERM)",
    url: "https://flag.dol.gov/programs/perm",
  },
  uscisH1B: {
    id: "uscisH1B",
    title: "USCIS H-1B Specialty Occupations",
    url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations",
  },
  uscisI129: {
    id: "uscisI129",
    title: "USCIS Form I-129",
    url: "https://www.uscis.gov/i-129",
  },
  uscisEmployerHub: {
    id: "uscisEmployerHub",
    title: "USCIS H-1B Employer Data Hub",
    url: "https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub",
  },
  uscisEmployerHubFiles: {
    id: "uscisEmployerHubFiles",
    title: "USCIS H-1B Employer Data Hub Files",
    url: "https://www.uscis.gov/archive/h-1b-employer-data-hub-files",
  },
  uscisStemOpt: {
    id: "uscisStemOpt",
    title: "USCIS STEM OPT",
    url: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-extension-for-stem-students-stem-opt",
  },
  uscisOpt: {
    id: "uscisOpt",
    title: "USCIS Optional Practical Training",
    url: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students",
  },
  uscisGracePeriod: {
    id: "uscisGracePeriod",
    title: "USCIS Options for Nonimmigrant Workers Following Termination",
    url: "https://www.uscis.gov/working-in-the-united-states/information-for-employers-and-employees/options-for-nonimmigrant-workers-following-termination-of-employment",
  },
  uscisEmploymentGreenCard: {
    id: "uscisEmploymentGreenCard",
    title: "USCIS Green Card for Employment-Based Immigrants",
    url: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-employment-based-immigrants",
  },
  uscisI140: {
    id: "uscisI140",
    title: "USCIS Form I-140",
    url: "https://www.uscis.gov/i-140",
  },
  dosVisaBulletin: {
    id: "dosVisaBulletin",
    title: "U.S. Department of State Visa Bulletin",
    url: "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html",
  },
  uscisFilingChart: {
    id: "uscisFilingChart",
    title: "USCIS Adjustment of Status Filing Charts",
    url: "https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin",
  },
} as const satisfies Record<OfficialSourceId, OfficialSource>;

const lastReviewed = "2026-05-16";

export const explicitToolContentPaths = new Set([
  "/tools/h1b-wage-level-checker",
  "/tools/eb2-eb3-china-priority-date-calculator",
  "/tools/h1b-transfer-risk-checklist",
  "/tools/perm-restart-timeline-estimator",
  "/tools/company-immigration-score",
]);

export const contentPages = [
  page({
    order: 1,
    path: "/tools/h1b-company-sponsor-checker",
    kind: "tool",
    category: "核心工具",
    priority: 1,
    title: "H-1B 公司 Sponsor 记录查询工具",
    metaDescription:
      "用中文理解雇主 H-1B LCA 和 USCIS Employer Data Hub 公开记录，区分 sponsor 信号、历史样本和不能推断的结论。",
    summary:
      "这页适合在投递或面试前做背景调查：先看公司是否有近期 LCA、USCIS employer-level H-1B 记录，再看职位、地点和年份是否接近。公开记录只能说明过去公开流程中出现过，不代表当前岗位或个人个案。",
    sourceContext:
      "DOL OFLC LCA disclosure data 展示劳工条件申请记录；USCIS Employer Data Hub 展示雇主层面的 H-1B petition 决定数据。两个来源节点不同，必须分开理解。",
    checklistTitle: "查公司时的四步",
    checklist: [
      "先用雇主英文 legal name 和常见别名查公开记录。",
      "看最近 3-5 个 fiscal years 是否有连续或重复记录。",
      "把 job title、SOC、worksite city/state 和工资字段一起看。",
      "低样本时只记录问题清单，不做强判断。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果某公司有多条 Software Engineer LCA，地点集中在 WA 和 CA，可以把它作为“有类似公开历史”的信号，再向 recruiter 询问当前岗位是否由同一 entity sponsor。",
    mistakes: [
      "把 certified LCA 当作 H-1B petition approved。",
      "只看公司总记录数，不看岗位和地点是否接近。",
      "把历史记录理解成未来承诺。",
    ],
    relatedPaths: ["/h1b", "/companies", "/tools/company-immigration-score"],
    sourceIds: ["dolPerformance", "uscisEmployerHub", "uscisH1B"],
  }),
  page({
    order: 2,
    path: "/tools/perm-green-card-company-checker",
    kind: "tool",
    category: "核心工具",
    priority: 1,
    title: "公司 PERM / 绿卡记录查询工具",
    metaDescription:
      "查看公司 PERM disclosure data 的雇主、职位、地点和状态信号，理解它与 I-140、排期和绿卡结果的边界。",
    summary:
      "PERM 公开记录适合用来观察公司是否有职业移民劳工认证历史。它能帮助你准备面试问题，但不能替代公司政策、律师评估或个人排期判断。",
    sourceContext:
      "DOL FLAG 和 OFLC performance data 是 PERM 官方来源；USCIS employment-based green card 页面用于理解 PERM 之后仍有 I-140、排期和身份路径等后续节点。",
    checklistTitle: "查 PERM 记录时看什么",
    checklist: [
      "先确认 employer name 是否和 offer entity 一致。",
      "看 certified、denied、withdrawn 等状态的近年分布。",
      "关注 job title、worksite、minimum requirements 和工资字段。",
      "结合公司页低样本提示，避免从一两条记录推出政策结论。",
    ],
    exampleTitle: "示例读法",
    example:
      "一家公司近年有多条同类工程岗位 certified PERM，可作为绿卡流程经验的公开信号；下一步仍应问 HR 绿卡启动时间、岗位要求和律师流程。",
    mistakes: [
      "把 PERM certified 当作绿卡已经获批。",
      "忽略换雇主或换岗位时 PERM 与具体 job opportunity 的关系。",
      "只看总数，不看年份和职位变化。",
    ],
    relatedPaths: [
      "/perm",
      "/companies",
      "/tools/perm-restart-timeline-estimator",
    ],
    sourceIds: ["flagPerm", "dolPerformance", "uscisEmploymentGreenCard"],
  }),
  page({
    order: 3,
    path: "/tools/h1b-wage-level-checker",
    kind: "tool",
    category: "核心工具",
    priority: 1,
    title: "H-1B 工资 Level 中文判断工具",
    metaDescription:
      "按 SOC、worksite、offered wage 和年份对照 DOL/FLAG prevailing wage level，理解公开工资数据能说明什么。",
    summary:
      "工资 level 工具用于把 offered wage 放到公开 prevailing wage 背景里看。它适合做 offer 沟通准备，但正式 LCA 和 wage 判断还要看雇主、律师、SOC、职责、经验要求和地点。",
    sourceContext:
      "DOL/FLAG wage data 提供职业和地区工资背景；DOL OFLC LCA disclosure data 可用于观察历史 H-1B 工资样本。",
    checklistTitle: "使用工资 level 工具",
    checklist: [
      "先确认 SOC code 或英文职位关键词。",
      "使用实际 worksite，而不是只看公司总部。",
      "选择对应 wage year，并留意 fixture 与生产数据日期。",
      "把结果当作沟通材料，不当作法律合规结论。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果 Bellevue 的 Software Developer 年薪落在 Level 2 和 Level 3 之间，可以记录为工资背景位置，再确认岗位职责和 LCA 口径是否匹配。",
    mistakes: [
      "认为高于某个 level 就完成所有 H-1B 工资判断。",
      "把州级匹配和 metro 匹配看成同等精度。",
      "用不同年份或不同 SOC 的工资表直接比较。",
    ],
    relatedPaths: [
      "/tools/prevailing-wage-lookup",
      "/h1b",
      "/guides/wage-level-1-2-3-4-explained",
    ],
    sourceIds: ["flagWageData", "flagWageSearch", "dolPerformance"],
  }),
  page({
    order: 4,
    path: "/tools/prevailing-wage-lookup",
    kind: "tool",
    category: "核心工具",
    priority: 2,
    title: "Prevailing Wage 中文查询入口",
    metaDescription:
      "用中文理解 FLAG Wage Search 和 prevailing wage 数据下载，按职业、地区和年份做工资背景查询。",
    summary:
      "Prevailing wage 查询入口帮助你找到官方 wage search 与数据下载的位置，并提醒你工资判断离不开 SOC、地区、职责和经验要求。它不是正式 wage determination。",
    sourceContext:
      "FLAG Wage Search 是官方 wage 查询入口；DOL wage 页面解释外劳认证流程中的工资来源和数据口径。",
    checklistTitle: "查询前准备",
    checklist: [
      "准备英文职位描述和可能的 SOC 代码。",
      "确认 worksite city、state 和 remote/hybrid 安排。",
      "选择正确 wage year 或 effective period。",
      "保存 source URL 和查询条件，便于和雇主核对。",
    ],
    exampleTitle: "示例读法",
    example:
      "同样是 Data Analyst，在 San Jose 和 Raleigh 可能对应不同地区工资背景；查询时要把地点和 SOC 一起固定。",
    mistakes: [
      "只用中文职位名查询，忽略 SOC。",
      "把 wage search 结果当作正式 PWD。",
      "用总部地点替代实际工作地点。",
    ],
    relatedPaths: [
      "/tools/h1b-wage-level-checker",
      "/guides/prevailing-wage-explained",
      "/guides/h1b-wage-location-effect",
    ],
    sourceIds: ["flagWageSearch", "flagWageData", "dolWages"],
  }),
  page({
    order: 5,
    path: "/tools/eb2-eb3-china-priority-date-calculator",
    kind: "tool",
    category: "核心工具",
    priority: 1,
    title: "中国 EB-2 / EB-3 排期计算器",
    metaDescription:
      "输入职业移民类别、priority date、Visa Bulletin 月份和 chart type，对照中国大陆出生 EB 排期公开信息。",
    summary:
      "排期计算器只解释 priority date 和官方表格日期之间的关系。它不能决定个人 I-485、签证或身份路径，尤其要同时核对 USCIS 当月使用哪张 filing chart。",
    sourceContext:
      "Department of State Visa Bulletin 发布每月排期；USCIS filing chart 页面说明当月调整身份是否可用 Dates for Filing。",
    checklistTitle: "排期对照步骤",
    checklist: [
      "选择 EB-1、EB-2 或 EB-3 等类别。",
      "确认 chargeability area 是否为中国大陆出生。",
      "选择 Final Action 或 Dates for Filing。",
      "再查看 USCIS 当月 filing chart 选择。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果 EB-2 China Dates for Filing 晚于你的 priority date，表格关系可能显示排期已到；实际提交仍要看 USCIS 当月 chart 和个人情况。",
    mistakes: [
      "只看 Visa Bulletin，不看 USCIS filing chart。",
      "把排期已到理解成个人申请会被接受或批准。",
      "混淆 Final Action Date 和 Dates for Filing。",
    ],
    relatedPaths: [
      "/visa-bulletin",
      "/guides/final-action-date-vs-dates-for-filing",
      "/guides/eb2-china-priority-date",
    ],
    sourceIds: ["dosVisaBulletin", "uscisFilingChart"],
  }),
  page({
    order: 6,
    path: "/tools/h1b-transfer-risk-checklist",
    kind: "tool",
    category: "核心工具",
    priority: 2,
    title: "H-1B Transfer 风险清单",
    metaDescription:
      "用通用场景核对 H-1B 换雇主前需要问 HR、律师和新雇主 immigration team 的问题。",
    summary:
      "H-1B transfer 清单帮助你把新雇主 filing、LCA/worksite、开始日期和公开公司数据分开核对。页面不收集身份日期、receipt number 或工资。",
    sourceContext:
      "USCIS H-1B 和 Form I-129 页面提供 petition 背景；DOL LCA 数据用于公司公开历史背景。",
    checklistTitle: "换雇主核对点",
    checklist: [
      "确认 petitioning employer 和 Form I-129 filing 计划。",
      "核对职位、worksite、工资和 requested start date。",
      "区分 filed、receipt issued、approved 和公司内部政策。",
      "用公司 H-1B/PERM 数据准备问题，而不是替代律师判断。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果新岗位地点和职责都变了，应把 amended/new petition、LCA 覆盖和开始日期作为单独问题交给雇主 immigration team。",
    mistakes: [
      "只凭口头 offer 判断开始时间。",
      "忽略 remote 或 hybrid worksite 对 LCA 的影响。",
      "把公司历史记录当作当前 filing 承诺。",
    ],
    relatedPaths: [
      "/h1b",
      "/tools/company-immigration-score",
      "/tools/perm-restart-timeline-estimator",
    ],
    sourceIds: ["uscisH1B", "uscisI129", "dolPerformance"],
  }),
  page({
    order: 7,
    path: "/tools/perm-restart-timeline-estimator",
    kind: "tool",
    category: "核心工具",
    priority: 2,
    title: "跳槽后 PERM 重办时间线估算器",
    metaDescription:
      "用教育性场景理解跳槽、换职位或换地点后 PERM 可能涉及的重新规划节点。",
    summary:
      "PERM 重启时间线展示雇主、职位机会、PWD、recruitment、ETA-9089 和 I-140 后续节点的相对顺序，不计算个人日期，也不判断旧 PERM 是否可继续使用。",
    sourceContext:
      "DOL FLAG PERM 页面和 OFLC disclosure data 用于理解 PERM 流程与公开记录；USCIS employment-based green card 页面用于后续节点背景。",
    checklistTitle: "重启时间线怎么读",
    checklist: [
      "先确认新雇主和 permanent job opportunity。",
      "比较旧职位和新职位的职责、地点、工资与最低要求。",
      "把 PWD、recruitment 和 ETA-9089 filing 拆开问。",
      "已有 I-140 时单独核对 priority date 和工作计划关系。",
    ],
    exampleTitle: "示例读法",
    example:
      "跳到新雇主时，通常要围绕新雇主的岗位重新规划 PERM；如果仍在同雇主换组，也要核对原岗位机会是否仍一致。",
    mistakes: [
      "把 pending PERM 当作可自动转移。",
      "把 PERM certified 当作绿卡完成。",
      "只看时间，不看 job opportunity 是否变化。",
    ],
    relatedPaths: [
      "/perm",
      "/guides/change-job-during-perm",
      "/tools/eb2-eb3-china-priority-date-calculator",
    ],
    sourceIds: ["flagPerm", "dolPerformance", "uscisEmploymentGreenCard"],
  }),
  page({
    order: 8,
    path: "/tools/opt-to-h1b-timeline",
    kind: "tool",
    category: "核心工具",
    priority: 2,
    title: "OPT 到 H-1B 时间线规划器",
    metaDescription:
      "用中文梳理 F-1 OPT、STEM OPT、H-1B cap season 和雇主准备问题的非个案时间线。",
    summary:
      "这页帮助 OPT/STEM OPT 用户把求职、雇主注册、H-1B petition、cap-gap 和工作授权问题拆成沟通清单。它不收集 SEVIS、EAD 或身份日期。",
    sourceContext:
      "USCIS OPT/STEM OPT 页面解释学生就业授权背景；USCIS H-1B 页面用于理解 H-1B specialty occupation 和雇主 petition 节点。",
    checklistTitle: "规划时间线",
    checklist: [
      "确认当前 OPT 或 STEM OPT 类型和雇主资格背景。",
      "询问雇主是否参与 H-1B cap registration。",
      "记录 offer、start date、EAD 到期和可能的 cap-gap 问题。",
      "把身份节点交给 DSO、雇主和律师核对。",
    ],
    exampleTitle: "示例读法",
    example:
      "STEM OPT 第二年找工作时，可以优先确认雇主 E-Verify、training plan 和 H-1B 抽签安排，再看公司公开 H-1B 历史。",
    mistakes: [
      "把 offer start date 当作身份授权结论。",
      "忽略 STEM OPT 对雇主和 training plan 的要求。",
      "等到 cap season 结束后才问 sponsor 流程。",
    ],
    relatedPaths: [
      "/tools/stem-opt-employer-checklist",
      "/h1b",
      "/guides/questions-to-ask-recruiter-about-h1b-green-card",
    ],
    sourceIds: ["uscisOpt", "uscisStemOpt", "uscisH1B"],
  }),
  page({
    order: 9,
    path: "/tools/stem-opt-employer-checklist",
    kind: "tool",
    category: "核心工具",
    priority: 2,
    title: "STEM OPT 雇主检查清单",
    metaDescription:
      "面向 STEM OPT 求职者的雇主检查清单，覆盖 E-Verify、training plan、H-1B 规划和公开数据背景。",
    summary:
      "STEM OPT 不只是延长工作时间，还涉及雇主资格、training plan 和后续 H-1B 规划。清单帮助你准备 recruiter 和 HR 问题，不判断个人资格。",
    sourceContext:
      "USCIS STEM OPT 和 OPT 页面提供学生就业授权背景；DOL/USCIS H-1B 来源用于后续雇主 sponsor 数据解释。",
    checklistTitle: "面试前可以问",
    checklist: [
      "雇主是否熟悉 STEM OPT training plan 和报告义务。",
      "岗位职责是否和专业训练目标一致。",
      "公司是否参与 H-1B cap registration 和 petition。",
      "公开 H-1B/PERM 记录是否有类似岗位背景。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果雇主有 STEM OPT 员工但没有 H-1B 历史，求职者仍应问清 cap season 支持和外部律师安排。",
    mistakes: [
      "只问是否 sponsor，不问 STEM OPT 操作能力。",
      "忽略岗位职责和专业训练关系。",
      "把过去 H-1B 记录当作当前政策。",
    ],
    relatedPaths: [
      "/tools/opt-to-h1b-timeline",
      "/h1b",
      "/tools/h1b-company-sponsor-checker",
    ],
    sourceIds: ["uscisStemOpt", "uscisOpt", "uscisH1B"],
  }),
  page({
    order: 10,
    path: "/tools/company-immigration-score",
    kind: "tool",
    category: "核心工具",
    priority: 1,
    title: "公司职业移民友好度信号评分",
    metaDescription:
      "解释公司公开数据友好度信号如何按 H-1B、PERM、跨年记录、来源、职位地点和工资上下文生成。",
    summary:
      "这个信号只衡量公开数据是否足够丰富、连续和可解释，帮助求职者做背景研究。它不是 sponsor 成功率、雇主承诺或法律判断。",
    sourceContext:
      "信号维度来自 DOL LCA、PERM、prevailing wage 和 USCIS Employer Data Hub 等官方公开来源，各来源流程节点不同。",
    checklistTitle: "读分数时看证据",
    checklist: [
      "先看低样本提示，再看综合信号。",
      "分开看 H-1B、PERM、年份连续性和职位地点多样性。",
      "查看证据文字，不只看总分。",
      "把分数用于排序研究优先级，而不是替代面试问题。",
    ],
    exampleTitle: "示例读法",
    example:
      "某公司 PERM 记录丰富但 H-1B 记录少，可能更适合问绿卡流程经验，而不是直接推断 H-1B 支持程度。",
    mistakes: [
      "把公开数据友好度读成审批概率。",
      "忽略低样本公司信号上限。",
      "把不同来源的数字直接相加后做结论。",
    ],
    relatedPaths: ["/companies", "/h1b", "/perm"],
    sourceIds: ["dolPerformance", "flagWageData", "uscisEmployerHub"],
  }),
  page({
    order: 11,
    path: "/tools/wage-negotiation-with-h1b-data",
    kind: "tool",
    category: "核心工具",
    priority: 2,
    title: "用 H-1B 数据做谈薪参考",
    metaDescription:
      "学习如何把 H-1B LCA 工资样本和 prevailing wage 背景用于谈薪准备，同时避免误读公开记录。",
    summary:
      "H-1B 工资数据可以帮助你理解同类职位和地区的公开历史样本。谈薪时应把它作为市场背景之一，而不是证明雇主必须给某个数额。",
    sourceContext:
      "DOL OFLC LCA data 展示历史 offered wage 和 worksite；FLAG wage data 展示职业地区工资背景，两者都需要结合岗位职责解释。",
    checklistTitle: "谈薪前准备",
    checklist: [
      "筛选同 SOC、同地区、近年记录。",
      "区分 base wage、wage unit 和年化换算。",
      "准备公开数据截图或链接，但避免把样本当作要求。",
      "同时看公司内部级别、地点和岗位职责。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果同公司同地区近年 LCA 样本多集中在某个区间，可以把它作为“公开样本区间”提出，而不是说公司必须匹配该数字。",
    mistakes: [
      "把 H-1B LCA wage 当作员工真实总包。",
      "混用 hourly、yearly 和不同 fiscal year 数据。",
      "忽略职位级别和职责差异。",
    ],
    relatedPaths: [
      "/tools/h1b-wage-level-checker",
      "/guides/h1b-salary-negotiation",
      "/guides/h1b-salary-vs-prevailing-wage",
    ],
    sourceIds: ["dolPerformance", "flagWageData", "dolWages"],
  }),
  page({
    order: 12,
    path: "/tools/visa-bulletin-alert",
    kind: "tool",
    category: "核心工具",
    priority: 2,
    title: "Visa Bulletin 排期提醒/解释页",
    metaDescription:
      "用中文理解每月 Visa Bulletin 更新、USCIS filing chart 选择和中国 EB 类别排期变化的提醒口径。",
    summary:
      "排期提醒页目前提供本地解释和后续提醒功能占位。它帮助用户知道每月应看哪两类官方页面，不预测未来排期。",
    sourceContext:
      "Department of State 发布 Visa Bulletin；USCIS 单独公布调整身份当月使用 Final Action Date 还是 Dates for Filing。",
    checklistTitle: "每月更新时看",
    checklist: [
      "确认 Visa Bulletin 月份和 employment-based category。",
      "查看中国大陆出生 EB-1、EB-2、EB-3 两张表。",
      "再查看 USCIS 当月 filing chart 选择。",
      "记录变化，不把单月移动当作长期趋势。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果 EB-3 China Dates for Filing 前进，仍要等 USCIS 确认该月是否允许使用 Dates for Filing。",
    mistakes: [
      "只订阅 Visa Bulletin，不看 USCIS chart。",
      "根据一个月变化预测未来。",
      "混淆 China mainland-born 和其他 chargeability areas。",
    ],
    relatedPaths: [
      "/visa-bulletin",
      "/tools/eb2-eb3-china-priority-date-calculator",
      "/guides/visa-bulletin-explained-chinese",
    ],
    sourceIds: ["dosVisaBulletin", "uscisFilingChart"],
  }),
  page({
    order: 13,
    path: "/guides/what-is-lca-chinese",
    kind: "guide",
    category: "H-1B 数据解释",
    priority: 1,
    title: "LCA 是什么？为什么不等于 H-1B 批准",
    metaDescription:
      "用中文解释 Labor Condition Application (LCA) 在 H-1B 流程中的位置，以及为什么 certified LCA 不是 petition 批准。",
    summary:
      "LCA 是雇主在 H-1B petition 前后使用的劳工条件申请记录，关注工资、工作地点和劳动条件等信息。它是重要公开信号，但不是 USCIS 对 H-1B petition 的批准记录。",
    sourceContext:
      "DOL OFLC performance data 提供 LCA disclosure records；USCIS H-1B 页面说明 petition 仍由 USCIS 审理。",
    checklistTitle: "读 LCA 的基本顺序",
    checklist: [
      "先看 case status 和 fiscal year。",
      "再看 employer、job title、SOC、worksite 和 wage。",
      "与 USCIS Employer Data Hub 分开理解。",
      "只用作公开数据背景，不推断个人入职。",
    ],
    exampleTitle: "示例读法",
    example:
      "一条 certified LCA 说明 DOL 层面的 LCA 记录通过了，但还不能说明对应 H-1B petition 已由 USCIS 批准。",
    mistakes: [
      "把 LCA 编号当作 H-1B receipt number。",
      "把 LCA status 当作最终移民结果。",
      "忽略 worksite 和 wage 字段。",
    ],
    relatedPaths: [
      "/h1b",
      "/guides/h1b-certified-lca-meaning",
      "/guides/h1b-employer-data-hub-explained",
    ],
    sourceIds: ["dolPerformance", "uscisH1B", "uscisI129"],
  }),
  page({
    order: 14,
    path: "/guides/h1b-employer-data-hub-explained",
    kind: "guide",
    category: "H-1B 数据解释",
    priority: 1,
    title: "USCIS H-1B Employer Data Hub 中文解释",
    metaDescription:
      "解释 USCIS H-1B Employer Data Hub 的雇主层面 petition 决定数据、字段含义和与 LCA 数据的区别。",
    summary:
      "Employer Data Hub 是 USCIS 按雇主展示的 H-1B petition 决定数据。它和 DOL LCA 属于不同机构、不同流程节点，适合结合使用但不能混成同一个成功率。",
    sourceContext:
      "USCIS Employer Data Hub 和历史下载文件是官方 employer-level H-1B petition 数据来源；DOL LCA 数据用于补充职位和 worksite 背景。",
    checklistTitle: "使用 Employer Data Hub",
    checklist: [
      "先确认雇主名称是否匹配。",
      "区分 initial 和 continuing employment 类别。",
      "看 fiscal year 变化，不只看单年。",
      "和 LCA 数据并列，而不是互相替代。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果某雇主 LCA 多但 Employer Data Hub 记录少，可能意味着公开来源覆盖不同，不能直接得出审批结论。",
    mistakes: [
      "用 Employer Data Hub 直接评价某个岗位。",
      "忽略 initial 和 continuing 的区别。",
      "把雇主层面数据当作个人 case 数据。",
    ],
    relatedPaths: [
      "/h1b",
      "/tools/h1b-company-sponsor-checker",
      "/guides/what-is-lca-chinese",
    ],
    sourceIds: ["uscisEmployerHub", "uscisEmployerHubFiles", "dolPerformance"],
  }),
  page({
    order: 15,
    path: "/guides/h1b-certified-lca-meaning",
    kind: "guide",
    category: "H-1B 数据解释",
    priority: 2,
    title: "Certified LCA 到底代表什么",
    metaDescription:
      "解释 certified LCA 的公开数据含义、能作为哪些 sponsor 信号，以及不能推断哪些个人或法律结果。",
    summary:
      "Certified LCA 表示 LCA 这个 DOL 环节在公开记录中显示 certified。它能说明雇主曾为某类职位和地点准备 H-1B 相关材料，但不能说明 USCIS petition 或个人身份结果。",
    sourceContext:
      "DOL OFLC disclosure data 是 certified LCA 的来源；USCIS H-1B 信息用于理解后续 petition 不属于同一数据表。",
    checklistTitle: "读 certified LCA",
    checklist: [
      "查看 certified date 和 fiscal year。",
      "核对职位、SOC 和 worksite。",
      "看同类记录是否重复出现。",
      "避免从单条记录推断雇主政策。",
    ],
    exampleTitle: "示例读法",
    example:
      "某公司 FY2025 有多条 certified LCA，可作为历史 H-1B 准备信号；仍需问当前岗位是否启动 petition。",
    mistakes: [
      "把 certified LCA 当作 H-1B approval notice。",
      "忽略 withdrawn 或 denied LCA 的区别。",
      "把 LCA 人数等同于实际员工人数。",
    ],
    relatedPaths: [
      "/guides/what-is-lca-chinese",
      "/h1b",
      "/tools/h1b-company-sponsor-checker",
    ],
    sourceIds: ["dolPerformance", "uscisH1B"],
  }),
  page({
    order: 16,
    path: "/guides/h1b-withdrawn-denied-lca-meaning",
    kind: "guide",
    category: "H-1B 数据解释",
    priority: 2,
    title: "Withdrawn / Denied LCA 怎么看",
    metaDescription:
      "解释 withdrawn、denied 等 LCA 状态的公开数据含义，以及为什么不能把它们直接当作 H-1B 失败结论。",
    summary:
      "LCA withdrawn 或 denied 只说明 DOL LCA 环节的公开状态。它可能和岗位取消、信息变更、重新提交等情况有关，不能自动对应 USCIS H-1B petition 结果。",
    sourceContext:
      "DOL OFLC disclosure data 提供 LCA status 字段；USCIS H-1B 来源用于提醒后续 petition 是另一套流程。",
    checklistTitle: "遇到非 certified 状态",
    checklist: [
      "先确认状态字段和 decision date。",
      "看同一雇主同类职位是否有后续 certified 记录。",
      "避免把单条 withdrawn 记录当作公司风险结论。",
      "结合 Employer Data Hub 和公司页面整体信号。",
    ],
    exampleTitle: "示例读法",
    example:
      "同一职位先 withdrawn 后出现 certified LCA，可能只是材料或岗位调整；页面应展示状态而不是推断原因。",
    mistakes: [
      "把 denied LCA 等同 H-1B petition denial。",
      "只展示负面状态，不展示总体样本。",
      "从状态字段推测个人身份。",
    ],
    relatedPaths: [
      "/guides/h1b-certified-lca-meaning",
      "/h1b",
      "/guides/h1b-employer-data-hub-explained",
    ],
    sourceIds: ["dolPerformance", "uscisEmployerHub"],
  }),
  page({
    order: 17,
    path: "/guides/h1b-job-title-search",
    kind: "guide",
    category: "H-1B 数据解释",
    priority: 2,
    title: "如何用 Job Title 查 H-1B 工资",
    metaDescription:
      "用中文说明如何用英文 job title、SOC 和公司公开 LCA 样本查 H-1B 工资背景。",
    summary:
      "Job title 是查 H-1B 工资的入口，但同一个 title 可能对应不同 SOC、职责和级别。更稳妥的做法是用 title 先缩小范围，再用 SOC、地点和年份筛选。",
    sourceContext:
      "DOL LCA disclosure data 包含 job title、SOC、worksite 和 wage；FLAG wage data 提供 SOC/地区工资背景。",
    checklistTitle: "Job title 查询步骤",
    checklist: [
      "先用英文 title 的核心词搜索。",
      "观察常见 SOC code 和 SOC title。",
      "按 worksite state/city 缩小样本。",
      "对比 offered wage 和 prevailing wage 背景。",
    ],
    exampleTitle: "示例读法",
    example:
      "Data Scientist、Machine Learning Engineer 可能落在不同 SOC；查询时要看职位描述，而不是只看中文岗位名。",
    mistakes: [
      "把公司内部 title 当作官方分类。",
      "忽略同 title 的 seniority 差异。",
      "跨城市直接比较工资。",
    ],
    relatedPaths: [
      "/tools/h1b-wage-level-checker",
      "/guides/h1b-soc-code-explained",
      "/guides/h1b-city-salary-search",
    ],
    sourceIds: ["dolPerformance", "flagWageData"],
  }),
  page({
    order: 18,
    path: "/guides/h1b-city-salary-search",
    kind: "guide",
    category: "H-1B 数据解释",
    priority: 2,
    title: "如何按城市查 H-1B 薪资",
    metaDescription:
      "解释 H-1B 薪资查询为什么要看 worksite city/state、metro area、工资单位和 fiscal year。",
    summary:
      "H-1B 工资公开记录跟 worksite 绑定。按城市查薪资时，需要确认记录地点、工资单位、职位和年份，否则很容易把不可比样本混在一起。",
    sourceContext:
      "DOL LCA disclosure data 包含 worksite 字段；FLAG wage data 以职业和地区提供 wage 背景。",
    checklistTitle: "城市薪资查询步骤",
    checklist: [
      "优先用 worksite city/state，而不是公司总部。",
      "固定 SOC 或相近 job title。",
      "统一 wage unit 和 fiscal year。",
      "低样本城市可以扩展到 metro 或州级背景。",
    ],
    exampleTitle: "示例读法",
    example:
      "同一公司在 Austin 和 New York 的 LCA 工资样本不能直接合并成一个平均数，应先按地点分开看。",
    mistakes: [
      "用总部城市代表所有岗位。",
      "混用 hourly 和 yearly 工资。",
      "忽略 remote worksite 可能需要单独处理。",
    ],
    relatedPaths: [
      "/tools/h1b-wage-level-checker",
      "/guides/h1b-wage-location-effect",
      "/guides/remote-work-h1b-wage",
    ],
    sourceIds: ["dolPerformance", "flagWageSearch", "flagWageData"],
  }),
  page({
    order: 19,
    path: "/guides/h1b-soc-code-explained",
    kind: "guide",
    category: "H-1B 数据解释",
    priority: 2,
    title: "SOC Code 中文解释",
    metaDescription:
      "解释 SOC code 在 H-1B LCA、prevailing wage 和工资 level 查询中的作用，以及为什么不能只看职位名称。",
    summary:
      "SOC code 是把职位放进职业分类和工资背景中的关键字段。它不能完整描述岗位职责，但能让公开工资、LCA 和 wage level 查询更可比。",
    sourceContext:
      "DOL LCA 和 FLAG wage data 都使用 SOC 相关字段；DOL wage 页面提供外劳认证工资背景。",
    checklistTitle: "核对 SOC 时看",
    checklist: [
      "看 SOC code 和 SOC title 是否与职责接近。",
      "比较同公司同岗位近年 SOC 是否稳定。",
      "查 wage level 前先固定 SOC。",
      "职位变化明显时把 SOC 作为律师核对点。",
    ],
    exampleTitle: "示例读法",
    example:
      "Software Engineer 和 Data Engineer 可能都接近计算机类 SOC，但具体职责会影响分类和 wage 背景。",
    mistakes: [
      "把中文岗位名直接等同 SOC。",
      "忽略同一 title 在不同公司可能不同 SOC。",
      "用错误 SOC 做工资 level 对照。",
    ],
    relatedPaths: [
      "/guides/h1b-job-title-search",
      "/tools/h1b-wage-level-checker",
      "/guides/soc-code-wage-level-case-study",
    ],
    sourceIds: ["dolPerformance", "flagWageData", "dolWages"],
  }),
  page({
    order: 20,
    path: "/guides/h1b-full-time-part-time-data",
    kind: "guide",
    category: "H-1B 数据解释",
    priority: 2,
    title: "H-1B 全职/兼职记录怎么看",
    metaDescription:
      "解释 LCA 中 full-time/part-time 字段的公开数据含义，以及工资单位、工时和岗位背景的关系。",
    summary:
      "LCA 的 full-time 字段帮助理解岗位安排，但公开数据仍需要结合 wage unit、hours、job title 和 worksite。不要只凭一个字段判断工作授权或身份结果。",
    sourceContext:
      "DOL OFLC LCA disclosure data 包含 full-time indicator、wage unit 和 worksite 等字段；USCIS H-1B 页面提供 petition 背景。",
    checklistTitle: "看全职/兼职字段",
    checklist: [
      "确认 full-time indicator 是否存在。",
      "一起查看 wage unit 和 offered wage。",
      "比较同职位的工时与地点背景。",
      "向雇主确认实际安排和 petition 材料。",
    ],
    exampleTitle: "示例读法",
    example:
      "一个 hourly wage 的 part-time LCA 不能直接和 yearly salary 的 full-time 记录比较，必须先统一口径。",
    mistakes: [
      "只看 full-time 字段，不看工资单位。",
      "把 LCA 工作安排等同于实际入职状态。",
      "跨岗位比较兼职和全职工资。",
    ],
    relatedPaths: [
      "/h1b",
      "/guides/h1b-city-salary-search",
      "/tools/h1b-wage-level-checker",
    ],
    sourceIds: ["dolPerformance", "uscisH1B"],
  }),
  page({
    order: 21,
    path: "/guides/h1b-dependent-employer",
    kind: "guide",
    category: "H-1B 数据解释",
    priority: 2,
    title: "H-1B dependent employer 是什么",
    metaDescription:
      "用中文解释 H-1B dependent employer 的概念、公开数据里能看到什么，以及求职者应如何谨慎提问。",
    summary:
      "H-1B dependent employer 是 H-1B 规则中的雇主分类概念，和公司是否适合你并不是同一件事。公开数据可以帮助准备问题，但需要雇主和律师确认正式义务。",
    sourceContext:
      "USCIS H-1B 页面和 DOL 外劳认证来源提供 H-1B 基础背景；LCA 数据可显示雇主 H-1B 活动，但不替代法律分类判断。",
    checklistTitle: "求职时怎么问",
    checklist: [
      "询问公司是否有 H-1B dependent 或 willful violator 相关政策。",
      "确认岗位是否需要额外 recruitment 或 attestations。",
      "查看公司历史 LCA 记录规模和岗位类型。",
      "让雇主 immigration team 给出正式说明。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果公司 H-1B 记录很多，不代表它就是或不是 dependent employer；这需要按规则和公司员工结构判断。",
    mistakes: [
      "把 dependent employer 当作负面标签直接使用。",
      "用 LCA 数量代替正式分类。",
      "忽略岗位和雇主政策差异。",
    ],
    relatedPaths: [
      "/h1b",
      "/tools/h1b-company-sponsor-checker",
      "/guides/questions-to-ask-recruiter-about-h1b-green-card",
    ],
    sourceIds: ["uscisH1B", "dolForeignLabor", "dolPerformance"],
  }),
  page({
    order: 22,
    path: "/guides/h1b-small-company-sponsor-risk",
    kind: "guide",
    category: "H-1B 数据解释",
    priority: 2,
    title: "小公司 H-1B sponsor 风险怎么看",
    metaDescription:
      "解释如何用官方公开数据和面试问题评估小公司 H-1B sponsor 背景，同时避免从低样本做过度结论。",
    summary:
      "小公司并不天然不能 sponsor，但公开样本往往更少，流程经验、律师资源、岗位稳定性和工资背景都需要问得更细。低样本时要多用问题清单，少用排名结论。",
    sourceContext:
      "DOL LCA data 和 USCIS Employer Data Hub 可提供历史公开信号；USCIS H-1B 页面用于理解 petition 仍需要雇主提交。",
    checklistTitle: "小公司核对清单",
    checklist: [
      "查是否有同 entity 的近年 LCA 或 USCIS 记录。",
      "问是否有固定 immigration counsel。",
      "确认工资、worksite 和职位职责是否稳定。",
      "问 RFE、denial 或裁员时的公司政策。",
    ],
    exampleTitle: "示例读法",
    example:
      "一家创业公司只有一条 LCA 记录时，可以记录为有历史尝试，但仍需重点问流程负责人、律师和预算安排。",
    mistakes: [
      "把低样本等同高风险结论。",
      "只看公司规模，不看具体岗位和流程。",
      "忽略 entity 名称和 payroll 主体。",
    ],
    relatedPaths: [
      "/tools/h1b-company-sponsor-checker",
      "/guides/how-to-choose-h1b-sponsor-company",
      "/guides/h1b-layoff-grace-period-basics",
    ],
    sourceIds: ["dolPerformance", "uscisEmployerHub", "uscisH1B"],
  }),
  page({
    order: 23,
    path: "/guides/prevailing-wage-explained",
    kind: "guide",
    category: "Prevailing Wage 和薪资",
    priority: 1,
    title: "Prevailing Wage 中文解释",
    metaDescription:
      "解释 prevailing wage 在 H-1B、PERM 和外劳认证流程中的作用，以及公开工资数据的使用边界。",
    summary:
      "Prevailing wage 是把某职业、地区和要求放到工资背景里看的核心概念。它在 H-1B 和 PERM 场景中都重要，但正式判断取决于具体职位和官方流程。",
    sourceContext:
      "DOL wage 页面、FLAG Wage Search 和 wage data 是 prevailing wage 背景的官方入口。",
    checklistTitle: "理解 prevailing wage",
    checklist: [
      "确认职业分类和地区。",
      "看 wage source、effective date 和 wage unit。",
      "区分 H-1B LCA 背景和 PERM PWD 流程。",
      "把公开查询结果和正式决定分开。",
    ],
    exampleTitle: "示例读法",
    example:
      "同一 SOC 在不同地区的 prevailing wage 可能不同，远程岗位还需要单独确认 worksite 口径。",
    mistakes: [
      "把 wage search 当作正式 PWD。",
      "忽略职责和经验要求。",
      "用旧年份工资背景做当前判断。",
    ],
    relatedPaths: [
      "/tools/prevailing-wage-lookup",
      "/guides/wage-level-1-2-3-4-explained",
      "/guides/pwd-before-perm",
    ],
    sourceIds: ["dolWages", "flagWageSearch", "flagWageData"],
  }),
  page({
    order: 24,
    path: "/guides/wage-level-1-2-3-4-explained",
    kind: "guide",
    category: "Prevailing Wage 和薪资",
    priority: 1,
    title: "Wage Level 1/2/3/4 中文解释",
    metaDescription:
      "解释 H-1B 和 prevailing wage 背景中 Level 1 到 Level 4 的常见理解方式、限制和求职应用。",
    summary:
      "Wage Level 1-4 是理解岗位要求和工资背景的常见入口。它不只是薪水高低，还和经验、职责、监督程度、技能要求等因素有关。",
    sourceContext:
      "FLAG wage data 和 DOL wage 页面提供官方工资背景；DOL LCA records 展示雇主历史 wage level 或 wage 字段。",
    checklistTitle: "看 wage level",
    checklist: [
      "先固定 SOC 和地区。",
      "看岗位职责和经验要求是否支持对应 level。",
      "比较 offered wage 与公开 level 数值。",
      "把 level 作为沟通点，不作为个人合规判断。",
    ],
    exampleTitle: "示例读法",
    example:
      "Entry-level title 不总是 Level 1；如果岗位要求多年经验和独立负责复杂项目，level 背景要更谨慎核对。",
    mistakes: [
      "用职位年限机械对应 level。",
      "只看工资数字，不看岗位要求。",
      "忽略地区和 wage year。",
    ],
    relatedPaths: [
      "/tools/h1b-wage-level-checker",
      "/guides/prevailing-wage-explained",
      "/guides/soc-code-wage-level-case-study",
    ],
    sourceIds: ["flagWageData", "flagWageSearch", "dolWages"],
  }),
  page({
    order: 25,
    path: "/guides/h1b-salary-vs-prevailing-wage",
    kind: "guide",
    category: "Prevailing Wage 和薪资",
    priority: 2,
    title: "H-1B 工资和 prevailing wage 的关系",
    metaDescription:
      "解释 H-1B offered wage、prevailing wage、actual wage 和 LCA 公开记录之间的关系。",
    summary:
      "H-1B 工资判断通常要同时看 offered wage、prevailing wage 和雇主内部同类岗位工资背景。公开 LCA 数据能展示历史样本，但不能完整呈现所有薪酬和法律判断。",
    sourceContext:
      "DOL LCA disclosure data 展示历史 wage fields；DOL wage/FLAG 数据提供 prevailing wage 背景。",
    checklistTitle: "比较工资时看",
    checklist: [
      "统一 wage unit 和 annualized 口径。",
      "确认 worksite 和 SOC 是否一致。",
      "区分 prevailing wage 与 actual offered wage。",
      "注意奖金、股票和福利不一定反映在 LCA wage 字段。",
    ],
    exampleTitle: "示例读法",
    example:
      "一条 LCA 的 annual wage 低于另一条，并不代表总包更低；需要看 wage unit、职位级别和是否包含其他薪酬。",
    mistakes: [
      "把 LCA wage 当作总包。",
      "跨 SOC 或跨城市直接比较。",
      "忽略 actual wage 概念。",
    ],
    relatedPaths: [
      "/tools/h1b-wage-level-checker",
      "/guides/prevailing-wage-explained",
      "/guides/h1b-salary-negotiation",
    ],
    sourceIds: ["dolPerformance", "dolWages", "flagWageData"],
  }),
  page({
    order: 26,
    path: "/guides/h1b-wage-location-effect",
    kind: "guide",
    category: "Prevailing Wage 和薪资",
    priority: 2,
    title: "城市/地区如何影响 H-1B 工资要求",
    metaDescription:
      "解释 worksite、metro area、州级数据和 remote/hybrid 安排如何影响 H-1B 工资背景查询。",
    summary:
      "H-1B 工资背景高度依赖 worksite。相同职位在不同城市可能对应不同 wage data，远程或混合安排还需要确认 LCA 覆盖地点。",
    sourceContext:
      "DOL LCA records 包含 worksite；FLAG wage search 以职业和 area 查询 wage 背景。",
    checklistTitle: "地点核对",
    checklist: [
      "确认实际工作地点和远程安排。",
      "查 metro、county 或 state 级别匹配。",
      "避免用 headquarters 代替 worksite。",
      "地点变化时询问是否需要 LCA 或 petition 更新。",
    ],
    exampleTitle: "示例读法",
    example:
      "Offer 写公司总部在 CA，但实际 worksite 在 TX，工资背景应围绕实际 worksite 问清。",
    mistakes: [
      "用公司总部查工资。",
      "忽略 relocation 后的 LCA 问题。",
      "把州级缺省数据当作精确城市数据。",
    ],
    relatedPaths: [
      "/guides/remote-work-h1b-wage",
      "/tools/h1b-wage-level-checker",
      "/guides/h1b-city-salary-search",
    ],
    sourceIds: ["dolPerformance", "flagWageSearch", "flagWageData"],
  }),
  page({
    order: 27,
    path: "/guides/h1b-salary-negotiation",
    kind: "guide",
    category: "Prevailing Wage 和薪资",
    priority: 2,
    title: "如何用公开 H-1B 工资数据辅助谈薪",
    metaDescription:
      "提供用 LCA 工资样本、prevailing wage 和公司历史数据做谈薪准备的中文步骤和边界。",
    summary:
      "公开 H-1B 工资数据适合做背景研究和问题准备。谈薪时要把它和岗位级别、地点、市场薪酬、公司预算、总包结构一起看。",
    sourceContext:
      "DOL LCA data 和 FLAG wage data 是官方公开工资背景来源；它们不展示完整个人薪酬。",
    checklistTitle: "准备谈薪材料",
    checklist: [
      "选同公司、同地区、同 SOC 或相近职位样本。",
      "计算时统一 wage unit。",
      "准备多个来源，而不是单条记录。",
      "用问题表达，不用绝对要求表达。",
    ],
    exampleTitle: "示例读法",
    example:
      "可以说“我看到公开 LCA 中类似岗位区间在 X 附近，想了解这个 level 的薪资带宽”，而不是声称公司必须匹配。",
    mistakes: [
      "拿单条最高记录谈薪。",
      "忽略 total compensation 结构。",
      "把 H-1B 工资数据当作所有员工市场价。",
    ],
    relatedPaths: [
      "/tools/wage-negotiation-with-h1b-data",
      "/guides/h1b-salary-vs-prevailing-wage",
      "/h1b",
    ],
    sourceIds: ["dolPerformance", "flagWageData"],
  }),
  page({
    order: 28,
    path: "/guides/h1b-low-salary-warning-signs",
    kind: "guide",
    category: "Prevailing Wage 和薪资",
    priority: 2,
    title: "H-1B 工资偏低时该注意什么",
    metaDescription:
      "解释工资样本偏低时如何用官方 wage data、SOC、地点和岗位要求做谨慎核对。",
    summary:
      "看到工资偏低时，先不要直接下结论。更好的做法是核对 SOC、地点、wage unit、岗位级别和 prevailing wage 背景，再把问题交给雇主或律师确认。",
    sourceContext:
      "DOL LCA data 和 FLAG wage search 可帮助判断公开工资背景位置，但正式合规判断不在页面完成。",
    checklistTitle: "偏低样本核对",
    checklist: [
      "统一 hourly/yearly 口径。",
      "确认是否 part-time 或特殊 wage unit。",
      "检查 SOC 和 worksite 是否匹配。",
      "比较同地区同类职位多个样本。",
    ],
    exampleTitle: "示例读法",
    example:
      "某记录显示年薪偏低，但如果实际是 part-time 或不同 SOC，就不能直接与 full-time software engineer 比较。",
    mistakes: [
      "看到低数字就判断违法。",
      "忽略 part-time 和 wage unit。",
      "把历史样本当作当前 offer。",
    ],
    relatedPaths: [
      "/tools/h1b-wage-level-checker",
      "/guides/h1b-full-time-part-time-data",
      "/guides/h1b-salary-vs-prevailing-wage",
    ],
    sourceIds: ["dolPerformance", "flagWageSearch", "dolWages"],
  }),
  page({
    order: 29,
    path: "/guides/remote-work-h1b-wage",
    kind: "guide",
    category: "Prevailing Wage 和薪资",
    priority: 2,
    title: "远程工作与 H-1B worksite/wage 风险",
    metaDescription:
      "解释 remote/hybrid worksite、LCA 覆盖地点和 wage 背景之间的关系，以及求职者应问的问题。",
    summary:
      "远程工作会让 worksite 和 LCA 覆盖更复杂。公开数据能展示历史 worksite，但实际 remote/hybrid 安排需要雇主 immigration team 或律师确认。",
    sourceContext:
      "DOL LCA data 包含 worksite 和 wage 字段；USCIS H-1B 页面提供 petition 背景。",
    checklistTitle: "远程岗位要问",
    checklist: [
      "offer 中实际 worksite 是哪里。",
      "远程地点是否被 LCA 覆盖。",
      "搬家或跨州后谁负责更新流程。",
      "工资背景按哪个地区核对。",
    ],
    exampleTitle: "示例读法",
    example:
      "公司在 NY，但你长期在 NC 远程工作，不能只看 NY 的 LCA 样本，需要确认实际 worksite 和 wage 背景。",
    mistakes: [
      "认为 remote 就不需要 worksite 核对。",
      "用办公室地点代替居住地工作安排。",
      "忽略 relocation 后的时间节点。",
    ],
    relatedPaths: [
      "/guides/h1b-wage-location-effect",
      "/tools/h1b-transfer-risk-checklist",
      "/tools/h1b-wage-level-checker",
    ],
    sourceIds: ["dolPerformance", "flagWageData", "uscisH1B"],
  }),
  page({
    order: 30,
    path: "/guides/soc-code-wage-level-case-study",
    kind: "guide",
    category: "Prevailing Wage 和薪资",
    priority: 2,
    title: "SOC Code + Wage Level 案例解析",
    metaDescription:
      "用一个通用案例说明如何把 SOC code、worksite、wage year 和 wage level 放在一起看。",
    summary:
      "SOC 和 wage level 要一起读。案例页用通用工程岗位示例展示如何从 title 到 SOC，再到地点和 wage level 背景，最后形成给雇主的问题清单。",
    sourceContext:
      "FLAG wage data 提供 SOC/地区/level 背景；DOL LCA data 展示历史工资样本。",
    checklistTitle: "案例步骤",
    checklist: [
      "从 job description 提取核心职责。",
      "找最接近 SOC，并记录不确定点。",
      "用 worksite 和 wage year 查询 level。",
      "把结果和 offered wage、LCA 样本一起看。",
    ],
    exampleTitle: "通用案例",
    example:
      "一个 ML Platform Engineer 可能涉及 software development 和 data infrastructure；如果 SOC 不确定，应记录两个候选 SOC 的 wage 背景供律师核对。",
    mistakes: [
      "只按 title 选 SOC。",
      "忽略职责中 seniority 和 supervision。",
      "把案例结果套到个人个案。",
    ],
    relatedPaths: [
      "/guides/h1b-soc-code-explained",
      "/guides/wage-level-1-2-3-4-explained",
      "/tools/h1b-wage-level-checker",
    ],
    sourceIds: ["flagWageData", "flagWageSearch", "dolPerformance"],
  }),
  page({
    order: 31,
    path: "/guides/perm-explained-chinese",
    kind: "guide",
    category: "PERM 和绿卡",
    priority: 1,
    title: "PERM 绿卡流程中文解释",
    metaDescription:
      "用中文解释 PERM 在 employment-based green card 流程中的位置、雇主角色和公开数据边界。",
    summary:
      "PERM 是雇主为特定 permanent job opportunity 走的劳工认证流程。它通常位于 I-140 之前，但 PERM 本身不是绿卡批准，也不是个人排期到达。",
    sourceContext:
      "DOL FLAG PERM 页面解释劳工认证流程；USCIS employment-based green card 页面提供后续移民申请背景。",
    checklistTitle: "理解 PERM 的节点",
    checklist: [
      "确认 employer 和 permanent job opportunity。",
      "理解 prevailing wage / recruitment / ETA-9089。",
      "区分 PERM certified、I-140 和 I-485。",
      "用公开 PERM data 看公司历史背景。",
    ],
    exampleTitle: "示例读法",
    example:
      "公司有 certified PERM 记录，说明曾有劳工认证公开历史；仍需问当前岗位何时启动、职位要求如何设定。",
    mistakes: [
      "把 PERM 当作个人申请。",
      "把 certified 当作绿卡完成。",
      "忽略岗位变化对 PERM 的影响。",
    ],
    relatedPaths: [
      "/perm",
      "/guides/perm-data-meaning",
      "/guides/i140-after-perm",
    ],
    sourceIds: ["flagPerm", "dolPerformance", "uscisEmploymentGreenCard"],
  }),
  page({
    order: 32,
    path: "/guides/perm-data-meaning",
    kind: "guide",
    category: "PERM 和绿卡",
    priority: 1,
    title: "PERM disclosure data 怎么看",
    metaDescription:
      "解释 PERM disclosure data 的 employer、job title、status、priority date、wage 和 worksite 字段如何用于公司研究。",
    summary:
      "PERM disclosure data 是观察公司绿卡相关公开历史的重要来源。它适合看趋势、职位和地点，不适合推断个人身份结果或雇主未来承诺。",
    sourceContext:
      "DOL OFLC performance data 发布 PERM disclosure records；FLAG PERM 页面提供流程背景。",
    checklistTitle: "读 PERM data",
    checklist: [
      "先看 employer、job title 和 worksite。",
      "查看 case status 和 fiscal year。",
      "关注 priority date、decision date 和 wage 字段。",
      "低样本岗位只做背景，不做排名。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果公司近年有多个 Data Scientist certified PERM，可以作为同类岗位绿卡流程经验信号，但仍需确认当前政策。",
    mistakes: [
      "把 disclosure data 当作完整绿卡数据库。",
      "展示个人身份或不必要个人信息。",
      "忽略 revised ETA-9089 格式差异。",
    ],
    relatedPaths: [
      "/perm",
      "/guides/perm-certified-meaning",
      "/tools/perm-green-card-company-checker",
    ],
    sourceIds: ["dolPerformance", "flagPerm", "uscisEmploymentGreenCard"],
  }),
  page({
    order: 33,
    path: "/guides/perm-certified-meaning",
    kind: "guide",
    category: "PERM 和绿卡",
    priority: 2,
    title: "PERM Certified 不等于绿卡获批",
    metaDescription:
      "解释 PERM certified 的含义、它与 I-140/I-485 的关系，以及为什么公开页面不应写成绿卡成功率。",
    summary:
      "PERM certified 是 DOL 劳工认证环节的一个结果，不是 USCIS 对移民 petition 或调整身份的批准。它是重要节点，但后面还有 I-140、排期和身份路径。",
    sourceContext:
      "DOL PERM 来源用于 certified 状态；USCIS employment-based green card 和 I-140 页面用于后续节点背景。",
    checklistTitle: "看到 certified 后",
    checklist: [
      "确认 certified 对应的 employer 和 job opportunity。",
      "理解它仍不是 I-140 approval。",
      "结合 priority date 和 Visa Bulletin 背景。",
      "跳槽前单独问旧 PERM 和新岗位关系。",
    ],
    exampleTitle: "示例读法",
    example:
      "一条 certified PERM 可说明劳工认证完成，但不能说明申请人已经提交或获批 I-485。",
    mistakes: [
      "把 certified 记录展示为绿卡成功案例。",
      "用 certified 数除以 filed 数称为成功率。",
      "忽略 I-140 和排期。",
    ],
    relatedPaths: [
      "/guides/i140-after-perm",
      "/tools/eb2-eb3-china-priority-date-calculator",
      "/guides/perm-data-meaning",
    ],
    sourceIds: [
      "flagPerm",
      "dolPerformance",
      "uscisI140",
      "uscisEmploymentGreenCard",
    ],
  }),
  page({
    order: 34,
    path: "/guides/pwd-before-perm",
    kind: "guide",
    category: "PERM 和绿卡",
    priority: 2,
    title: "PWD 和 PERM 的关系",
    metaDescription:
      "解释 Prevailing Wage Determination (PWD) 在 PERM 前的作用、与 wage search 的区别和公开数据边界。",
    summary:
      "PWD 是 PERM 准备中的关键工资节点，围绕特定职位、地点和要求确定工资背景。公开 wage search 可做准备，但不是正式 PWD 结果。",
    sourceContext:
      "FLAG PERM 页面和 DOL wage/FLAG wage data 提供 PERM 与 prevailing wage 背景。",
    checklistTitle: "PWD 前要确认",
    checklist: [
      "职位职责和最低要求是否稳定。",
      "worksite 和 remote 安排是否清楚。",
      "SOC 与工资地区是否匹配。",
      "PWD 结果如何影响 recruitment 和 filing 计划。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果岗位最低要求从本科变成硕士，PWD 背景和 PERM recruitment 策略都可能需要重新确认。",
    mistakes: [
      "把 wage search 当作正式 PWD。",
      "PWD 前频繁改变岗位要求。",
      "忽略地点变化。",
    ],
    relatedPaths: [
      "/guides/prevailing-wage-explained",
      "/guides/perm-recruitment-explained",
      "/tools/prevailing-wage-lookup",
    ],
    sourceIds: ["flagPerm", "flagWageData", "dolWages"],
  }),
  page({
    order: 35,
    path: "/guides/perm-recruitment-explained",
    kind: "guide",
    category: "PERM 和绿卡",
    priority: 2,
    title: "PERM recruitment 中文解释",
    metaDescription:
      "解释 PERM recruitment 的目的、雇主角色、岗位要求一致性和求职者应避免介入的边界。",
    summary:
      "PERM recruitment 是雇主主导的劳工认证步骤，关注美国工人是否 able, willing, qualified, and available。求职者应理解节点，但不应自行操作招聘材料。",
    sourceContext:
      "DOL FLAG PERM 页面提供 PERM 流程背景；OFLC disclosure data 展示最终公开记录。",
    checklistTitle: "理解 recruitment",
    checklist: [
      "确认岗位要求在 PWD、recruitment 和 filing 中一致。",
      "招聘步骤由雇主和律师管理。",
      "避免自行改写广告或筛选标准。",
      "记录 timeline 问题给 HR。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果岗位职责在 recruitment 前后变化，应让雇主律师确认是否影响 PERM 策略，而不是自行判断。",
    mistakes: [
      "把 recruitment 当作普通招聘广告。",
      "让候选人自行处理材料。",
      "忽略 minimum requirements 一致性。",
    ],
    relatedPaths: [
      "/guides/perm-explained-chinese",
      "/guides/pwd-before-perm",
      "/tools/perm-restart-timeline-estimator",
    ],
    sourceIds: ["flagPerm", "dolPerformance"],
  }),
  page({
    order: 36,
    path: "/guides/perm-audit-risk-basics",
    kind: "guide",
    category: "PERM 和绿卡",
    priority: 2,
    title: "PERM audit 基础风险",
    metaDescription:
      "用中文解释 PERM audit 的基础概念、公开数据里能看到的有限信号和求职者应问的问题。",
    summary:
      "PERM audit 是 DOL 审查中的一种可能情况。公开 disclosure data 可能展示状态或结果，但不能告诉你完整原因；求职者应把 audit 当作需要雇主律师解释的流程节点。",
    sourceContext:
      "DOL FLAG PERM 和 OFLC performance data 是 PERM 流程与公开记录来源。",
    checklistTitle: "遇到 audit 怎么问",
    checklist: [
      "问公司是否有 audit 应对流程。",
      "确认谁负责材料和沟通。",
      "了解 timeline 可能延长的范围。",
      "避免要求 HR 提供不适合公开的个案细节。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果公司历史记录出现 audit 相关延迟，页面只能提示流程可能更长，不能推断雇主过错。",
    mistakes: [
      "把 audit 当作 denial。",
      "从公开状态推断具体原因。",
      "忽略 attorney-client 和隐私边界。",
    ],
    relatedPaths: [
      "/guides/perm-data-meaning",
      "/guides/perm-recruitment-explained",
      "/perm",
    ],
    sourceIds: ["flagPerm", "dolPerformance"],
  }),
  page({
    order: 37,
    path: "/guides/i140-after-perm",
    kind: "guide",
    category: "PERM 和绿卡",
    priority: 2,
    title: "PERM 之后 I-140 是什么",
    metaDescription:
      "解释 PERM certified 后的 I-140、priority date、Visa Bulletin 和后续身份节点的关系。",
    summary:
      "PERM certified 后通常进入 I-140 immigrant petition 节点。I-140、priority date、Visa Bulletin 和 I-485/consular processing 是不同问题，需要分开核对。",
    sourceContext:
      "USCIS Form I-140 和 employment-based green card 页面提供 I-140 与 EB 绿卡背景；DOL PERM 来源提供前置节点。",
    checklistTitle: "PERM 后要问",
    checklist: [
      "I-140 由谁准备和支付。",
      "是否 premium processing 以及公司政策。",
      "priority date 如何记录和保留。",
      "跳槽或职位变化时如何处理。",
    ],
    exampleTitle: "示例读法",
    example:
      "PERM certified 后，下一步常见问题不是“绿卡到了吗”，而是 I-140 filing、priority date 和排期表如何配合。",
    mistakes: [
      "把 I-140 当作 I-485。",
      "忽略 priority date 对中国 EB 排期的影响。",
      "没有保存雇主提供的关键通知副本。",
    ],
    relatedPaths: [
      "/guides/perm-certified-meaning",
      "/tools/eb2-eb3-china-priority-date-calculator",
      "/guides/visa-bulletin-explained-chinese",
    ],
    sourceIds: ["uscisI140", "uscisEmploymentGreenCard", "dosVisaBulletin"],
  }),
  page({
    order: 38,
    path: "/guides/company-green-card-sponsor-signals",
    kind: "guide",
    category: "PERM 和绿卡",
    priority: 1,
    title: "公司是否适合办绿卡的数据信号",
    metaDescription:
      "解释如何用 PERM、H-1B、跨年记录、职位地点和低样本提示判断公司绿卡公开数据信号。",
    summary:
      "判断公司绿卡支持背景时，应看 PERM 记录、职位相似度、年份连续性、H-1B 配套数据和公开数据丰富度。结论只能是信号，不是雇主承诺。",
    sourceContext:
      "DOL PERM disclosure data 是绿卡公司信号主来源；H-1B LCA 和 USCIS Employer Data Hub 可补充雇主职业移民流程经验。",
    checklistTitle: "绿卡 sponsor 信号",
    checklist: [
      "看近年 PERM certified 与 filed 记录。",
      "比较目标岗位和历史岗位是否相似。",
      "看 worksite 和工资背景是否接近。",
      "结合公司公开数据友好度信号和低样本提示。",
    ],
    exampleTitle: "示例读法",
    example:
      "公司有多条同城市同类岗位 PERM，说明公开历史更可比；仍要问绿卡启动等待期和内部政策。",
    mistakes: [
      "把 PERM 数量当作绿卡保证。",
      "忽略岗位和地点差异。",
      "只看 H-1B，不看 PERM。",
    ],
    relatedPaths: [
      "/tools/company-immigration-score",
      "/perm",
      "/tools/perm-green-card-company-checker",
    ],
    sourceIds: ["dolPerformance", "flagPerm", "uscisEmploymentGreenCard"],
  }),
  page({
    order: 39,
    path: "/guides/green-card-timeline-after-h1b",
    kind: "guide",
    category: "PERM 和绿卡",
    priority: 2,
    title: "H-1B 到绿卡大致时间线",
    metaDescription:
      "用中文梳理 H-1B 后常见 employment-based green card 节点：PERM、I-140、排期和 I-485。",
    summary:
      "H-1B 到绿卡不是单一路径。常见 employment-based 路径会涉及雇主 PERM、I-140、Visa Bulletin 排期和调整身份/领馆程序等不同节点。",
    sourceContext:
      "USCIS employment-based green card、I-140、DOL PERM 和 DOS Visa Bulletin 页面共同构成官方背景。",
    checklistTitle: "时间线节点",
    checklist: [
      "雇主内部绿卡启动政策。",
      "PERM PWD、recruitment 和 ETA-9089。",
      "I-140 filing 和 priority date。",
      "Visa Bulletin 与 USCIS filing chart。",
    ],
    exampleTitle: "示例读法",
    example:
      "H-1B 第二年开始问绿卡政策时，可以按 PERM、I-140、排期三组问题分别准备。",
    mistakes: [
      "把 H-1B 入职等同绿卡流程启动。",
      "忽略中国 EB 排期对后续时间的影响。",
      "把公司平均时间当作个人预测。",
    ],
    relatedPaths: [
      "/guides/perm-explained-chinese",
      "/guides/i140-after-perm",
      "/guides/visa-bulletin-explained-chinese",
    ],
    sourceIds: [
      "uscisEmploymentGreenCard",
      "uscisI140",
      "flagPerm",
      "dosVisaBulletin",
    ],
  }),
  page({
    order: 40,
    path: "/guides/change-job-during-perm",
    kind: "guide",
    category: "PERM 和绿卡",
    priority: 2,
    title: "PERM 期间跳槽要注意什么",
    metaDescription:
      "解释 PERM 期间换雇主、换职位或换地点时需要核对的流程问题和公开数据边界。",
    summary:
      "PERM 绑定雇主和特定 permanent job opportunity。跳槽、换组或换地点时，需要逐项核对旧流程和新岗位关系，而不是只看是否已经 filed。",
    sourceContext:
      "DOL PERM 和 USCIS employment-based green card 来源用于理解 PERM、I-140 和后续节点；公开数据只提供历史背景。",
    checklistTitle: "跳槽前问题清单",
    checklist: [
      "旧 PERM 当前在哪个阶段。",
      "新雇主是否愿意重新规划 PERM。",
      "priority date 和 I-140 状态如何处理。",
      "H-1B transfer 与绿卡时间线如何衔接。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果旧 PERM pending 且新 offer 来自不同雇主，应先假设需要围绕新雇主重新规划，并请律师核对例外情况。",
    mistakes: [
      "把 pending PERM 当作个人资产。",
      "只问 H-1B transfer，不问绿卡重启。",
      "忽略职位职责变化。",
    ],
    relatedPaths: [
      "/tools/perm-restart-timeline-estimator",
      "/guides/i140-after-perm",
      "/tools/h1b-transfer-risk-checklist",
    ],
    sourceIds: ["flagPerm", "uscisEmploymentGreenCard", "uscisI140"],
  }),
  page({
    order: 41,
    path: "/guides/visa-bulletin-explained-chinese",
    kind: "guide",
    category: "排期与中国 backlog",
    priority: 1,
    title: "Visa Bulletin 中文解释",
    metaDescription:
      "解释 Visa Bulletin 的 employment-based 类别、chargeability area、Final Action Date 和 Dates for Filing。",
    summary:
      "Visa Bulletin 是每月查看移民签证名额和排期的重要官方来源。对中国大陆出生 EB 用户来说，需要同时看类别、出生地 chargeability 和两张不同表。",
    sourceContext:
      "Department of State Visa Bulletin 发布排期；USCIS filing chart 页面说明调整身份当月可用哪张表。",
    checklistTitle: "读 Visa Bulletin",
    checklist: [
      "确认月份和 employment-based 表。",
      "找到 China-mainland born 行。",
      "区分 Final Action Date 与 Dates for Filing。",
      "再核对 USCIS 当月 chart 选择。",
    ],
    exampleTitle: "示例读法",
    example:
      "EB-2 China 的 Final Action Date 和 Dates for Filing 可能不同；你的下一步问题取决于你看的是签证签发还是提交材料背景。",
    mistakes: [
      "只看一张表。",
      "把 worldwide 日期用于中国大陆出生。",
      "从单月变化预测未来。",
    ],
    relatedPaths: [
      "/visa-bulletin",
      "/tools/eb2-eb3-china-priority-date-calculator",
      "/guides/final-action-date-vs-dates-for-filing",
    ],
    sourceIds: ["dosVisaBulletin", "uscisFilingChart"],
  }),
  page({
    order: 42,
    path: "/guides/final-action-date-vs-dates-for-filing",
    kind: "guide",
    category: "排期与中国 backlog",
    priority: 1,
    title: "Final Action Date 和 Dates for Filing 区别",
    metaDescription:
      "用中文解释 Visa Bulletin 中 Final Action Date 与 Dates for Filing 的不同用途，以及 USCIS filing chart 的作用。",
    summary:
      "Final Action Date 和 Dates for Filing 是两张不同表。Dates for Filing 是否能用于 I-485，需要看 USCIS 当月 adjustment of status filing chart 选择。",
    sourceContext:
      "DOS Visa Bulletin 提供两张表；USCIS filing chart 页面决定调整身份申请当月使用哪张表。",
    checklistTitle: "选择表格时看",
    checklist: [
      "先确定是 consular processing 还是 adjustment of status 背景。",
      "看 DOS 当月两张表。",
      "查 USCIS 当月 employment-based chart selection。",
      "记录类别和 chargeability area。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果 USCIS 当月要求使用 Final Action Date，即使 Dates for Filing 看起来更靠前，也不能只按 DFF 做 I-485 计划。",
    mistakes: [
      "把 Dates for Filing 自动用于 I-485。",
      "混淆表格月份。",
      "只看 EB-2，不看自己的真实类别。",
    ],
    relatedPaths: [
      "/guides/visa-bulletin-explained-chinese",
      "/tools/eb2-eb3-china-priority-date-calculator",
      "/guides/uscis-filing-chart-explained",
    ],
    sourceIds: ["dosVisaBulletin", "uscisFilingChart"],
  }),
  page({
    order: 43,
    path: "/guides/eb2-china-priority-date",
    kind: "guide",
    category: "排期与中国 backlog",
    priority: 2,
    title: "EB-2 中国大陆出生排期怎么看",
    metaDescription:
      "解释 EB-2 China priority date、Final Action Date、Dates for Filing 和 PERM/I-140 节点如何一起理解。",
    summary:
      "EB-2 China 用户通常需要把 PERM/I-140 priority date 和 Visa Bulletin 中国大陆出生 EB-2 行对照。页面只解释公开表格，不预测未来。",
    sourceContext:
      "DOS Visa Bulletin 和 USCIS filing chart 是排期对照来源；USCIS employment-based green card 页面提供类别背景。",
    checklistTitle: "EB-2 China 对照",
    checklist: [
      "确认 priority date 来源和类别。",
      "看 EB-2 China 行的两张表。",
      "核对 USCIS 当月使用表。",
      "关注是否涉及 downgrade 或跨类别策略时咨询律师。",
    ],
    exampleTitle: "示例读法",
    example:
      "EB-2 priority date 早于 DFF 但晚于 FAD 时，可能适合关注 filing chart；实际下一步仍取决于 USCIS 当月选择。",
    mistakes: [
      "把 EB-3 日期套到 EB-2。",
      "忽略出生地 chargeability。",
      "用排期工具替代法律策略。",
    ],
    relatedPaths: [
      "/tools/eb2-eb3-china-priority-date-calculator",
      "/guides/eb2-vs-eb3-china-downgrade",
      "/guides/final-action-date-vs-dates-for-filing",
    ],
    sourceIds: [
      "dosVisaBulletin",
      "uscisFilingChart",
      "uscisEmploymentGreenCard",
    ],
  }),
  page({
    order: 44,
    path: "/guides/eb3-china-priority-date",
    kind: "guide",
    category: "排期与中国 backlog",
    priority: 2,
    title: "EB-3 中国大陆出生排期怎么看",
    metaDescription:
      "解释 EB-3 China priority date、Final Action Date、Dates for Filing 和类别切换讨论中的数据边界。",
    summary:
      "EB-3 China 排期需要按中国大陆出生和 EB-3 行查看。它可能和 EB-2 不同，但不能只凭当月日期决定个人 downgrade 或 filing 策略。",
    sourceContext:
      "DOS Visa Bulletin 提供 EB-3 China dates；USCIS filing chart 决定当月调整身份可用表。",
    checklistTitle: "EB-3 China 对照",
    checklist: [
      "确认你看的类别是 EB-3。",
      "分别看 FAD 和 DFF。",
      "核对 USCIS employment-based chart selection。",
      "如果涉及 EB-2/EB-3 策略，交给律师评估。",
    ],
    exampleTitle: "示例读法",
    example:
      "某月 EB-3 DFF 比 EB-2 靠前，只能说明该月公开表格关系，不能单独决定 downgrade。",
    mistakes: [
      "把 EB-3 前进当作长期趋势。",
      "忽略 USCIS chart。",
      "用他人类别套自己的 priority date。",
    ],
    relatedPaths: [
      "/tools/eb2-eb3-china-priority-date-calculator",
      "/guides/eb2-vs-eb3-china-downgrade",
      "/visa-bulletin",
    ],
    sourceIds: [
      "dosVisaBulletin",
      "uscisFilingChart",
      "uscisEmploymentGreenCard",
    ],
  }),
  page({
    order: 45,
    path: "/guides/eb2-vs-eb3-china-downgrade",
    kind: "guide",
    category: "排期与中国 backlog",
    priority: 2,
    title: "EB-2 / EB-3 中国排期与 downgrade 基础",
    metaDescription:
      "用中文解释 EB-2 和 EB-3 中国排期对照、downgrade 讨论的公开数据基础和法律边界。",
    summary:
      "EB-2/EB-3 downgrade 讨论通常从排期差异开始，但真正策略涉及 I-140、职位类别、雇主、身份和律师判断。本页只解释公开数据如何准备问题。",
    sourceContext:
      "DOS Visa Bulletin 和 USCIS filing chart 提供排期背景；USCIS I-140 和 employment-based green card 页面提供 petition 背景。",
    checklistTitle: "准备 downgrade 问题",
    checklist: [
      "比较 EB-2 与 EB-3 China 的 FAD 和 DFF。",
      "确认 USCIS 当月 chart。",
      "整理已有 I-140、priority date 和雇主政策。",
      "让律师评估是否适合个人路径。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果 EB-3 DFF 短期更靠前，可以记录为咨询点；不能只因一个月差异就决定 filing。",
    mistakes: [
      "把 downgrade 当作单纯表格选择。",
      "忽略 I-140 和岗位类别。",
      "用社交平台经验替代官方表和律师意见。",
    ],
    relatedPaths: [
      "/guides/eb2-china-priority-date",
      "/guides/eb3-china-priority-date",
      "/guides/i140-after-perm",
    ],
    sourceIds: ["dosVisaBulletin", "uscisFilingChart", "uscisI140"],
  }),
  page({
    order: 46,
    path: "/guides/uscis-filing-chart-explained",
    kind: "guide",
    category: "排期与中国 backlog",
    priority: 2,
    title: "USCIS 当月 filing chart 怎么看",
    metaDescription:
      "解释 USCIS Adjustment of Status Filing Charts 页面如何决定当月 I-485 使用 Final Action Date 还是 Dates for Filing。",
    summary:
      "USCIS filing chart 页面是排期判断中经常被忽略的一步。对 adjustment of status 用户，不能只看 DOS Visa Bulletin，还要看 USCIS 当月 employment-based chart 选择。",
    sourceContext:
      "USCIS filing chart 页面是官方调整身份 chart selection 来源；DOS Visa Bulletin 提供对应两张表。",
    checklistTitle: "查 filing chart",
    checklist: [
      "打开 USCIS filing chart 页面。",
      "找到当月 employment-based preference categories。",
      "记录 Final Action Date 或 Dates for Filing。",
      "再回到 Visa Bulletin 对照自己的类别。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果 USCIS 当月 employment-based 使用 Dates for Filing，才可以继续用 DFF 做公开表格层面的 I-485 准备判断。",
    mistakes: [
      "只看 family-based chart。",
      "忘记每月 chart selection 会变。",
      "把 USCIS chart 当作个人资格结论。",
    ],
    relatedPaths: [
      "/guides/final-action-date-vs-dates-for-filing",
      "/tools/eb2-eb3-china-priority-date-calculator",
      "/visa-bulletin",
    ],
    sourceIds: ["uscisFilingChart", "dosVisaBulletin"],
  }),
  page({
    order: 47,
    path: "/guides/how-to-choose-h1b-sponsor-company",
    kind: "guide",
    category: "求职与公司判断",
    priority: 1,
    title: "找工作时如何判断公司 sponsor 能力",
    metaDescription:
      "用 H-1B、PERM、工资和排期公开数据建立公司 sponsor 背景研究清单，避免把信号当作承诺。",
    summary:
      "判断公司 sponsor 背景时，不要只问“办不办”。更实用的是看公开 H-1B/PERM 历史、职位相似度、地点、工资背景、流程团队和公司政策。",
    sourceContext:
      "DOL LCA、PERM、FLAG wage data 和 USCIS Employer Data Hub 提供官方公开数据背景；它们共同构成信号，不构成雇主承诺。",
    checklistTitle: "公司判断清单",
    checklist: [
      "查 H-1B 和 PERM 历史记录。",
      "比较目标岗位和历史岗位是否相似。",
      "问 sponsor 时间、律师、费用和 RFE 政策。",
      "看工资和 worksite 是否合理。",
    ],
    exampleTitle: "示例读法",
    example:
      "一家大公司 H-1B 记录多但 PERM 记录少，适合把 H-1B transfer 和绿卡启动政策分开问。",
    mistakes: [
      "只看公司名气。",
      "把公开记录当作 offer 条款。",
      "不问具体 legal entity。",
    ],
    relatedPaths: [
      "/tools/h1b-company-sponsor-checker",
      "/tools/company-immigration-score",
      "/guides/questions-to-ask-recruiter-about-h1b-green-card",
    ],
    sourceIds: ["dolPerformance", "uscisEmployerHub", "flagWageData"],
  }),
  page({
    order: 48,
    path: "/guides/questions-to-ask-recruiter-about-h1b-green-card",
    kind: "guide",
    category: "求职与公司判断",
    priority: 3,
    title: "面试时如何问 H-1B / 绿卡政策",
    metaDescription:
      "提供面试和 offer 阶段可问 recruiter、HR 和 immigration team 的 H-1B/PERM 问题清单。",
    summary:
      "问移民政策时要具体、礼貌、可执行。与其问“公司办不办”，不如问当前岗位 legal entity、H-1B transfer 流程、绿卡启动时间和律师沟通方式。",
    sourceContext:
      "官方 H-1B、PERM 和 wage 来源帮助你准备问题，但公司政策仍需要公司正式确认。",
    checklistTitle: "可直接改写的问题",
    checklist: [
      "这个岗位由哪个 legal entity 雇佣并提交 petition？",
      "H-1B transfer 通常在 offer 后哪个节点启动？",
      "绿卡 PERM 通常何时评估，是否有等待期？",
      "remote/hybrid worksite 和工资背景如何处理？",
    ],
    exampleTitle: "示例问法",
    example:
      "可以说“我看到公开数据里公司有类似岗位记录，想确认这个 team 的 H-1B transfer 和 PERM policy 是否一致”。",
    mistakes: [
      "只问 yes/no sponsor。",
      "过早分享敏感个人信息。",
      "把 recruiter 口头答复当作最终法律确认。",
    ],
    relatedPaths: [
      "/guides/how-to-choose-h1b-sponsor-company",
      "/tools/h1b-transfer-risk-checklist",
      "/tools/perm-restart-timeline-estimator",
    ],
    sourceIds: ["uscisH1B", "flagPerm", "dolPerformance"],
  }),
  page({
    order: 49,
    path: "/guides/h1b-layoff-grace-period-basics",
    kind: "guide",
    category: "求职与公司判断",
    priority: 3,
    title: "H-1B 裁员宽限期基础",
    metaDescription:
      "用中文解释 H-1B worker 遇到 termination 后常见的宽限期和下一步选项背景，避免个案化建议。",
    summary:
      "H-1B 裁员后常见问题包括 grace period、transfer、change of status、离境和新雇主 filing。公开页面只能提供一般背景，个人时间线需要律师确认。",
    sourceContext:
      "USCIS Options for Nonimmigrant Workers Following Termination 页面是官方背景来源；H-1B 页面提供 status 和 petition 背景。",
    checklistTitle: "裁员后先整理",
    checklist: [
      "记录 last day、payroll 和 notice 文件。",
      "整理 I-94、approval notice 和 passport 信息给律师。",
      "评估 H-1B transfer、change of status 或离境选项。",
      "避免在公开工具输入敏感身份信息。",
    ],
    exampleTitle: "示例读法",
    example:
      "如果新雇主愿意快速提交 transfer，仍需要律师核对 filing timing、start date 和个人 status 事实。",
    mistakes: [
      "把 60 天当作任何情况下都完整可用。",
      "只看职位机会，不看 status 时间线。",
      "在非安全表单输入个人身份信息。",
    ],
    relatedPaths: [
      "/tools/h1b-transfer-risk-checklist",
      "/guides/h1b-small-company-sponsor-risk",
      "/h1b",
    ],
    sourceIds: ["uscisGracePeriod", "uscisH1B", "uscisI129"],
  }),
  page({
    order: 50,
    path: "/guides/immigration-friendly-company-checklist",
    kind: "guide",
    category: "求职与公司判断",
    priority: 3,
    title: "华人求职者职业移民友好公司清单",
    metaDescription:
      "把 H-1B、PERM、工资、排期和面试问题合并成职业移民友好公司研究清单。",
    summary:
      "职业移民友好公司不是一个绝对标签。更稳妥的做法是用公开数据和面试问题判断公司是否有相关经验、流程透明度和与你岗位相近的历史记录。",
    sourceContext:
      "DOL、USCIS、FLAG 和 DOS 官方来源分别覆盖 H-1B、PERM、工资和排期，适合组合成求职研究框架。",
    checklistTitle: "综合清单",
    checklist: [
      "H-1B/LCA 近年是否有类似岗位记录。",
      "PERM 是否有同类职位和地点历史。",
      "工资背景是否与地区和岗位匹配。",
      "HR 是否能说明 transfer、PERM 和排期相关流程。",
    ],
    exampleTitle: "示例读法",
    example:
      "一家公司 H-1B 记录多、PERM 记录少，并不代表不适合；它提示你应把绿卡政策作为重点问题。",
    mistakes: [
      "用单一分数取代面试确认。",
      "忽略 legal entity 和 team 差异。",
      "把公开数据当作个人结果预测。",
    ],
    relatedPaths: [
      "/tools/company-immigration-score",
      "/guides/how-to-choose-h1b-sponsor-company",
      "/guides/questions-to-ask-recruiter-about-h1b-green-card",
    ],
    sourceIds: [
      "dolPerformance",
      "uscisEmployerHub",
      "flagPerm",
      "dosVisaBulletin",
    ],
  }),
] as const satisfies readonly ContentPage[];

export const contentPagesByPath = new Map(
  contentPages.map((contentPage) => [contentPage.path, contentPage]),
);

export function listContentPages(kind?: ContentKind): ContentPage[] {
  return contentPages
    .filter((contentPage) => (kind ? contentPage.kind === kind : true))
    .sort((left, right) => left.order - right.order);
}

export function listDynamicToolContentPages(): ContentPage[] {
  return listContentPages("tool").filter(
    (contentPage) => !explicitToolContentPaths.has(contentPage.path),
  );
}

export function getContentPageBySlug(kind: ContentKind, slug: string) {
  return contentPages.find(
    (contentPage) =>
      contentPage.kind === kind && contentPage.slug === slug.trim(),
  );
}

export function getContentSources(
  contentPage: ContentPage,
): readonly OfficialSource[] {
  return contentPage.sourceIds.map(
    (sourceId) => officialContentSources[sourceId],
  );
}

export function getContentRelatedPages(contentPage: ContentPage) {
  return contentPage.relatedPaths
    .map((path) => contentPagesByPath.get(path))
    .filter((relatedPage): relatedPage is ContentPage => Boolean(relatedPage));
}

function page(
  input: Omit<ContentPage, "slug" | "eyebrow" | "lastReviewed"> & {
    eyebrow?: string;
    lastReviewed?: string;
  },
): ContentPage {
  return {
    ...input,
    slug: input.path.split("/").at(-1) ?? input.path,
    eyebrow: input.eyebrow ?? input.category,
    lastReviewed: input.lastReviewed ?? lastReviewed,
  };
}
