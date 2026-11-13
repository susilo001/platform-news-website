import type { MetadataRoute } from "next";
import { siteUrl, isDemo } from "@/lib/config";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: isDemo ? undefined : "/",
      disallow: isDemo ? "/" : ["/cms", "/api", "/preview", "/demo"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
