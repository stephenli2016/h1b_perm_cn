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

describe("public route map", () => {
  it("contains every M02 route", () => {
    const routePaths = publicRoutes.map((route) => route.path);

    expect(routePaths).toEqual(expect.arrayContaining([...requiredM02Routes]));
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
