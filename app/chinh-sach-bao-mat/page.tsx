import type { Metadata } from "next";
import { PolicyContent } from "@/components/policies/PolicyContent";

export const metadata: Metadata = {
  alternates: {
    canonical: "/chinh-sach-bao-mat",
  },
  description:
    "Chính sách bảo mật của SaleMap về dữ liệu đăng ký, analytics và quyền của người dùng.",
  openGraph: {
    description:
      "Chính sách bảo mật của SaleMap về dữ liệu đăng ký, analytics và quyền của người dùng.",
    images: [
      {
        alt: "SaleMap - Tìm khách, lưu lead và nhắc follow-up",
        height: 630,
        url: "/opengraph-image",
        width: 1200,
      },
    ],
    title: "Chính sách bảo mật - SaleMap",
    url: "/chinh-sach-bao-mat",
  },
  title: "Chính sách bảo mật - SaleMap",
};

export default function PrivacyPolicyPage() {
  return <PolicyContent kind="privacy" />;
}
