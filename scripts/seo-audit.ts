import { spawnSync } from "node:child_process";

const auditTests = [
  "tests/seo.test.ts",
  "tests/technical-seo.test.tsx",
  "tests/site-routes.test.ts",
  "tests/compliance-pages.test.tsx",
];

console.log("SEO audit");
console.log(
  "Checks: route map, sitemap inclusion/exclusion, noindex safeguards, internal link graph, structured data, compliance pages.",
);
console.log(`Running: vitest ${auditTests.join(" ")}`);

const result = spawnSync("pnpm", ["exec", "vitest", "run", ...auditTests], {
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
