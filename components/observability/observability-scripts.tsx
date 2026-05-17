import Script from "next/script";

import type { PublicObservabilityConfig } from "@/lib/observability/config";
import { getPublicObservabilityConfig } from "@/lib/observability/config";

type ObservabilityScriptsProps = {
  config?: PublicObservabilityConfig;
};

export function ObservabilityScripts({
  config = getPublicObservabilityConfig(),
}: ObservabilityScriptsProps) {
  const descriptors = getObservabilityScriptDescriptors(config);

  return (
    <>
      {descriptors.ga4 ? (
        <>
          <Script src={descriptors.ga4.src} strategy="afterInteractive" />
          <Script
            dangerouslySetInnerHTML={{
              __html: descriptors.ga4.inline,
            }}
            id="ga4-init"
            strategy="afterInteractive"
          />
        </>
      ) : null}

      {descriptors.plausible ? (
        <Script
          data-domain={descriptors.plausible.domain}
          defer
          src={descriptors.plausible.src}
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}

export function getObservabilityScriptDescriptors(
  config: PublicObservabilityConfig,
) {
  const { ga4MeasurementId, plausibleDomain, plausibleScriptSrc } =
    config.analytics;

  return {
    ga4: ga4MeasurementId
      ? {
          src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
            ga4MeasurementId,
          )}`,
          inline: buildGa4Snippet(ga4MeasurementId),
        }
      : undefined,
    plausible:
      plausibleDomain && plausibleScriptSrc
        ? {
            domain: plausibleDomain,
            src: plausibleScriptSrc,
          }
        : undefined,
  };
}

function buildGa4Snippet(measurementId: string) {
  return [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){window.dataLayer.push(arguments);}",
    "gtag('js', new Date());",
    `gtag('config', ${JSON.stringify(measurementId)}, { anonymize_ip: true });`,
  ].join("\n");
}
