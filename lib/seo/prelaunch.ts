import type { Metadata } from "next";

const truthyValues = new Set(["1", "true", "yes", "on"]);

export const prelaunchNoindexRobots = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const satisfies Metadata["robots"];

export function isPrelaunchNoindexEnabled(
  env: Record<string, string | undefined> = process.env as Record<
    string,
    string | undefined
  >,
) {
  return truthyValues.has((env.PRELAUNCH_NOINDEX ?? "").trim().toLowerCase());
}

export function robotsForIndexing({
  follow,
  index,
}: {
  index: boolean;
  follow: boolean;
}): Metadata["robots"] {
  if (isPrelaunchNoindexEnabled()) {
    return prelaunchNoindexRobots;
  }

  return {
    index,
    follow,
  };
}

export function rootRobotsMetadata(): Metadata["robots"] | undefined {
  return isPrelaunchNoindexEnabled() ? prelaunchNoindexRobots : undefined;
}
