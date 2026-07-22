import { resolveSecurityEventAction } from "@/app/admin/audit-logs/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import {
  getAdminAuditLogs,
  getAdminSecurityEvents,
} from "@/lib/admin/data/security";
import { getParam, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminAuditLogsPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatMetadata(value?: Record<string, unknown> | null) {
  const entries = Object.entries(value ?? {}).slice(0, 6);

  if (entries.length === 0) {
    return "Không có";
  }

  return entries
    .map(([key, item]) => `${key}: ${typeof item === "object" ? "[object]" : String(item)}`)
    .join("; ");
}

export default async function AdminAuditLogsPage(props: AdminAuditLogsPageProps) {
  const searchParams = await props.searchParams;
  const [auditLogs, securityEvents] = await Promise.all([
    getAdminAuditLogs(searchParams),
    getAdminSecurityEvents(searchParams),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi admin action, thao tác nhạy cảm và security event đã được sanitize metadata."
        title="Nhật ký quản trị"
      />

      <div className="mt-6">
        <AdminFilterBar action="/admin/audit-logs" resetHref="/admin/audit-logs">
          <AdminField label="Tìm kiếm">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "q") || ""}
              name="q"
              placeholder="Action, actor hoặc target"
            />
          </AdminField>
          <AdminField label="Action">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "action") || ""}
              name="action"
              placeholder="quota_updated"
            />
          </AdminField>
          <AdminField label="Severity">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "severity") || ""}
              name="severity"
            >
              <option value="">Tất cả</option>
              <option value="info">info</option>
              <option value="warning">warning</option>
              <option value="critical">critical</option>
            </select>
          </AdminField>
          <AdminField label="Security resolved">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "resolved") || ""}
              name="resolved"
            >
              <option value="">Tất cả</option>
              <option value="false">Chưa xử lý</option>
              <option value="true">Đã xử lý</option>
            </select>
          </AdminField>
        </AdminFilterBar>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">Admin actions</h2>
        <AdminTable
          empty={auditLogs.items.length === 0}
          headers={["Time", "Actor", "Role", "Action", "Target", "Severity", "Metadata"]}
        >
          {auditLogs.items.map((log) => (
            <tr key={log.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(log.created_at)}</td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{log.actorLabel}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{log.actor_role || "system"}</td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{log.action}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {log.target_type || "-"} / {log.target_id || "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={log.severity || "info"} />
              </td>
              <td className="min-w-80 px-4 py-3 text-slate-600">{formatMetadata(log.metadata)}</td>
            </tr>
          ))}
        </AdminTable>
        <AdminPagination
          basePath="/admin/audit-logs"
          limit={auditLogs.limit}
          page={auditLogs.page}
          params={searchParams}
          totalPages={auditLogs.totalPages}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold text-ink">Sự kiện bảo mật</h2>
        <AdminTable
          empty={securityEvents.items.length === 0}
          headers={["Time", "Event", "User", "Route", "Severity", "Resolved", "Message", "Action"]}
        >
          {securityEvents.items.map((event) => {
            const resolveAction = resolveSecurityEventAction.bind(null, event.id);

            return (
              <tr key={event.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(event.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{event.event_type}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{event.userLabel}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{event.method || "-"} {event.route || "-"}</td>
                <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={event.severity || "info"} /></td>
                <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={event.resolved ? "resolved" : "open"} /></td>
                <td className="min-w-72 px-4 py-3 text-slate-600">{event.message || formatMetadata(event.metadata)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {event.resolved ? (
                    <span className="text-xs font-bold text-slate-400">Đã xử lý</span>
                  ) : (
                    <form action={resolveAction}>
                      <button
                        className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-ink hover:border-ocean"
                        type="submit"
                      >
                        Đánh dấu xử lý
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </section>
    </div>
  );
}
