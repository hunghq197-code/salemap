import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRoleBadge } from "@/components/admin/AdminRoleBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getPermissionsForRole } from "@/lib/admin/admin-permissions";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

const roles = ["super_admin", "admin", "support"] as const;

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Thiết lập admin MVP đang ở chế độ an toàn: chỉ hiển thị phân quyền và hướng dẫn vận hành, chưa cho chỉnh global setting trực tiếp trên UI."
        title="Cài đặt"
      />

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Phiên admin hiện tại</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <AdminRoleBadge role={admin.role} />
          <span className="text-sm font-semibold text-slate-600">{admin.email || admin.userId}</span>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold text-ink">Ma trận quyền</h2>
        <AdminTable headers={["Role", "Permissions"]}>
          {roles.map((role) => (
            <tr key={role}>
              <td className="whitespace-nowrap px-4 py-3"><AdminRoleBadge role={role} /></td>
              <td className="min-w-96 px-4 py-3 text-sm leading-6 text-slate-700">
                {getPermissionsForRole(role).join(", ")}
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>

      <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-800">
        Thao tác tạo/xóa admin user vẫn thực hiện bằng SQL/script bootstrap để giảm rủi ro trong MVP.
        Không đặt secret vào source code hoặc NEXT_PUBLIC_* nếu đó là server/payment key.
      </section>
    </div>
  );
}
