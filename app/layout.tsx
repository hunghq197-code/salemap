import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { ClarityScript } from "@/components/analytics/ClarityScript";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { RouteTransitionProgress } from "@/components/navigation/RouteTransitionProgress";
import { PostHogBootstrap } from "@/components/analytics/PostHogBootstrap";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();
const seoTitle = "SaleMap";
const seoDescription =
  "Công cụ cá nhân giúp dân sale tìm khách, lưu lead và nhắc follow-up.";
export const metadata: Metadata = {
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
  },
  title: seoTitle,
  twitter: {
    card: "summary_large_image",
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
    <html data-scroll-behavior="smooth" lang="vi">
      <body>
        <LanguageProvider>
          <PostHogBootstrap />
          <Suspense fallback={null}>
            <RouteTransitionProgress />
          </Suspense>
          {children}
          <ServiceWorkerRegister />
          <ClarityScript />
        </LanguageProvider>
      </body>
    </html>
  );
}
