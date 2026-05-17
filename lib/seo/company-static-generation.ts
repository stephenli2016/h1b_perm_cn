import { getRuntimeDataMode } from "@/lib/db/postgres-fixture-data";

const truthyValues = new Set(["1", "true", "yes", "on"]);

export function shouldGenerateCompanyStaticParams(
  env: Record<string, string | undefined> = process.env,
) {
  if (truthyValues.has((env.PRERENDER_COMPANY_PAGES ?? "").toLowerCase())) {
    return true;
  }

  return getRuntimeDataMode(env) === "fixture";
}
