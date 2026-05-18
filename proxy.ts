import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getPreviewProtectionConfig,
  isPreviewProtectionAuthorized,
} from "@/lib/security/preview-protection";
import {
  type DisclosureStatusDataset,
  normalizeCaseStatusForDataset,
  normalizeStateCode,
} from "@/lib/directory-filter-normalization";

const directoryPaths: Record<string, DisclosureStatusDataset> = {
  "/companies": "combined",
  "/h1b": "h1b",
  "/perm": "perm",
};

const directorySearchKeys = [
  "employer",
  "fiscalYear",
  "caseStatus",
  "state",
  "city",
  "jobOrSoc",
  "page",
] as const;

export function proxy(request: NextRequest) {
  const cleanDirectoryRedirect = getCleanDirectoryRedirect(request);

  if (cleanDirectoryRedirect) {
    return cleanDirectoryRedirect;
  }

  const config = getPreviewProtectionConfig();

  if (!config.enabled) {
    return NextResponse.next();
  }

  if (
    isPreviewProtectionAuthorized({
      authorizationHeader: request.headers.get("authorization"),
    })
  ) {
    return NextResponse.next();
  }

  return new NextResponse("Preview access requires authorization.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${config.realm}", charset="UTF-8"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function getCleanDirectoryRedirect(request: NextRequest) {
  const statusDataset = directoryPaths[request.nextUrl.pathname];

  if (!statusDataset) {
    return undefined;
  }

  const rawKnownParams = new URLSearchParams();
  const cleanKnownParams = new URLSearchParams();
  let hasKnownParam = false;

  for (const key of directorySearchKeys) {
    const rawValue = request.nextUrl.searchParams.get(key);

    if (rawValue === null) {
      continue;
    }

    hasKnownParam = true;
    rawKnownParams.set(key, rawValue);

    const cleanValue = getCleanDirectoryParamValue(
      key,
      rawValue,
      statusDataset,
    );

    if (cleanValue) {
      cleanKnownParams.set(key, cleanValue);
    }
  }

  if (
    !hasKnownParam ||
    rawKnownParams.toString() === cleanKnownParams.toString()
  ) {
    return undefined;
  }

  const cleanUrl = request.nextUrl.clone();
  const cleanParams = new URLSearchParams();

  for (const [key, value] of request.nextUrl.searchParams) {
    if (
      !directorySearchKeys.includes(key as (typeof directorySearchKeys)[number])
    ) {
      cleanParams.append(key, value);
    }
  }

  for (const [key, value] of cleanKnownParams) {
    cleanParams.set(key, value);
  }

  cleanUrl.search = cleanParams.toString();

  return NextResponse.redirect(cleanUrl, 307);
}

function getCleanDirectoryParamValue(
  key: (typeof directorySearchKeys)[number],
  rawValue: string,
  statusDataset: DisclosureStatusDataset,
) {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return undefined;
  }

  if (key === "state") {
    return normalizeStateCode(trimmed);
  }

  if (key === "caseStatus") {
    return normalizeCaseStatusForDataset(trimmed, statusDataset);
  }

  if (key === "page" && Number(trimmed) <= 1) {
    return undefined;
  }

  return trimmed;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
