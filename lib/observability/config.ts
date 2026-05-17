export type ObservabilityEnv = Partial<Record<string, string | undefined>>;

export type PublicObservabilityConfig = {
  analytics: {
    ga4MeasurementId?: string;
    plausibleDomain?: string;
    plausibleScriptSrc?: string;
    enabledProviders: ("ga4" | "plausible")[];
  };
  webmaster: {
    googleSiteVerification?: string;
    bingSiteVerification?: string;
  };
  monitoring: {
    endpoint?: string;
    environment: string;
    release?: string;
    enabled: boolean;
  };
  warnings: string[];
  ownerActions: string[];
};

const defaultPlausibleScriptSrc = "https://plausible.io/js/script.js";

export function getPublicObservabilityConfig(
  env: ObservabilityEnv = process.env,
): PublicObservabilityConfig {
  const warnings: string[] = [];
  const ga4MeasurementId = cleanGa4MeasurementId(
    env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    warnings,
  );
  const plausibleDomain = cleanHostname(
    env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
    warnings,
  );
  const plausibleScriptSrc = plausibleDomain
    ? cleanHttpsUrl(
        env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC ?? defaultPlausibleScriptSrc,
        "NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC",
        warnings,
      )
    : undefined;
  const googleSiteVerification = cleanVerificationToken(
    env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
    warnings,
  );
  const bingSiteVerification = cleanVerificationToken(
    env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
    "NEXT_PUBLIC_BING_SITE_VERIFICATION",
    warnings,
  );
  const endpoint = cleanMonitoringEndpoint(
    env.NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT,
    warnings,
  );
  const environment =
    cleanPublicLabel(env.NEXT_PUBLIC_ERROR_MONITORING_ENVIRONMENT) ??
    cleanPublicLabel(env.VERCEL_ENV) ??
    cleanPublicLabel(env.NODE_ENV) ??
    "development";
  const release = cleanPublicLabel(
    env.NEXT_PUBLIC_RELEASE_SHA ?? env.VERCEL_GIT_COMMIT_SHA,
  );
  const enabledProviders = [
    ga4MeasurementId ? "ga4" : undefined,
    plausibleDomain && plausibleScriptSrc ? "plausible" : undefined,
  ].filter((provider): provider is "ga4" | "plausible" => Boolean(provider));

  return {
    analytics: {
      ga4MeasurementId,
      plausibleDomain,
      plausibleScriptSrc,
      enabledProviders,
    },
    webmaster: {
      googleSiteVerification,
      bingSiteVerification,
    },
    monitoring: {
      endpoint,
      environment,
      release,
      enabled: Boolean(endpoint),
    },
    warnings,
    ownerActions: buildOwnerActions({
      ga4MeasurementId,
      plausibleDomain,
      googleSiteVerification,
      endpoint,
    }),
  };
}

export function hasAnyObservabilityEnabled(config: PublicObservabilityConfig) {
  return (
    config.analytics.enabledProviders.length > 0 ||
    Boolean(config.webmaster.googleSiteVerification) ||
    Boolean(config.webmaster.bingSiteVerification) ||
    config.monitoring.enabled
  );
}

function buildOwnerActions({
  endpoint,
  ga4MeasurementId,
  googleSiteVerification,
  plausibleDomain,
}: {
  ga4MeasurementId?: string;
  plausibleDomain?: string;
  googleSiteVerification?: string;
  endpoint?: string;
}) {
  const actions: string[] = [];

  if (!ga4MeasurementId && !plausibleDomain) {
    actions.push(
      "Optional: provide NEXT_PUBLIC_GA_MEASUREMENT_ID or NEXT_PUBLIC_PLAUSIBLE_DOMAIN to enable analytics.",
    );
  }
  if (!googleSiteVerification) {
    actions.push(
      "Optional: provide NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION after adding the domain property in Search Console.",
    );
  }
  if (!endpoint) {
    actions.push(
      "Optional: provide NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT to receive sanitized browser error beacons.",
    );
  }

  return actions;
}

function cleanGa4MeasurementId(value: string | undefined, warnings: string[]) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!/^G-[A-Z0-9]{4,}$/.test(trimmed)) {
    warnings.push("NEXT_PUBLIC_GA_MEASUREMENT_ID is not a valid GA4 ID.");
    return undefined;
  }

  return trimmed;
}

function cleanHostname(
  value: string | undefined,
  name: string,
  warnings: string[],
) {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }
  if (
    trimmed.includes("://") ||
    trimmed.includes("/") ||
    !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(trimmed)
  ) {
    warnings.push(`${name} must be a bare hostname, for example example.com.`);
    return undefined;
  }

  return trimmed;
}

function cleanVerificationToken(
  value: string | undefined,
  name: string,
  warnings: string[],
) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!/^[A-Za-z0-9._-]{8,256}$/.test(trimmed)) {
    warnings.push(`${name} contains unsupported characters.`);
    return undefined;
  }

  return trimmed;
}

function cleanHttpsUrl(
  value: string | undefined,
  name: string,
  warnings: string[],
) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") {
      warnings.push(`${name} must use https.`);
      return undefined;
    }

    return url.toString();
  } catch {
    warnings.push(`${name} is not a valid URL.`);
    return undefined;
  }
}

function cleanMonitoringEndpoint(
  value: string | undefined,
  warnings: string[],
) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);
    if (
      url.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(url.hostname)
    ) {
      warnings.push(
        "NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT must use https outside localhost.",
      );
      return undefined;
    }

    return url.toString();
  } catch {
    warnings.push("NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT is not a valid URL.");
    return undefined;
  }
}

function cleanPublicLabel(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || !/^[A-Za-z0-9._/-]{1,128}$/.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}
