import type { Metadata } from "next";
import { PolicyContent } from "@/components/policies/PolicyContent";

export const metadata: Metadata = {
  description:
    "Điều khoản sử dụng SaleMap, phạm vi sử dụng và trách nhiệm của người dùng.",
  title: "Điều khoản sử dụng - SaleMap",
};

export default function TermsPage() {
  return <PolicyContent kind="terms" />;
}
