export const fallbackSiteUrl = "https://salemap.vn";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return fallbackSiteUrl;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return fallbackSiteUrl;
  }
}
