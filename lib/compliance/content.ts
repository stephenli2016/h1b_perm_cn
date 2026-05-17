export type OfficialSource = {
  id: string;
  nameZh: string;
  nameEn: string;
  agency: string;
  url: string;
  coversZh: string;
  useZh: string;
  cautionZh: string;
  lastVerified: string;
};

export type MethodologyPage = {
  slug: string;
  path: string;
  title: string;
  description: string;
  sourceIds: readonly string[];
  dataWeUse: readonly string[];
  publicOutputs: readonly string[];
  limits: readonly string[];
  privacyAndQuality: readonly string[];
  relatedLinks: readonly {
    title: string;
    href: string;
    description: string;
    meta: string;
  }[];
};

export type CorrectionRequestType =
  (typeof correctionRequestTypes)[number]["value"];

export const legalDraftNotice = {
  title: "法律与合规文案草案",
  body: "本页为 MVP 阶段的产品合规草案，便于开发和内部测试。生产上线前需要 owner 和合格法律专业人士审阅批准。",
} as const;

export const officialSources = [
  {
    id: "oflc-performance",
    nameZh: "DOL OFLC Performance Data / Disclosure Data",
    nameEn: "DOL OFLC Performance Data",
    agency: "U.S. Department of Labor, Office of Foreign Labor Certification",
    url: "https://www.dol.gov/agencies/eta/foreign-labor/performance",
    coversZh:
      "LCA/H-1B、PERM、Prevailing Wage 等 disclosure data 和 program record layouts。",
    useZh:
      "用于雇主、职位、地点、工资、状态、财政年度和公开记录覆盖期的基础数据。",
    cautionZh:
      "DOL 说明部分字段由雇主提交，可能存在输入错误、空值、后续 appeal/redetermination 变化，并排除部分 PII 字段。",
    lastVerified: "2026-05-17",
  },
  {
    id: "flag-wage-downloads",
    nameZh: "DOL/FLAG OFLC Wage Data Downloads",
    nameEn: "OFLC Wage Data Downloads",
    agency: "U.S. Department of Labor / FLAG",
    url: "https://flag.dol.gov/wage-data/wage-data-downloads",
    coversZh:
      "当前和历史 prevailing wage 数据文件，包括全国、地理和职业信息表。",
    useZh: "用于 H-1B wage level 工具、工资上下文、SOC 和 worksite 对照。",
    cautionZh:
      "工资文件按 wage year 发布，不能单独判断某个 H-1B petition 是否合规或会获批。",
    lastVerified: "2026-05-17",
  },
  {
    id: "uscis-h1b-employer-data-hub",
    nameZh: "USCIS H-1B Employer Data Hub Files",
    nameEn: "USCIS H-1B Employer Data Hub Files",
    agency: "U.S. Citizenship and Immigration Services",
    url: "https://www.uscis.gov/archive/h-1b-employer-data-hub-files",
    coversZh:
      "按 fiscal year 下载的 H-1B employer-level petition first-decision 数据文件。",
    useZh:
      "用于补充雇主 H-1B petition 层面的初始/继续就业 first-decision 公开信号。",
    cautionZh:
      "Employer Data Hub 不等于 LCA，也不覆盖个人完整移民路径；归并雇主时需处理名称和地点差异。",
    lastVerified: "2026-05-17",
  },
  {
    id: "dos-visa-bulletin",
    nameZh: "U.S. Department of State Visa Bulletin",
    nameEn: "The Visa Bulletin",
    agency: "U.S. Department of State",
    url: "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html",
    coversZh:
      "每月移民签证排期表，包括 Final Action Dates 和 Dates for Filing。",
    useZh: "用于中国大陆出生职业移民 EB-1、EB-2、EB-3 排期页面和优先日工具。",
    cautionZh:
      "排期表不是个人可递交或可获批保证；AOS 还需查看 USCIS 当月 chart selection。",
    lastVerified: "2026-05-17",
  },
  {
    id: "uscis-filing-charts",
    nameZh: "USCIS Adjustment of Status Filing Charts",
    nameEn: "Adjustment of Status Filing Charts from the Visa Bulletin",
    agency: "U.S. Citizenship and Immigration Services",
    url: "https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin",
    coversZh: "USCIS 每月说明 AOS 申请人应使用 Visa Bulletin 的哪一张表。",
    useZh:
      "用于解释在美国境内 adjustment of status 场景下 chart A / chart B 的选择。",
    cautionZh:
      "USCIS chart selection 按月更新，且只解决 filing chart 使用问题，不替代资格判断。",
    lastVerified: "2026-05-17",
  },
  {
    id: "uscis-find-legal-services",
    nameZh: "USCIS Find Legal Services / Avoid Scams",
    nameEn: "Find Legal Services and Avoid Scams",
    agency: "U.S. Citizenship and Immigration Services",
    url: "https://www.uscis.gov/scams-fraud-and-misconduct/avoid-scams/find-legal-services",
    coversZh:
      "如何寻找授权移民法律服务，以及避免未授权法律建议和移民服务诈骗。",
    useZh: "用于本站免责声明、服务边界和“不要把数据页当法律建议”的合规说明。",
    cautionZh:
      "需要移民法律建议时，应咨询合格律师或 DOJ 认可机构代表，而不是依赖网站工具。",
    lastVerified: "2026-05-17",
  },
] as const satisfies readonly OfficialSource[];

export const correctionRequestTypes = [
  {
    value: "data-error",
    labelZh: "数据展示错误",
    descriptionZh: "页面字段、年份、状态、职位、地点或统计口径可能展示有误。",
  },
  {
    value: "employer-merge",
    labelZh: "雇主名称归并问题",
    descriptionZh: "公司别名、分支机构、大小写或历史名称可能被错误合并或拆分。",
  },
  {
    value: "privacy",
    labelZh: "隐私或低样本展示问题",
    descriptionZh: "页面可能暴露不必要个人信息，或小样本组合需要聚合/隐藏。",
  },
  {
    value: "source-context",
    labelZh: "来源或解释需要补充",
    descriptionZh: "数据来源、覆盖期、方法解释或免责声明需要更清楚。",
  },
] as const;

export const methodologyPages = [
  {
    slug: "lca",
    path: "/methodology/lca",
    title: "LCA / H-1B 公开数据方法说明",
    description:
      "解释本站如何使用 DOL OFLC LCA disclosure data 呈现 H-1B 雇主、职位、地点和工资信号。",
    sourceIds: ["oflc-performance"],
    dataWeUse: [
      "DOL OFLC LCA disclosure data 中的 employer、worksite、job title、SOC、wage、decision date、case status 和 fiscal year。",
      "Record layout 中定义的字段含义，用来避免把同名字段跨年份错误混用。",
      "本地 employer canonicalization 规则，用来处理大小写、标点、实体后缀和常见别名。",
    ],
    publicOutputs: [
      "近年 LCA 记录数量、认证/撤回/拒绝等状态摘要。",
      "职位、地点、SOC 和工资区间的公开数据分布。",
      "来源日期、覆盖财政年度和如何阅读页面的中文说明。",
    ],
    limits: [
      "LCA 是劳动条件申请，不是 USCIS H-1B petition approval。",
      "认证的 LCA 不代表雇主实际雇佣、已提交 I-129、未来一定 sponsor 或个案一定获批。",
      "工资字段可能是 hourly/monthly/yearly 等不同单位，需要按 record layout 标准化后展示。",
    ],
    privacyAndQuality: [
      "不展示 foreign worker names、个人地址、FEIN 或不必要个人识别信息。",
      "小样本职位/地点组合优先聚合，并在页面上提示样本不足。",
      "发现来源文件错误或页面映射错误时，通过纠错流程记录并复核。",
    ],
    relatedLinks: [
      {
        title: "H-1B 公司数据库",
        href: "/h1b",
        description: "按公司查看 LCA 与 USCIS Employer Data Hub 公开信号。",
        meta: "数据入口",
      },
      {
        title: "H-1B 工资 Level 中文判断工具",
        href: "/tools/h1b-wage-level-checker",
        description: "用 DOL/FLAG wage data 做工资背景对照。",
        meta: "工具",
      },
    ],
  },
  {
    slug: "perm",
    path: "/methodology/perm",
    title: "PERM 公开数据方法说明",
    description:
      "解释本站如何使用 DOL OFLC PERM disclosure data 呈现雇主绿卡/PERM 历史信号。",
    sourceIds: ["oflc-performance"],
    dataWeUse: [
      "DOL OFLC PERM disclosure data 中的 employer、worksite、job title、SOC、case status、filing date、decision date 和 fiscal year。",
      "PERM record layout，用于解释不同财政年度字段名和字段口径差异。",
      "雇主 canonicalization 和低样本规则，用于减少名称归并误差和过度推断。",
    ],
    publicOutputs: [
      "近年 PERM 记录数量和 certified/denied/withdrawn 等状态摘要。",
      "职位、地点、SOC、工资和申请时间线的聚合展示。",
      "与 H-1B/LCA 公开记录并列的雇主职业移民背景信号。",
    ],
    limits: [
      "PERM certified 不等于 I-140 或 I-485 已批准，也不代表员工一定拿到绿卡。",
      "PERM 公开数据通常滞后于真实案件进展；后续步骤不一定进入公开数据。",
      "单个公司不同实体、不同地点和历史名称可能影响归并质量。",
    ],
    privacyAndQuality: [
      "不展示 foreign worker names 或可识别个人的组合信息。",
      "对过小职位/地点组合使用聚合或谨慎提示。",
      "任何“公司适合绿卡规划”的表达都必须回到公开数据证据，不作法律结论。",
    ],
    relatedLinks: [
      {
        title: "PERM / 绿卡公司数据库",
        href: "/perm",
        description: "查看公司 PERM 历史公开记录和状态摘要。",
        meta: "数据入口",
      },
      {
        title: "跳槽后 PERM 重办时间线估算器",
        href: "/tools/perm-restart-timeline-estimator",
        description: "理解跳槽或换职位后可能涉及的 PERM 时间线节点。",
        meta: "工具",
      },
    ],
  },
  {
    slug: "wage",
    path: "/methodology/wage",
    title: "Prevailing Wage / 工资数据方法说明",
    description:
      "解释本站如何使用 DOL/FLAG wage data 和 OFLC wage records 呈现 H-1B 工资背景。",
    sourceIds: ["flag-wage-downloads", "oflc-performance"],
    dataWeUse: [
      "DOL/FLAG wage year 文件中的 SOC、area、level 1-4 wage 和 geographic 信息。",
      "OFLC LCA/PWD disclosure data 中的工资单位、工作地点、SOC 和 decision date。",
      "工资标准化逻辑，将 hourly/monthly/yearly 等单位转成可比较但仍带单位说明的值。",
    ],
    publicOutputs: [
      "H-1B wage level 工具中的 level 区间、匹配地点和 wage year。",
      "公司页中的工资上下文、职位工资分布和公开样本数量。",
      "无法精确匹配时的弱信号提示，例如只匹配州级或样本不足。",
    ],
    limits: [
      "工资数据不能单独判断岗位是否合规、是否 specialty occupation 或 petition 是否会获批。",
      "SOC 选择、岗位职责、经验要求和 worksite 都可能影响正式 prevailing wage 判断。",
      "历史 LCA 工资不代表当前 offer，也不代表雇主未来工资承诺。",
    ],
    privacyAndQuality: [
      "不收集用户 offer letter、雇佣合同或个人身份文件。",
      "用户输入只用于本地页面计算；MVP stub 不保存个人工资查询。",
      "低样本工资分布以提示形式展示，不把少量记录包装成市场结论。",
    ],
    relatedLinks: [
      {
        title: "H-1B 工资 Level 中文判断工具",
        href: "/tools/h1b-wage-level-checker",
        description: "按 SOC、worksite、工资和 wage year 对照官方 wage data。",
        meta: "工具",
      },
      {
        title: "公司目录",
        href: "/companies",
        description: "在公司页中查看工资、职位和地点公开数据上下文。",
        meta: "数据入口",
      },
    ],
  },
  {
    slug: "visa-bulletin",
    path: "/methodology/visa-bulletin",
    title: "Visa Bulletin / 排期方法说明",
    description:
      "解释本站如何使用 DOS Visa Bulletin 和 USCIS filing chart 页面呈现中国职业移民排期。",
    sourceIds: ["dos-visa-bulletin", "uscis-filing-charts"],
    dataWeUse: [
      "Department of State 每月 Visa Bulletin 中职业移民 EB-1、EB-2、EB-3 的 China-mainland born cut-off dates。",
      "Final Action Dates 与 Dates for Filing 两张表的类别、国家/地区和日期字段。",
      "USCIS 当月 Adjustment of Status filing chart selection。",
    ],
    publicOutputs: [
      "按月份展示中国大陆出生 EB 类别排期、是否 current、倒退/前进和上月对比。",
      "优先日工具中对 priority date 与选定月份/图表的机械对照。",
      "清楚区分 DOS Visa Bulletin 和 USCIS AOS chart selection。",
    ],
    limits: [
      "排期对照不等于个人可以递交、一定应递交或一定获批。",
      "在美国境内 AOS 与境外 consular processing 可能适用不同实践，需要专业判断。",
      "Priority date、chargeability、类别、身份维持和基础 petition 情况都可能影响个人选择。",
    ],
    privacyAndQuality: [
      "工具不要求用户输入姓名、A-Number、receipt number、护照号或完整个人案情。",
      "只展示公开月份数据，不推断个人案件结果。",
      "每月数据更新后必须保留来源日期和 chart selection 说明。",
    ],
    relatedLinks: [
      {
        title: "中国职业移民排期",
        href: "/visa-bulletin",
        description: "查看月度 EB 中国排期和 chart selection 解释。",
        meta: "数据入口",
      },
      {
        title: "EB 优先日排期计算器",
        href: "/tools/eb2-eb3-china-priority-date-calculator",
        description: "用 priority date 与公开排期做机械对照。",
        meta: "工具",
      },
    ],
  },
  {
    slug: "employer-signal",
    path: "/methodology/employer-signal",
    title: "雇主公开数据友好度信号方法说明",
    description:
      "解释本站如何把 H-1B、PERM、USCIS Employer Data Hub 和工资上下文组合成谨慎的雇主公开数据信号。",
    sourceIds: [
      "oflc-performance",
      "uscis-h1b-employer-data-hub",
      "flag-wage-downloads",
    ],
    dataWeUse: [
      "近 5 个 fiscal years 的 LCA、PERM 和 USCIS employer-level 公开记录。",
      "职位、地点、SOC、工资上下文、来源数量、最新数据日期和低样本标记。",
      "本地 employer canonicalization 输出，用来连接 H-1B 与 PERM 公司页。",
    ],
    publicOutputs: [
      "公司页的公开数据覆盖、连续性、来源和解释质量信号。",
      "维度化证据，例如 H-1B 历史、PERM 历史、跨年记录、职位/地点覆盖和工资上下文。",
      "低样本、薄数据和 noindex 阈值提示。",
    ],
    limits: [
      "信号不是 sponsor 成功率、H-1B 成功率、PERM 成功率或法律建议。",
      "高分不代表公司未来一定 sponsor；低分也不代表公司不能 sponsor。",
      "公开数据无法覆盖雇主内部政策、律师策略、岗位资格和个人案情。",
    ],
    privacyAndQuality: [
      "不展示个人姓名、个人地址或其他不必要识别信息。",
      "小样本组合优先聚合或限制解释，不从少量记录推断个体身份。",
      "任何纠错请求都会优先检查来源、归并规则、低样本风险和免责声明是否足够清楚。",
    ],
    relatedLinks: [
      {
        title: "公司公开数据友好度信号工具页",
        href: "/tools/company-immigration-score",
        description: "查看信号维度、示例和评分边界。",
        meta: "方法延伸",
      },
      {
        title: "公司目录",
        href: "/companies",
        description: "按公司查看 H-1B、PERM 和工资公开数据信号。",
        meta: "数据入口",
      },
    ],
  },
] as const satisfies readonly MethodologyPage[];

export function getOfficialSource(id: string) {
  return officialSources.find((source) => source.id === id);
}

export function getMethodologyPage(slug: string) {
  return methodologyPages.find((page) => page.slug === slug);
}

export function isCorrectionRequestType(
  value: string,
): value is CorrectionRequestType {
  return correctionRequestTypes.some((type) => type.value === value);
}

export function buildCorrectionRequestPublicId(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `VR-COR-${date}-${suffix}`;
}
