import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { checkSystemHealth } from "@/lib/admin/system-health";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const health = await checkSystemHealth();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Kiểm tra env, kết nối Supabase, audit log và security event. Trang này chỉ hiển thị present/missing, không hiển thị giá trị secret."
        title="Hệ thống"
      />

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <AdminKpiCard
          label="Security events 24h"
          value={health.stats.recentSecurityEvents ?? "N/A"}
        />
        <AdminKpiCard
          label="Unresolved events 24h"
          value={health.stats.unresolvedSecurityEvents ?? "N/A"}
        />
        <AdminKpiCard
          label="Audit logs 24h"
          value={health.stats.recentAuditLogs ?? "N/A"}
        />
      </section>

      <section className="mt-8">
        <AdminTable headers={["Check", "Source", "Risk", "Status", "Message"]}>
          {health.checks.map((item) => (
            <tr key={item.key}>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.key}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.source}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={item.risk} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge
                  tone={item.status === "ok" ? "green" : item.status === "warning" ? "yellow" : "red"}
                  value={item.status}
                />
              </td>
              <td className="min-w-80 px-4 py-3 text-slate-600">{item.message}</td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
