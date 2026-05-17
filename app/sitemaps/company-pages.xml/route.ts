import {
  listRuntimeCompanySitemapEntries,
  renderUrlSet,
  sitemapXmlResponse,
} from "@/lib/seo/sitemaps";

export const dynamic = "force-dynamic";

export async function GET() {
  return sitemapXmlResponse(
    renderUrlSet(await listRuntimeCompanySitemapEntries()),
  );
}
