import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    isProduction ? "" : "'unsafe-eval'",
    "https://www.clarity.ms",
    "https://*.clarity.ms",
    "https://*.bing.com",
    "https://app.posthog.com",
    "https://*.posthog.com",
    "https://*.i.posthog.com",
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
  ]
    .filter(Boolean)
    .join(" "),
  [
    "connect-src",
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://maps.googleapis.com",
    "https://places.googleapis.com",
    "https://maps.gstatic.com",
    "https://www.clarity.ms",
    "https://*.clarity.ms",
    "https://*.bing.com",
    "https://app.posthog.com",
    "https://*.posthog.com",
    "https://*.i.posthog.com",
    isProduction ? "" : "ws://localhost:*",
    isProduction ? "" : "ws://127.0.0.1:*",
  ]
    .filter(Boolean)
    .join(" "),
  "frame-src 'self'",
  isProduction ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), bluetooth=(), browsing-topics=(), camera=(), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

if (isProduction) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    dangerouslyAllowSVG: false,
    remotePatterns: [],
  },
  poweredByHeader: false,
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
