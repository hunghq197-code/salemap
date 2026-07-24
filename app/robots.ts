import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/app/",
        "/auth/",
        "/beta-status",
        "/cam-on",
        "/forgot-password",
        "/login",
        "/onboarding",
        "/register",
        "/update-password",
      ],
      userAgent: "*",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
