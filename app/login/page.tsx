import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập - SaleMap",
};

export default function LoginPage() {
  return (
    <AuthShell screen="login">
      <LoginForm />
    </AuthShell>
  );
}
