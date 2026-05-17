import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getPreviewProtectionConfig,
  isPreviewProtectionAuthorized,
} from "@/lib/security/preview-protection";

export function proxy(request: NextRequest) {
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
