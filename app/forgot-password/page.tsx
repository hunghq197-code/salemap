import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  description: "Khôi phục mật khẩu tài khoản SaleMap.",
  robots: {
    follow: false,
    index: false,
  },
  title: "Khôi phục mật khẩu - SaleMap",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Nhập email tài khoản để nhận liên kết tạo mật khẩu mới."
      eyebrow="Bảo mật tài khoản"
      screen="login"
      title="Khôi phục mật khẩu"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
