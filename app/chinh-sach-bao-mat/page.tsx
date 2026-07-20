import type { Metadata } from "next";
import { PolicyContent } from "@/components/policies/PolicyContent";

export const metadata: Metadata = {
  description:
    "Chính sách bảo mật của SaleMap về dữ liệu đăng ký, analytics và quyền của người dùng.",
  title: "Chính sách bảo mật - SaleMap",
};

export default function PrivacyPolicyPage() {
  return <PolicyContent kind="privacy" />;
}
