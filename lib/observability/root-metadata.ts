import type { Metadata } from "next";

import type { PublicObservabilityConfig } from "@/lib/observability/config";
import { getPublicObservabilityConfig } from "@/lib/observability/config";
import { rootRobotsMetadata } from "@/lib/seo/prelaunch";
import { siteConfig } from "@/lib/site";

export function buildRootMetadata(
  config: PublicObservabilityConfig = getPublicObservabilityConfig(),
): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.chineseName} | ${siteConfig.name}`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    robots: rootRobotsMetadata(),
    verification: {
      google: config.webmaster.googleSiteVerification,
      other: config.webmaster.bingSiteVerification
        ? {
            "msvalidate.01": config.webmaster.bingSiteVerification,
          }
        : undefined,
    },
    openGraph: {
      title: siteConfig.chineseName,
      description: siteConfig.description,
      url: siteConfig.url,
      siteName: `${siteConfig.chineseName} | ${siteConfig.name}`,
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: siteConfig.chineseName,
      description: siteConfig.description,
    },
  };
}
