import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { DisclaimerStrip } from "@/components/disclaimer-strip";
import { ErrorMonitoringListener } from "@/components/observability/error-monitoring-listener";
import { ObservabilityScripts } from "@/components/observability/observability-scripts";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicObservabilityConfig } from "@/lib/observability/config";
import { buildRootMetadata } from "@/lib/observability/root-metadata";

const observabilityConfig = getPublicObservabilityConfig();

export const metadata: Metadata = buildRootMetadata(observabilityConfig);

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ObservabilityScripts config={observabilityConfig} />
        <ErrorMonitoringListener config={observabilityConfig.monitoring} />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <DisclaimerStrip />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
