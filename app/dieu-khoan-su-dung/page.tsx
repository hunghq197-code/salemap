import type { Metadata } from "next";
import { PolicyContent } from "@/components/policies/PolicyContent";

export const metadata: Metadata = {
  alternates: {
    canonical: "/dieu-khoan-su-dung",
  },
  description:
    "Điều khoản sử dụng SaleMap, phạm vi sử dụng và trách nhiệm của người dùng.",
  openGraph: {
    description:
      "Điều khoản sử dụng SaleMap, phạm vi sử dụng và trách nhiệm của người dùng.",
    images: [
      {
        alt: "SaleMap - Tìm khách, lưu lead và nhắc follow-up",
        height: 630,
        url: "/opengraph-image",
        width: 1200,
      },
    ],
    title: "Điều khoản sử dụng - SaleMap",
    url: "/dieu-khoan-su-dung",
  },
  title: "Điều khoản sử dụng - SaleMap",
};

export default function TermsPage() {
  return <PolicyContent kind="terms" />;
}
