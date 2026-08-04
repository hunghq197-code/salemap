import { resolveSecurityEventFromSecurityPageAction } from "@/app/admin/audit-logs/actions";
import { AdminConfirmSubmitButton } from "@/components/admin/AdminConfirmSubmitButton";
import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { ADMIN_PERMISSIONS, hasPermission } from "@/lib/admin/admin-permissions";
import { getAdminContext } from "@/lib/admin/auth";
import { getAdminSecurityEvents } from "@/lib/admin/data/security";
import { getParam, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminSecurityEventsPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string | null) {
  if (!value) {
    return "Chua co";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatMetadata(value?: Record<string, unknown> | null) {
  const entries = Object.entries(value ?? {}).slice(0, 6);

  if (entries.length === 0) {
    return "Khong co metadata";
  }

  return entries
    .map(([key, item]) => `${key}: ${typeof item === "object" ? "[object]" : String(item)}`)
    .join("; ");
}

export default async function AdminSecurityEventsPage(props: AdminSecurityEventsPageProps) {
  const searchParams = await props.searchParams;
  const [events, admin] = await Promise.all([
    getAdminSecurityEvents(searchParams),
    getAdminContext(),
  ]);
  const canResolve = Boolean(
    admin && hasPermission(admin.role, ADMIN_PERMISSIONS.RESOLVE_SECURITY_EVENTS),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo doi security event da duoc sanitize. Khong hien token, secret, raw webhook payload hoac stack trace."
        title="Security events"
      />

      <div className="mt-6">
        <AdminFilterBar action="/admin/security-events" resetHref="/admin/security-events">
          <AdminField label="Event type">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "eventType") || ""}
              name="eventType"
              placeholder="admin_access_denied"
            />
          </AdminField>
          <AdminField label="Severity">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "severity") || ""}
              name="severity"
            >
              <option value="">Tat ca</option>
              <option value="info">info</option>
              <option value="warning">warning</option>
              <option value="critical">critical</option>
            </select>
          </AdminField>
          <AdminField label="Resolved">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "resolved") || ""}
              name="resolved"
            >
              <option value="">Tat ca</option>
              <option value="false">Chua xu ly</option>
              <option value="true">Da xu ly</option>
            </select>
          </AdminField>
        </AdminFilterBar>
      </div>

      <AdminTable
        empty={events.items.length === 0}
        headers={["Time", "Event", "User", "Route", "Severity", "Resolved", "Message", "Action"]}
      >
        {events.items.map((event) => {
          const resolveAction = resolveSecurityEventFromSecurityPageAction.bind(null, event.id);

          return (
            <tr key={event.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(event.created_at)}</td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{event.event_type}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{event.userLabel}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {event.method || "-"} {event.route || "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={event.severity || "info"} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={event.resolved ? "resolved" : "open"} />
              </td>
              <td className="min-w-72 px-4 py-3 text-slate-600">
                {event.message || formatMetadata(event.metadata)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {event.resolved ? (
                  <span className="text-xs font-bold text-slate-400">Da xu ly</span>
                ) : canResolve ? (
                  <form action={resolveAction}>
                    <AdminConfirmSubmitButton
                      confirmMessage="Danh dau su kien bao mat nay la da xu ly?"
                      icon="shield"
                      label="Danh dau xu ly"
                    />
                  </form>
                ) : (
                  <span className="text-xs font-bold text-slate-400">Read-only</span>
                )}
              </td>
            </tr>
          );
        })}
      </AdminTable>

      <AdminPagination
        basePath="/admin/security-events"
        limit={events.limit}
        page={events.page}
        params={searchParams}
        totalPages={events.totalPages}
      />
    </div>
  );
}
