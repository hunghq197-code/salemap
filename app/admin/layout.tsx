import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const admin = await requireAdmin();

  return (
    <AdminShell
      email={admin.email}
      fullName={admin.profile.full_name}
      role={admin.role}
    >
      {children}
    </AdminShell>
  );
}
