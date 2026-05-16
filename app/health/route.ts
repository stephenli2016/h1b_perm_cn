import { NextResponse } from "next/server";

import { siteConfig } from "@/lib/site";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: siteConfig.name,
    chineseName: siteConfig.chineseName,
  });
}
