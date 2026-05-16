import {
  listSitemapEntries,
  renderUrlSet,
  sitemapXmlResponse,
} from "@/lib/seo/sitemaps";

type CompanySitemapPageRouteContext = {
  params: Promise<{
    page: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: CompanySitemapPageRouteContext,
) {
  const { page } = await params;
  const pageNumber = Number(page.replace(/\.xml$/, ""));

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return new Response("Not found", {
      status: 404,
    });
  }

  return sitemapXmlResponse(
    renderUrlSet(
      listSitemapEntries("company-pages", undefined, {
        page: pageNumber,
      }),
    ),
  );
}
