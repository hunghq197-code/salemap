import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { ClarityScript } from "@/components/analytics/ClarityScript";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { PostHogBootstrap } from "@/components/analytics/PostHogBootstrap";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();
const seoTitle = "SaleMap";
const seoDescription =
  "Công cụ cá nhân giúp dân sale tìm khách, lưu lead và nhắc follow-up.";
const devPwaResetScript = `
(() => {
  if (!["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname)) return;

  (async () => {
    const registrations = "serviceWorker" in navigator
      ? await navigator.serviceWorker.getRegistrations()
      : [];
    const cacheNames = "caches" in window ? await window.caches.keys() : [];
    const salemapCacheNames = cacheNames.filter((cacheName) => cacheName.startsWith("salemap-"));

    await Promise.all(registrations.map((registration) => registration.unregister()));
    await Promise.all(salemapCacheNames.map((cacheName) => window.caches.delete(cacheName)));

    if ((registrations.length > 0 || salemapCacheNames.length > 0) && !window.sessionStorage.getItem("salemap-dev-pwa-reset")) {
      window.sessionStorage.setItem("salemap-dev-pwa-reset", "1");
      window.location.reload();
    }
  })().catch(() => {});
})();
`;

export const metadata: Metadata = {
  alternates: {
    canonical: siteUrl,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SaleMap",
  },
  applicationName: "SaleMap",
  description: seoDescription,
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/icon-192.png",
    icon: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
  },
  keywords: [
    "công cụ cho sale",
    "tìm khách hàng",
    "tìm khách quanh tôi",
    "sale thị trường",
    "quản lý lead cá nhân",
    "nhắc follow-up",
    "tìm khách theo tuyến đường",
  ],
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(siteUrl),
  openGraph: {
    description: seoDescription,
    locale: "vi_VN",
    siteName: "SaleMap",
    title: seoTitle,
    type: "website",
    url: siteUrl,
  },
  title: seoTitle,
  twitter: {
    card: "summary",
    description: seoDescription,
    title: seoTitle,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        {process.env.NODE_ENV === "development" ? (
          <Script
            dangerouslySetInnerHTML={{ __html: devPwaResetScript }}
            id="salemap-dev-pwa-reset"
            strategy="beforeInteractive"
          />
        ) : null}
        <LanguageProvider>
          <PostHogBootstrap />
          {children}
          <ServiceWorkerRegister />
          <ClarityScript />
        </LanguageProvider>
      </body>
    </html>
  );
}
