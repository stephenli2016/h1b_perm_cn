import {
  createPublicQueryRepository,
  publicQueryRepository,
  type PublicQueryRepository,
} from "@/lib/db/public-query-repository";
import {
  getDatabaseRuntimeStatus,
  getRuntimeDataMode,
  loadPostgresFixtureData,
} from "@/lib/db/postgres-fixture-data";
import type { FixtureData } from "@/lib/db/types";

let cachedRuntimeRepository:
  | {
      data: FixtureData;
      repository: PublicQueryRepository;
    }
  | undefined;

export async function getRuntimePublicQueryRepository(): Promise<PublicQueryRepository> {
  if (getRuntimeDataMode() === "fixture") {
    return publicQueryRepository;
  }

  const data = await loadPostgresFixtureData();

  if (cachedRuntimeRepository?.data === data) {
    return cachedRuntimeRepository.repository;
  }

  const repository = createPublicQueryRepository({
    data,
    cacheEnabled: true,
  });

  cachedRuntimeRepository = {
    data,
    repository,
  };

  return repository;
}

export function getRuntimeRepositoryStatus() {
  return getDatabaseRuntimeStatus();
}
