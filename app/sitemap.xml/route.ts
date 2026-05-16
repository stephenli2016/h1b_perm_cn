import { renderSitemapIndex, sitemapXmlResponse } from "@/lib/seo/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return sitemapXmlResponse(renderSitemapIndex());
}
