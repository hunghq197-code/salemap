import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  description: "Đăng nhập vào workspace SaleMap để quản lý lead, công việc và follow-up.",
  robots: {
    follow: false,
    index: false,
  },
  title: "Đăng nhập - SaleMap",
};

export default function LoginPage() {
  return (
    <AuthShell screen="login">
      <LoginForm />
    </AuthShell>
  );
}
