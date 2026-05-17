import { NextResponse } from "next/server";

import { getRuntimeRepositoryStatus } from "@/lib/db/runtime-public-query-repository";
import { siteConfig } from "@/lib/site";

export function GET() {
  const data = getRuntimeRepositoryStatus();

  return NextResponse.json({
    ok: true,
    service: siteConfig.name,
    chineseName: siteConfig.chineseName,
    dataMode: data.mode,
    databaseConfigured: data.configured,
    databaseHost: data.host,
  });
}
