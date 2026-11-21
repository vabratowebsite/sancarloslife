import type { MetadataRoute } from "next";

import { indexingAllowed } from "@/lib/indexing";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin, API, on-site search and filtered listings add nothing for search engines.
        disallow: ["/admin", "/api/", "/edit/", "/search/", "/*?q=", "/*?*sort="],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
