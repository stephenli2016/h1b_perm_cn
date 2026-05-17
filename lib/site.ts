export const siteConfig = {
  name: "VisaRadar CN",
  chineseName: "华人职业移民雷达",
  tagline: "查公司、查工资、查 PERM、查排期",
  description:
    "面向海外华人的 H-1B、PERM、Prevailing Wage 和中国职业移民排期公开数据决策支持网站。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@example.com",
  shortDisclaimer: "公开数据仅供参考，不代表个案结果。",
  fullDisclaimer:
    "本站基于公开数据整理，仅供信息参考，不构成法律、移民、税务、职业或财务建议。LCA、PERM、H-1B Employer Data Hub、Visa Bulletin 等公开记录并不代表个案批准、雇主实际录用、雇主未来承诺或律师意见。具体情况请咨询持牌移民律师或相关专业人士。",
} as const;

export type RouteSection =
  | "home"
  | "companies"
  | "h1b"
  | "perm"
  | "tools"
  | "guides"
  | "visa-bulletin"
  | "methodology"
  | "compliance"
  | "about";

export type IndexingPlan = "indexable" | "noindex-until-data" | "conditional";

export type PublicRoute = {
  path: string;
  samplePath?: string;
  label: string;
  title: string;
  description: string;
  section: RouteSection;
  nav: boolean;
  sitemapGroup: string;
  indexing: IndexingPlan;
  dataPage: boolean;
};

export const publicRoutes = [
  {
    path: "/",
    label: "首页",
    title: "华人职业移民雷达",
    description: "用中文理解美国 H-1B、PERM、工资和中国职业移民排期公开数据。",
    section: "home",
    nav: true,
    sitemapGroup: "core",
    indexing: "indexable",
    dataPage: false,
  },
  {
    path: "/companies",
    label: "公司目录",
    title: "公司目录",
    description:
      "从一个入口合并查看公司 H-1B、PERM、职位、地点和公开数据覆盖情况。",
    section: "companies",
    nav: false,
    sitemapGroup: "data-directory",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/h1b",
    label: "H-1B",
    title: "H-1B 公司数据库",
    description:
      "查询公司 H-1B LCA、USCIS Employer Data Hub、职位、地点和工资公开数据。",
    section: "h1b",
    nav: true,
    sitemapGroup: "data-directory",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/h1b/company/[slug]",
    label: "H-1B 公司页",
    title: "H-1B 公司公开数据页",
    description: "单个雇主的 H-1B/LCA 年度、职位、地点和工资公开数据信号页面。",
    section: "h1b",
    nav: false,
    sitemapGroup: "company-pages",
    indexing: "conditional",
    dataPage: true,
  },
  {
    path: "/perm",
    label: "PERM",
    title: "PERM / 绿卡公司数据库",
    description:
      "查询公司 PERM 劳工认证公开记录，理解绿卡 sponsor 历史信号和限制。",
    section: "perm",
    nav: true,
    sitemapGroup: "data-directory",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/perm/company/[slug]",
    samplePath: "/perm/company/brightline-health",
    label: "PERM 公司页",
    title: "PERM 公司公开数据页",
    description: "单个雇主的 PERM 年度、职位、地点和状态公开数据信号页面。",
    section: "perm",
    nav: false,
    sitemapGroup: "company-pages",
    indexing: "conditional",
    dataPage: true,
  },
  {
    path: "/tools",
    label: "工具",
    title: "职业移民工具",
    description: "12 个 H-1B、PERM、工资、排期和跳槽时间线中文工具入口。",
    section: "tools",
    nav: true,
    sitemapGroup: "tools",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/tools/h1b-wage-level-checker",
    label: "H-1B 工资 Level",
    title: "H-1B 工资 Level 中文判断工具",
    description:
      "按 SOC、worksite、offered wage 和 wage year 对照 DOL/FLAG prevailing wage level 公开数据。",
    section: "tools",
    nav: false,
    sitemapGroup: "tools",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/tools/eb2-eb3-china-priority-date-calculator",
    label: "EB 优先日排期计算器",
    title: "中国 EB-2 / EB-3 优先日排期计算器",
    description:
      "按职业移民类别、priority date、Visa Bulletin 月份和 chart type 对照中国大陆出生 EB 排期公开数据。",
    section: "tools",
    nav: false,
    sitemapGroup: "tools",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/tools/company-immigration-score",
    label: "公司公开数据友好度信号",
    title: "公司职业移民公开数据友好度信号",
    description:
      "解释公司页公开数据友好度信号如何按 H-1B、PERM、跨年记录、来源、职位地点和工资上下文生成。",
    section: "tools",
    nav: false,
    sitemapGroup: "tools",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/tools/h1b-transfer-risk-checklist",
    label: "H-1B Transfer 风险清单",
    title: "H-1B Transfer 风险清单",
    description:
      "用通用教育性场景核对 H-1B 换雇主前应问 HR、律师和新雇主 immigration team 的问题。",
    section: "tools",
    nav: false,
    sitemapGroup: "tools",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/tools/perm-restart-timeline-estimator",
    label: "PERM 重启时间线",
    title: "跳槽后 PERM 重办时间线估算器",
    description:
      "用通用教育性场景理解跳槽、换职位或换地点后 PERM 可能涉及的重新规划节点。",
    section: "tools",
    nav: false,
    sitemapGroup: "tools",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/tools/opt-to-h1b-timeline",
    label: "OPT 到 H-1B 时间线",
    title: "OPT 到 H-1B 时间线规划器",
    description:
      "按毕业、OPT/STEM OPT、H-1B cap season 和雇主准备节点生成通用核对时间线。",
    section: "tools",
    nav: false,
    sitemapGroup: "tools",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/tools/stem-opt-employer-checklist",
    label: "STEM OPT 雇主清单",
    title: "STEM OPT 雇主检查清单",
    description:
      "核对 E-Verify、I-983、雇主培训计划和未来 H-1B/PERM 沟通问题。",
    section: "tools",
    nav: false,
    sitemapGroup: "tools",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/tools/wage-negotiation-with-h1b-data",
    label: "H-1B 数据谈薪",
    title: "用 H-1B 数据做谈薪参考",
    description:
      "把公开 H-1B 工资、SOC、worksite 和 prevailing wage 背景整理成谈薪问题清单。",
    section: "tools",
    nav: false,
    sitemapGroup: "tools",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/tools/visa-bulletin-alert",
    label: "排期提醒清单",
    title: "中国职业移民排期提醒清单",
    description:
      "按 EB 类别和 USCIS filing chart 选择生成每月排期更新时该检查的事项。",
    section: "tools",
    nav: false,
    sitemapGroup: "tools",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/guides",
    label: "指南",
    title: "职业移民中文指南",
    description:
      "38 篇解释 LCA、PERM、Prevailing Wage、Visa Bulletin 和求职决策的中文指南目录。",
    section: "guides",
    nav: true,
    sitemapGroup: "guides",
    indexing: "indexable",
    dataPage: false,
  },
  {
    path: "/visa-bulletin",
    label: "排期",
    title: "中国职业移民排期",
    description:
      "面向中国大陆出生申请人的 EB-1、EB-2、EB-3 Visa Bulletin 和 USCIS filing chart 解读入口。",
    section: "visa-bulletin",
    nav: true,
    sitemapGroup: "visa-bulletin",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/visa-bulletin/[year]/[month]",
    samplePath: "/visa-bulletin/2026/06",
    label: "月度排期页",
    title: "中国职业移民月度排期",
    description:
      "按月份查看中国大陆出生 EB-1、EB-2、EB-3 Final Action Dates、Dates for Filing 和 USCIS filing chart 选择。",
    section: "visa-bulletin",
    nav: false,
    sitemapGroup: "visa-bulletin",
    indexing: "conditional",
    dataPage: true,
  },
  {
    path: "/about",
    label: "关于",
    title: "关于 VisaRadar CN",
    description: "了解本站目标、数据原则和为什么用谨慎方式呈现公开移民数据。",
    section: "about",
    nav: true,
    sitemapGroup: "core",
    indexing: "indexable",
    dataPage: false,
  },
  {
    path: "/disclaimer",
    label: "免责声明",
    title: "免责声明",
    description:
      "本站内容仅供信息参考，不构成法律、移民、税务、职业或财务建议。",
    section: "compliance",
    nav: false,
    sitemapGroup: "compliance",
    indexing: "indexable",
    dataPage: false,
  },
  {
    path: "/privacy",
    label: "隐私",
    title: "隐私政策",
    description: "隐私原则、最小化收集和敏感信息保护说明。",
    section: "compliance",
    nav: false,
    sitemapGroup: "compliance",
    indexing: "indexable",
    dataPage: false,
  },
  {
    path: "/terms",
    label: "使用条款",
    title: "使用条款",
    description: "说明本站的公开数据定位、可接受使用、纠错路径和责任边界。",
    section: "compliance",
    nav: false,
    sitemapGroup: "compliance",
    indexing: "indexable",
    dataPage: false,
  },
  {
    path: "/corrections",
    label: "纠错",
    title: "数据纠错与移除请求",
    description: "提交雇主名称、页面展示或隐私相关问题的纠错请求路径。",
    section: "compliance",
    nav: false,
    sitemapGroup: "compliance",
    indexing: "indexable",
    dataPage: false,
  },
  {
    path: "/sources",
    label: "数据来源",
    title: "数据来源",
    description: "列出本站使用的官方数据来源、用途、覆盖边界和谨慎解释方式。",
    section: "methodology",
    nav: false,
    sitemapGroup: "compliance",
    indexing: "indexable",
    dataPage: false,
  },
  {
    path: "/methodology/lca",
    label: "LCA 方法",
    title: "LCA / H-1B 公开数据方法说明",
    description:
      "解释本站如何使用 DOL OFLC LCA disclosure data 呈现 H-1B 雇主、职位、地点和工资信号。",
    section: "methodology",
    nav: false,
    sitemapGroup: "compliance",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/methodology/perm",
    label: "PERM 方法",
    title: "PERM 公开数据方法说明",
    description:
      "解释本站如何使用 DOL OFLC PERM disclosure data 呈现雇主绿卡/PERM 历史信号。",
    section: "methodology",
    nav: false,
    sitemapGroup: "compliance",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/methodology/wage",
    label: "工资方法",
    title: "Prevailing Wage / 工资数据方法说明",
    description:
      "解释本站如何使用 DOL/FLAG wage data 和 OFLC wage records 呈现 H-1B 工资背景。",
    section: "methodology",
    nav: false,
    sitemapGroup: "compliance",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/methodology/visa-bulletin",
    label: "排期方法",
    title: "Visa Bulletin / 排期方法说明",
    description:
      "解释本站如何使用 DOS Visa Bulletin 和 USCIS filing chart 页面呈现中国职业移民排期。",
    section: "methodology",
    nav: false,
    sitemapGroup: "compliance",
    indexing: "indexable",
    dataPage: true,
  },
  {
    path: "/methodology/employer-signal",
    label: "雇主信号方法",
    title: "雇主公开数据友好度信号方法说明",
    description:
      "解释本站如何把 H-1B、PERM、USCIS Employer Data Hub 和工资上下文组合成谨慎的雇主公开数据信号。",
    section: "methodology",
    nav: false,
    sitemapGroup: "compliance",
    indexing: "indexable",
    dataPage: true,
  },
] as const satisfies readonly PublicRoute[];

export const primaryNavItems = publicRoutes.filter((route) => route.nav);

export const footerNavGroups = [
  {
    title: "数据入口",
    links: publicRoutes.filter(
      (route) =>
        ["companies", "h1b", "perm", "tools", "visa-bulletin"].includes(
          route.section,
        ) &&
        (!route.path.includes("[") || "samplePath" in route),
    ),
  },
  {
    title: "学习与背景",
    links: publicRoutes.filter((route) =>
      ["guides", "about"].includes(route.section),
    ),
  },
  {
    title: "方法与来源",
    links: publicRoutes.filter((route) => route.section === "methodology"),
  },
  {
    title: "合规",
    links: publicRoutes.filter((route) => route.section === "compliance"),
  },
] as const;

export const officialSourceNames = [
  "DOL OFLC LCA / H-1B disclosure data",
  "DOL OFLC PERM disclosure data",
  "DOL / FLAG prevailing wage data",
  "USCIS H-1B Employer Data Hub",
  "U.S. Department of State Visa Bulletin",
  "USCIS Adjustment of Status filing chart",
] as const;

export function getRoute(path: string) {
  return publicRoutes.find((route) => route.path === path);
}

export function getCanonicalUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}
