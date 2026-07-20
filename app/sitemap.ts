import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const routes = [
  "/",
  "/status",
  "/cam-on",
  "/chinh-sach-bao-mat",
  "/dieu-khoan-su-dung",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return routes.map((route) => ({
    changeFrequency: route === "/" ? "weekly" : "monthly",
    lastModified: new Date(),
    priority: route === "/" ? 1 : 0.7,
    url: `${siteUrl}${route}`,
  }));
}
