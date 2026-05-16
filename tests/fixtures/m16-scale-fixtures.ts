import { localFixtureData } from "@/data/fixtures/local-fixtures";
import type {
  Employer,
  EmployerAlias,
  FixtureData,
  H1BLcaRecord,
  Location,
  PermRecord,
  SourceFile,
} from "@/lib/db/types";

export function createM16ScaleFixtureData(companyCount = 500): FixtureData {
  const sourceFiles: SourceFile[] = [
    {
      id: "source-m16-generated-lca-fy2026",
      sourceName: "M16 generated local validation fixture - DOL OFLC LCA",
      officialUrl: "https://www.dol.gov/agencies/eta/foreign-labor/performance",
      fiscalYear: 2026,
      quarter: "local-validation",
      fileType: "csv",
      latestDataDate: "2026-03-31",
    },
    {
      id: "source-m16-generated-perm-fy2026",
      sourceName: "M16 generated local validation fixture - DOL OFLC PERM",
      officialUrl: "https://www.dol.gov/agencies/eta/foreign-labor/performance",
      fiscalYear: 2026,
      quarter: "local-validation",
      fileType: "csv",
      latestDataDate: "2026-03-31",
    },
  ];
  const locations = buildLocations();
  const employers: Employer[] = [];
  const employerAliases: EmployerAlias[] = [];
  const h1bLcaRecords: H1BLcaRecord[] = [];
  const permRecords: PermRecord[] = [];

  for (let companyIndex = 0; companyIndex < companyCount; companyIndex += 1) {
    const number = String(companyIndex + 1).padStart(3, "0");
    const employerId = `emp-m16-${number}`;
    const displayName = `M16 Validation Employer ${number}`;
    const slug = `m16-validation-employer-${number}`;
    const headquarters = locations[companyIndex % locations.length]!;

    employers.push({
      id: employerId,
      canonicalName: `${displayName} LLC`,
      displayName,
      slug,
      normalizedName: `m16 validation employer ${number}`,
      headquartersLocationId: headquarters.id,
    });
    employerAliases.push({
      id: `alias-m16-${number}-lca`,
      employerId,
      rawName: `${displayName.toUpperCase()} LLC`,
      normalizedName: `m16 validation employer ${number}`,
      sourceSystem: "oflc_lca",
      confidenceScore: 0.98,
      reviewStatus: "auto",
    });

    h1bLcaRecords.push(
      ...buildH1BRecords(employerId, displayName, companyIndex, locations),
    );
    permRecords.push(
      ...buildPermRecords(employerId, displayName, companyIndex, locations),
    );
  }

  return {
    ...localFixtureData,
    employers,
    employerAliases,
    locations,
    sourceFiles,
    h1bLcaRecords,
    permRecords,
    pwdRecords: [],
    uscisH1BEmployerRecords: [],
    companyPageMetrics: [],
  };
}

function buildLocations(): Location[] {
  return [
    ["Seattle", "WA", "98101"],
    ["Bellevue", "WA", "98004"],
    ["San Jose", "CA", "95113"],
    ["San Francisco", "CA", "94105"],
    ["Austin", "TX", "78701"],
    ["Dallas", "TX", "75201"],
    ["Boston", "MA", "02110"],
    ["Cambridge", "MA", "02139"],
    ["New York", "NY", "10001"],
    ["Jersey City", "NJ", "07302"],
    ["Chicago", "IL", "60601"],
    ["Atlanta", "GA", "30303"],
  ].map(([city, state, postalCode]) => ({
    id: `loc-m16-${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${state.toLowerCase()}`,
    city,
    state,
    postalCode,
    country: "US" as const,
    normalizedKey: `${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${state.toLowerCase()}-${postalCode}`,
  }));
}

function buildH1BRecords(
  employerId: string,
  displayName: string,
  companyIndex: number,
  locations: readonly Location[],
): H1BLcaRecord[] {
  return Array.from({ length: 10 }, (_, recordIndex) => {
    const number = String(companyIndex + 1).padStart(3, "0");
    const recordNumber = String(recordIndex + 1).padStart(2, "0");
    const location =
      locations[(companyIndex + recordIndex) % locations.length]!;
    const job = h1bJobs[(companyIndex + recordIndex) % h1bJobs.length]!;
    const annualWage = 106000 + companyIndex * 50 + recordIndex * 2300;

    return {
      id: `lca-m16-${number}-${recordNumber}`,
      sourceFileId: "source-m16-generated-lca-fy2026",
      employerId,
      locationId: location.id,
      sourceRecordId: `m16-lca-${number}-${recordNumber}`,
      sourceRecordFingerprint: `m16-lca-${number}-${recordNumber}`,
      caseNumber: `I-200-26${number}-${recordNumber}`,
      caseStatus: recordIndex === 9 ? "WITHDRAWN" : "CERTIFIED",
      rawEmployerName: `${displayName.toUpperCase()} LLC`,
      fiscalYear: 2026,
      socCode: job.socCode,
      socTitle: job.socTitle,
      jobTitle: `${job.title} - Program ${number}`,
      worksiteCity: location.city,
      worksiteState: location.state,
      wageRateOfPayFrom: annualWage,
      wageUnit: "Year",
      annualizedWageFrom: annualWage,
      prevailingWage: annualWage - 12000,
      prevailingWageUnit: "Year",
      wageLevel: wageLevelByIndex(recordIndex),
      fullTime: true,
      receivedDate: `2026-02-${String((recordIndex % 20) + 1).padStart(2, "0")}`,
      decisionDate: `2026-03-${String((recordIndex % 20) + 1).padStart(2, "0")}`,
    };
  });
}

function buildPermRecords(
  employerId: string,
  displayName: string,
  companyIndex: number,
  locations: readonly Location[],
): PermRecord[] {
  return Array.from({ length: 2 }, (_, recordIndex) => {
    const number = String(companyIndex + 1).padStart(3, "0");
    const recordNumber = String(recordIndex + 1).padStart(2, "0");
    const location =
      locations[(companyIndex + recordIndex + 2) % locations.length]!;
    const job = permJobs[(companyIndex + recordIndex) % permJobs.length]!;

    return {
      id: `perm-m16-${number}-${recordNumber}`,
      sourceFileId: "source-m16-generated-perm-fy2026",
      employerId,
      locationId: location.id,
      sourceRecordId: `m16-perm-${number}-${recordNumber}`,
      sourceRecordFingerprint: `m16-perm-${number}-${recordNumber}`,
      caseNumber: `A-260-${number}-${recordNumber}`,
      caseStatus: "Certified",
      rawEmployerName: `${displayName.toUpperCase()} LLC`,
      fiscalYear: 2026,
      jobTitle: `${job.title} - Program ${number}`,
      socCode: job.socCode,
      socTitle: job.socTitle,
      worksiteCity: location.city,
      worksiteState: location.state,
      wageOfferFrom: 118000 + companyIndex * 50 + recordIndex * 4000,
      wageUnit: "Year",
      priorityDate: `2025-09-${String((recordIndex % 20) + 1).padStart(2, "0")}`,
      receivedDate: `2026-01-${String((recordIndex % 20) + 1).padStart(2, "0")}`,
      decisionDate: `2026-03-${String((recordIndex % 20) + 5).padStart(2, "0")}`,
    };
  });
}

const h1bJobs = [
  {
    title: "Software Engineer",
    socCode: "15-1252",
    socTitle: "Software Developers",
  },
  {
    title: "Data Scientist",
    socCode: "15-2051",
    socTitle: "Data Scientists",
  },
  {
    title: "Machine Learning Engineer",
    socCode: "15-1252",
    socTitle: "Software Developers",
  },
  {
    title: "Cloud Infrastructure Engineer",
    socCode: "15-1244",
    socTitle: "Network and Computer Systems Administrators",
  },
  {
    title: "Product Analytics Engineer",
    socCode: "15-2051",
    socTitle: "Data Scientists",
  },
] as const;

const permJobs = [
  {
    title: "Senior Software Engineer",
    socCode: "15-1252",
    socTitle: "Software Developers",
  },
  {
    title: "Senior Data Scientist",
    socCode: "15-2051",
    socTitle: "Data Scientists",
  },
] as const;

function wageLevelByIndex(index: number): H1BLcaRecord["wageLevel"] {
  return (["II", "III", "IV", "II"] as const)[index % 4];
}
