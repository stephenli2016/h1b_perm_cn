import {
  getDatabaseRuntimeStatus,
  getRuntimeDataMode,
} from "@/lib/db/postgres-fixture-data";

const truthyValues = new Set(["1", "true", "yes", "on"]);

export function shouldGenerateCompanyStaticParams(
  env: Record<string, string | undefined> = process.env,
) {
  if (truthyValues.has((env.PRERENDER_COMPANY_PAGES ?? "").toLowerCase())) {
    return canReadRuntimeDataForStaticParams(env);
  }

  return getRuntimeDataMode(env) === "fixture";
}

export function shouldGenerateRuntimeStaticParams(
  env: Record<string, string | undefined> = process.env,
) {
  if (
    truthyValues.has((env.PRERENDER_RUNTIME_DATA_PAGES ?? "").toLowerCase())
  ) {
    return canReadRuntimeDataForStaticParams(env);
  }

  return getRuntimeDataMode(env) === "fixture";
}

export function canReadRuntimeDataForStaticParams(
  env: Record<string, string | undefined> = process.env,
) {
  const status = getDatabaseRuntimeStatus(env);

  return status.mode === "fixture" || status.configured;
}
