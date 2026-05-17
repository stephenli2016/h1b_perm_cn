import { NextResponse } from "next/server";

import {
  buildCorrectionRequestPublicId,
  isCorrectionRequestType,
} from "@/lib/compliance/content";

export async function POST(request: Request) {
  const formData = await request.formData();
  const requestType = String(formData.get("requestType") ?? "");
  const hasAcknowledgement =
    String(formData.get("acknowledgement") ?? "") === "understood";
  const hasDescription =
    String(formData.get("description") ?? "").trim().length > 0;
  const redirectUrl = new URL("/corrections/received", request.url);

  if (
    !isCorrectionRequestType(requestType) ||
    !hasAcknowledgement ||
    !hasDescription
  ) {
    redirectUrl.searchParams.set("status", "invalid");
    return NextResponse.redirect(redirectUrl, 303);
  }

  redirectUrl.searchParams.set("status", "received");
  redirectUrl.searchParams.set("type", requestType);
  redirectUrl.searchParams.set("id", buildCorrectionRequestPublicId());

  return NextResponse.redirect(redirectUrl, 303);
}
