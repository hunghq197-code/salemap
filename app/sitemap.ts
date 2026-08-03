import type { MetadataRoute } from "next";
import { getPublishedCmsSitemapEntries } from "@/lib/cms/posts";
import { getSiteUrl } from "@/lib/site-url";

const routes = [
  "/",
  "/chinh-sach-bao-mat",
  "/dieu-khoan-su-dung",
] as const;
const lastModified = new Date("2026-07-24T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const cmsEntries = await getPublishedCmsSitemapEntries();

  return [
    ...routes.map((route) => ({
      changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
      lastModified,
      priority: route === "/" ? 1 : 0.7,
      url: `${siteUrl}${route}`,
    })),
    ...cmsEntries.map((entry) => ({
      changeFrequency: "weekly" as const,
      lastModified: new Date(entry.lastModified),
      priority: entry.path.startsWith("/blog/") ? 0.7 : 0.8,
      url: `${siteUrl}${entry.path}`,
    })),
  ];
}
