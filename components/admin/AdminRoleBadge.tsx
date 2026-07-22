import type { AdminRole } from "@/lib/admin/admin-permissions";

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
  support: "Support",
};

const ROLE_CLASSES: Record<AdminRole, string> = {
  admin: "border-ocean/25 bg-ocean/10 text-ocean",
  super_admin: "border-emerald-200 bg-emerald-50 text-emerald-700",
  support: "border-amber-200 bg-amber-50 text-amber-700",
};

type AdminRoleBadgeProps = {
  role: AdminRole;
};

export function AdminRoleBadge({ role }: AdminRoleBadgeProps) {
  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-lg border px-2.5 py-1 text-xs font-bold",
        ROLE_CLASSES[role],
      ].join(" ")}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
