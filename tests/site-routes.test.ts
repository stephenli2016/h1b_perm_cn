import { describe, expect, it } from "vitest";

import { primaryNavItems, publicRoutes } from "@/lib/site";

const requiredM02Routes = [
  "/",
  "/h1b",
  "/h1b/company/[slug]",
  "/perm",
  "/perm/company/[slug]",
  "/tools",
  "/guides",
  "/visa-bulletin",
  "/about",
  "/disclaimer",
  "/privacy",
  "/corrections",
] as const;

const requiredM18Routes = ["/tools/h1b-wage-level-checker"] as const;

describe("public route map", () => {
  it("contains every M02 route", () => {
    const routePaths = publicRoutes.map((route) => route.path);

    expect(routePaths).toEqual(expect.arrayContaining([...requiredM02Routes]));
  });

  it("adds the M18 wage-level checker as an indexable tool route", () => {
    const routePaths = publicRoutes.map((route) => route.path);
    const wageToolRoute = publicRoutes.find(
      (route) => route.path === "/tools/h1b-wage-level-checker",
    );

    expect(routePaths).toEqual(expect.arrayContaining([...requiredM18Routes]));
    expect(wageToolRoute).toMatchObject({
      dataPage: true,
      indexing: "indexable",
      nav: false,
      sitemapGroup: "tools",
    });
  });

  it("adds the M13 combined company directory without crowding primary nav", () => {
    const companiesRoute = publicRoutes.find(
      (route) => route.path === "/companies",
    );

    expect(companiesRoute).toMatchObject({
      dataPage: true,
      indexing: "noindex-until-data",
      nav: false,
      sitemapGroup: "data-directory",
    });
  });

  it("keeps the Chinese primary navigation focused", () => {
    expect(primaryNavItems.map((item) => item.label)).toEqual([
      "首页",
      "H-1B",
      "PERM",
      "工具",
      "指南",
      "排期",
      "关于",
    ]);
  });

  it("keeps dynamic company pages conditionally indexed", () => {
    const companyRoutes = publicRoutes.filter((route) =>
      route.path.includes("/company/[slug]"),
    );

    expect(companyRoutes).toHaveLength(2);
    expect(
      companyRoutes.every((route) => route.indexing === "conditional"),
    ).toBe(true);
  });

  it("marks data-dependent shell routes as data pages", () => {
    const dataRoutes = publicRoutes.filter((route) => route.dataPage);

    expect(dataRoutes.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        "/h1b",
        "/h1b/company/[slug]",
        "/perm",
        "/perm/company/[slug]",
        "/tools",
        "/visa-bulletin",
      ]),
    );
  });
});
