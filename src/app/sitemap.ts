import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { allPublicSlugs, getCategories } from "@/modules/articles/queries";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    allPublicSlugs(),
    getCategories(),
  ]);
  return [
    { url: siteUrl },
    ...categories.map((c) => ({ url: `${siteUrl}/category/${c.slug}` })),
    ...articles.map((a) => ({
      url: `${siteUrl}/news/${a.slug}`,
      lastModified: a.updatedAt,
    })),
  ];
}
