import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminInlineUpdateForm } from "@/components/admin/AdminInlineUpdateForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageTracker } from "@/components/admin/AdminPageTracker";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import {
  FEEDBACK_PRIORITY_OPTIONS,
  FEEDBACK_STATUS_OPTIONS,
  getAdminFeedback,
} from "@/lib/admin/data/feedback";
import { getParam, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminFeedbackPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

function preview(value?: string | null, length = 120) {
  if (!value) {
    return "Chưa có";
  }

  return value.length > length ? `${value.slice(0, length)}...` : value;
}

export default async function AdminFeedbackPage(props: AdminFeedbackPageProps) {
  const searchParams = await props.searchParams;
  const result = await getAdminFeedback(searchParams);
  const filterApplied = Boolean(
    getParam(searchParams, "type") ||
      getParam(searchParams, "rating") ||
      getParam(searchParams, "status") ||
      getParam(searchParams, "priority") ||
      getParam(searchParams, "fromDate") ||
      getParam(searchParams, "toDate"),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageTracker filterApplied={filterApplied} page="feedback" />
      <AdminPageHeader
        description="Xem feedback, phân loại priority và cập nhật trạng thái xử lý."
        title="Feedback"
      />

      <div className="mt-6">
        <AdminFilterBar action="/admin/feedback" resetHref="/admin/feedback">
          <AdminField label="Feedback type">
            <input className={inputClass} defaultValue={getParam(searchParams, "type") || ""} name="type" />
          </AdminField>
          <AdminField label="Rating">
            <input className={inputClass} defaultValue={getParam(searchParams, "rating") || ""} max="5" min="1" name="rating" type="number" />
          </AdminField>
          <AdminField label="Status">
            <select className={inputClass} defaultValue={getParam(searchParams, "status") || ""} name="status">
              <option value="">Tất cả</option>
              {FEEDBACK_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Priority">
            <select className={inputClass} defaultValue={getParam(searchParams, "priority") || ""} name="priority">
              <option value="">Tất cả</option>
              {FEEDBACK_PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Từ ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "fromDate") || ""} name="fromDate" type="date" />
          </AdminField>
          <AdminField label="Đến ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "toDate") || ""} name="toDate" type="date" />
          </AdminField>
        </AdminFilterBar>
      </div>

      <AdminTable
        empty={result.items.length === 0}
        headers={[
          "Ngày gửi",
          "User",
          "Type",
          "Rating",
          "Title",
          "Content preview",
          "Page path",
          "Device",
          "Status",
          "Priority",
          "Chi tiết / cập nhật",
        ]}
      >
        {result.items.map((feedback) => (
          <tr key={feedback.id}>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(feedback.created_at)}</td>
            <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{feedback.userLabel}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{feedback.feedback_type}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{feedback.rating ?? "Chưa có"}</td>
            <td className="min-w-[180px] px-4 py-3 font-semibold text-ink">{feedback.title || "Chưa có title"}</td>
            <td className="min-w-[260px] px-4 py-3 text-slate-600">{preview(feedback.content)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{feedback.page_path || "Chưa có"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{feedback.device_type || "Chưa có"}</td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminStatusBadge value={feedback.status} />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminStatusBadge value={feedback.priority} />
            </td>
            <td className="px-4 py-3">
              <details className="min-w-[320px]">
                <summary className="cursor-pointer text-sm font-bold text-ocean">
                  Mở chi tiết
                </summary>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <p className="font-bold text-ink">Full content</p>
                  <p className="mt-2 whitespace-pre-wrap">{feedback.content}</p>
                  <p className="mt-3 font-bold text-ink">Browser/device</p>
                  <p className="mt-1">{feedback.browser_info || "Chưa có"}</p>
                </div>
                <div className="mt-3">
                  <AdminInlineUpdateForm
                    adminNote={feedback.admin_note}
                    endpoint={`/api/admin/feedback/${feedback.id}`}
                    eventType="feedback"
                    fields={[
                      {
                        defaultValue: feedback.status,
                        label: "Status",
                        name: "status",
                        options: [...FEEDBACK_STATUS_OPTIONS],
                      },
                      {
                        defaultValue: feedback.priority,
                        label: "Priority",
                        name: "priority",
                        options: [...FEEDBACK_PRIORITY_OPTIONS],
                      },
                    ]}
                  />
                </div>
              </details>
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        basePath="/admin/feedback"
        limit={result.limit}
        page={result.page}
        params={searchParams}
        totalPages={result.totalPages}
      />
    </div>
  );
}
