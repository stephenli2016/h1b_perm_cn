import { connection } from "next/server";

import { getRuntimeDataMode } from "@/lib/db/postgres-fixture-data";

type RuntimeRenderingOptions = {
  env?: Record<string, string | undefined>;
  waitForConnection?: () => Promise<void>;
};

export async function waitForRuntimeDataRequestBoundary({
  env = process.env,
  waitForConnection = connection,
}: RuntimeRenderingOptions = {}) {
  if (getRuntimeDataMode(env) === "postgres") {
    await waitForConnection();
  }
}
