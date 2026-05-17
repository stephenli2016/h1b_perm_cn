import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { DisclaimerStrip } from "@/components/disclaimer-strip";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.chineseName} | ${siteConfig.name}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
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
