export type Employer = {
  id: string;
  canonicalName: string;
  displayName: string;
  slug: string;
  normalizedName: string;
  headquartersLocationId?: string;
};

export type EmployerAlias = {
  id: string;
  employerId: string;
  rawName: string;
  normalizedName: string;
  sourceSystem: "oflc_lca" | "oflc_perm" | "uscis_h1b_hub" | "manual_seed";
  confidenceScore: number;
  reviewStatus: "auto" | "manual" | "needs_review";
};

export type Location = {
  id: string;
  city: string;
  state: string;
  postalCode?: string;
  country: "US";
  normalizedKey: string;
};

export type SourceFile = {
  id: string;
  sourceName: string;
  officialUrl: string;
  fiscalYear?: number;
  quarter?: string;
  fileType: string;
  latestDataDate?: string;
};

export type H1BLcaRecord = {
  id: string;
  sourceFileId: string;
  employerId: string;
  locationId: string;
  sourceRecordId: string;
  sourceRecordFingerprint: string;
  caseNumber: string;
  caseStatus: "CERTIFIED" | "WITHDRAWN" | "DENIED";
  rawEmployerName: string;
  fiscalYear: number;
  socCode: string;
  socTitle: string;
  jobTitle: string;
  worksiteCity: string;
  worksiteState: string;
  wageRateOfPayFrom: number;
  wageRateOfPayTo?: number;
  wageUnit: "Year" | "Hour";
  annualizedWageFrom: number;
  annualizedWageTo?: number;
  prevailingWage: number;
  prevailingWageUnit: "Year" | "Hour";
  wageLevel?: "I" | "II" | "III" | "IV";
  fullTime: boolean;
  receivedDate: string;
  decisionDate: string;
};

export type PermRecord = {
  id: string;
  sourceFileId: string;
  employerId: string;
  locationId: string;
  sourceRecordId: string;
  sourceRecordFingerprint: string;
  caseNumber: string;
  caseStatus: "Certified" | "Denied" | "Withdrawn";
  rawEmployerName: string;
  fiscalYear: number;
  jobTitle: string;
  socCode: string;
  socTitle: string;
  worksiteCity: string;
  worksiteState: string;
  wageOfferFrom: number;
  wageOfferTo?: number;
  wageUnit: "Year" | "Hour";
  priorityDate?: string;
  receivedDate: string;
  decisionDate: string;
};

export type PwdRecord = {
  id: string;
  sourceFileId: string;
  locationId: string;
  sourceRecordId: string;
  sourceRecordFingerprint: string;
  dataSeries: string;
  effectiveYear: number;
  socCode: string;
  socTitle: string;
  areaName: string;
  city: string;
  state: string;
  wageLevel1: number;
  wageLevel2: number;
  wageLevel3: number;
  wageLevel4: number;
  wageUnit: "Year" | "Hour";
};

export type UscisH1BEmployerRecord = {
  id: string;
  sourceFileId: string;
  employerId: string;
  sourceRecordId: string;
  sourceRecordFingerprint: string;
  fiscalYear: number;
  rawEmployerName: string;
  city: string;
  state: string;
  postalCode: string;
  naicsCode: string;
  initialApprovals: number;
  initialDenials: number;
  continuingApprovals: number;
  continuingDenials: number;
};

export type VisaBulletinMonth = {
  id: string;
  monthKey: string;
  bulletinYear: number;
  bulletinMonth: number;
  sourceUrl: string;
  publishedAt: string;
  uscisFilingChart: "final_action" | "dates_for_filing";
};

export type VisaBulletinDate = {
  id: string;
  bulletinMonthId: string;
  category: "EB-1" | "EB-2" | "EB-3";
  chargeabilityArea: "china-mainland";
  chartType: "final_action" | "dates_for_filing";
  cutoffDate?: string;
  cutoffStatus: "date" | "current" | "unavailable";
  rawValue: string;
};

export type CompanyPageMetrics = {
  id: string;
  employerId: string;
  lcaCount5y: number;
  permCount5y: number;
  uscisRecordCount5y: number;
  jobTitleCount: number;
  locationCount: number;
  latestFiscalYear: number;
  qualityScore: number;
  indexable: boolean;
  noindexReason?: string;
};

export type CompanyYearlyImmigrationStats = {
  id: string;
  employerId: string;
  fiscalYear: number;
  h1bTotal: number;
  h1bCertified: number;
  h1bWithdrawn: number;
  h1bDenied: number;
  permTotal: number;
  permCertified: number;
  permDenied: number;
  permWithdrawn: number;
  uscisRecordCount: number;
  uscisInitialApprovals: number;
  uscisInitialDenials: number;
  uscisContinuingApprovals: number;
  uscisContinuingDenials: number;
};

export type CompanyBreakdownStats = {
  id: string;
  employerId: string;
  kind: "job_title" | "location";
  label: string;
  key: string;
  socCode?: string;
  socTitle?: string;
  city?: string;
  state?: string;
  h1bCount: number;
  permCount: number;
  totalCount: number;
  latestFiscalYear: number;
};

export type CompanyWageStats = {
  id: string;
  employerId: string;
  recordCount: number;
  wageUnit: "Year";
  minWage: number;
  p25Wage: number;
  medianWage: number;
  p75Wage: number;
  maxWage: number;
  fiscalYears: readonly number[];
};

export type CompanySourceStats = {
  id: string;
  employerId: string;
  sourceFileIds: readonly string[];
  sourceNames: readonly string[];
  latestDataDate?: string;
};

export type GuidePage = {
  slug: string;
  titleZh: string;
  metaDescriptionZh: string;
  section: string;
  priority: 1 | 2 | 3;
  status: "planned" | "draft" | "published";
  lastReviewedOn?: string;
  officialSources: readonly string[];
};

export type CorrectionRequest = {
  id: string;
  publicId: string;
  pageUrl?: string;
  employerId?: string;
  requestType: "canonicalization" | "display_error" | "privacy" | "other";
  submitterEmail?: string;
  description: string;
  status: "new" | "reviewing" | "resolved" | "rejected";
};

export type EtlRun = {
  id: string;
  parserName: string;
  sourceFileId?: string;
  status: "success" | "failed" | "running";
  startedAt: string;
  completedAt?: string;
  recordsSeen: number;
  recordsInserted: number;
  recordsFailed: number;
  message?: string;
};

export type FixtureData = {
  employers: readonly Employer[];
  employerAliases: readonly EmployerAlias[];
  locations: readonly Location[];
  sourceFiles: readonly SourceFile[];
  h1bLcaRecords: readonly H1BLcaRecord[];
  permRecords: readonly PermRecord[];
  pwdRecords: readonly PwdRecord[];
  uscisH1BEmployerRecords: readonly UscisH1BEmployerRecord[];
  visaBulletinMonths: readonly VisaBulletinMonth[];
  visaBulletinDates: readonly VisaBulletinDate[];
  companyPageMetrics: readonly CompanyPageMetrics[];
  companyYearlyImmigrationStats?: readonly CompanyYearlyImmigrationStats[];
  companyBreakdownStats?: readonly CompanyBreakdownStats[];
  companyWageStats?: readonly CompanyWageStats[];
  companySourceStats?: readonly CompanySourceStats[];
  guidePages: readonly GuidePage[];
  correctionRequests: readonly CorrectionRequest[];
  etlRuns: readonly EtlRun[];
};
