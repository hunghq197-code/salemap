import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#ffffff",
    categories: ["business", "productivity"],
    description:
      "Công cụ cá nhân cho dân sale: tìm khách, lưu lead, ghi chú và nhắc follow-up.",
    display: "standalone",
    icons: [
      {
        sizes: "192x192",
        src: "/icons/icon-192.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/icons/icon-512.png",
        type: "image/png",
      },
      {
        purpose: "maskable",
        sizes: "192x192",
        src: "/icons/maskable-icon-192.png",
        type: "image/png",
      },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "/icons/maskable-icon-512.png",
        type: "image/png",
      },
    ],
    lang: "vi",
    name: "SaleMap",
    orientation: "portrait-primary",
    scope: "/",
    screenshots: [
      {
        sizes: "390x844",
        src: "/icons/salemap-screenshot-narrow.svg",
        type: "image/svg+xml",
      },
    ],
    short_name: "SaleMap",
    shortcuts: [
      {
        description: "Mở dashboard hôm nay",
        name: "Dashboard",
        short_name: "Dashboard",
        url: "/app/dashboard",
      },
      {
        description: "Tìm khách quanh khu vực hoặc tuyến đường",
        name: "Tìm khách",
        short_name: "Tìm khách",
        url: "/app/discover",
      },
      {
        description: "Mở danh sách lead cá nhân",
        name: "Lead cá nhân",
        short_name: "Lead",
        url: "/app/leads",
      },
      {
        description: "Xem follow-up cần làm",
        name: "Việc cần làm",
        short_name: "Việc",
        url: "/app/tasks",
      },
    ],
    start_url: "/app/dashboard",
    theme_color: "#0f172a",
  };
}
