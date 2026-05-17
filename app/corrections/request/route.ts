import { NextResponse } from "next/server";

import {
  buildCorrectionRequestPublicId,
  isCorrectionRequestType,
} from "@/lib/compliance/content";
import {
  getRuntimeDataMode,
  queryPostgresRows,
} from "@/lib/db/postgres-fixture-data";

type InsertedCorrectionRequestRow = {
  public_id: string;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const requestType = String(formData.get("requestType") ?? "");
  const hasAcknowledgement =
    String(formData.get("acknowledgement") ?? "") === "understood";
  const description = trimText(formData.get("description"), 2000);
  const hasDescription = description.length > 0;
  const redirectUrl = new URL("/corrections/received", request.url);

  if (
    !isCorrectionRequestType(requestType) ||
    !hasAcknowledgement ||
    !hasDescription
  ) {
    redirectUrl.searchParams.set("status", "invalid");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const publicId = buildCorrectionRequestPublicId();
  const persistence = await persistCorrectionRequest({
    description,
    employerName: trimText(formData.get("employerName"), 160),
    pageUrl: normalizeOptionalUrl(formData.get("pageUrl")),
    publicId,
    requestType,
    sourceUrl: normalizeOptionalUrl(formData.get("sourceUrl")),
    submitterEmail: normalizeOptionalEmail(formData.get("submitterEmail")),
  }).catch(() => undefined);

  if (!persistence) {
    redirectUrl.searchParams.set("status", "unavailable");
    return NextResponse.redirect(redirectUrl, 303);
  }

  redirectUrl.searchParams.set("status", "received");
  redirectUrl.searchParams.set("type", requestType);
  redirectUrl.searchParams.set("id", persistence.publicId);

  return NextResponse.redirect(redirectUrl, 303);
}

async function persistCorrectionRequest(input: {
  publicId: string;
  requestType: string;
  submitterEmail?: string;
  pageUrl?: string;
  employerName: string;
  sourceUrl?: string;
  description: string;
}) {
  if (getRuntimeDataMode() !== "postgres") {
    return { publicId: input.publicId };
  }

  const rows = await queryPostgresRows<InsertedCorrectionRequestRow>(
    `
      insert into public.correction_requests (
        id,
        public_id,
        page_url,
        request_type,
        submitter_email,
        description,
        status
      )
      values ($1, $2, $3, $4, $5, $6, 'new')
      returning public_id
    `,
    [
      globalThis.crypto.randomUUID(),
      input.publicId,
      input.pageUrl,
      input.requestType,
      input.submitterEmail,
      buildStoredDescription(input),
    ],
  );

  return { publicId: rows[0]?.public_id ?? input.publicId };
}

function buildStoredDescription(input: {
  description: string;
  employerName: string;
  sourceUrl?: string;
}) {
  return [
    input.description,
    input.employerName ? `公司或页面标题：${input.employerName}` : undefined,
    input.sourceUrl ? `可核验官方来源：${input.sourceUrl}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 2400);
}

function trimText(value: FormDataEntryValue | null, maxLength: number) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function normalizeOptionalEmail(value: FormDataEntryValue | null) {
  const email = trimText(value, 254);

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return undefined;
  }

  return email;
}

function normalizeOptionalUrl(value: FormDataEntryValue | null) {
  const rawUrl = trimText(value, 500);

  if (!rawUrl) {
    return undefined;
  }

  try {
    const url = new URL(rawUrl);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
