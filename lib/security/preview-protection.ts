const truthyValues = new Set(["1", "true", "yes", "on"]);

type PreviewProtectionEnv = Record<string, string | undefined>;

export type PreviewProtectionConfig = {
  enabled: boolean;
  username: string;
  password?: string;
  realm: string;
};

export function getPreviewProtectionConfig(
  env: PreviewProtectionEnv = process.env,
): PreviewProtectionConfig {
  return {
    enabled: truthyValues.has(
      (env.PREVIEW_PROTECTION_ENABLED ?? "").trim().toLowerCase(),
    ),
    username: (env.PREVIEW_PROTECTION_USERNAME ?? "preview").trim(),
    password: (env.PREVIEW_PROTECTION_PASSWORD ?? "").trim() || undefined,
    realm: (env.PREVIEW_PROTECTION_REALM ?? "VisaRadar CN Preview").trim(),
  };
}

export function isPreviewProtectionAuthorized({
  authorizationHeader,
  env = process.env,
}: {
  authorizationHeader?: string | null;
  env?: PreviewProtectionEnv;
}) {
  const config = getPreviewProtectionConfig(env);

  if (!config.enabled) {
    return true;
  }
  if (!config.password) {
    return false;
  }

  const credentials = parseBasicAuthorization(authorizationHeader);

  return (
    credentials?.username === config.username &&
    credentials.password === config.password
  );
}

function parseBasicAuthorization(authorizationHeader?: string | null) {
  if (!authorizationHeader?.startsWith("Basic ")) {
    return undefined;
  }

  const encoded = authorizationHeader.slice("Basic ".length).trim();
  let decoded = "";

  try {
    decoded = globalThis.atob(encoded);
  } catch {
    return undefined;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return undefined;
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
}
