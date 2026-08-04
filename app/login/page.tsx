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

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;

  return (
    <AuthShell screen="login">
      <LoginForm authErrorCode={getString(searchParams?.authError)} />
    </AuthShell>
  );
}
