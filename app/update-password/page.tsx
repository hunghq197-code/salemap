import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export const metadata: Metadata = {
  description: "Đặt mật khẩu mới cho tài khoản SaleMap.",
  robots: {
    follow: false,
    index: false,
  },
  title: "Đặt mật khẩu mới - SaleMap",
};

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      description="Tạo mật khẩu mới cho tài khoản SaleMap của bạn."
      eyebrow="Bảo mật tài khoản"
      screen="login"
      title="Đặt mật khẩu mới"
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
