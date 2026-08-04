import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  description: "Tạo tài khoản SaleMap để bắt đầu tìm khách, lưu lead và theo dõi follow-up.",
  robots: {
    follow: false,
    index: false,
  },
  title: "Đăng ký tài khoản - SaleMap",
};

type RegisterPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage(props: RegisterPageProps) {
  const searchParams = await props.searchParams;
  const inviteOnly = process.env.NEXT_PUBLIC_BETA_INVITE_ONLY === "true";

  return (
    <AuthShell screen="register">
      <RegisterForm
        authErrorCode={getString(searchParams?.authError)}
        inviteOnly={inviteOnly}
      />
    </AuthShell>
  );
}
