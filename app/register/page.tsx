import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản - SaleMap",
};

export default function RegisterPage() {
  const inviteOnly = process.env.NEXT_PUBLIC_BETA_INVITE_ONLY === "true";

  return (
    <AuthShell screen="register">
      <RegisterForm inviteOnly={inviteOnly} />
    </AuthShell>
  );
}
