import {
  listSitemapEntries,
  renderUrlSet,
  sitemapXmlResponse,
} from "@/lib/seo/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return sitemapXmlResponse(renderUrlSet(listSitemapEntries("guides")));
}
