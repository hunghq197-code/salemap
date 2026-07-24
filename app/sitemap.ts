import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const routes = [
  "/",
  "/chinh-sach-bao-mat",
  "/dieu-khoan-su-dung",
] as const;
const lastModified = new Date("2026-07-24T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return routes.map((route) => ({
    changeFrequency: route === "/" ? "weekly" : "monthly",
    lastModified,
    priority: route === "/" ? 1 : 0.7,
    url: `${siteUrl}${route}`,
  }));
}
