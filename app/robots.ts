import type { MetadataRoute } from "next";

import { isPrelaunchNoindexEnabled } from "@/lib/seo/prelaunch";
import { getCanonicalUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (isPrelaunchNoindexEnabled()) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: getCanonicalUrl("/sitemap.xml"),
  };
}
