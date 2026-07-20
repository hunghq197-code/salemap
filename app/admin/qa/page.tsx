import { ClipboardCheck } from "lucide-react";
import { updateQaChecklistAction } from "@/app/admin/qa/actions";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminQaStatusForm } from "@/components/admin/AdminQaStatusForm";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getQaChecklist, type QaChecklistItem } from "@/lib/admin/data/qa-checklist";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

function ChecklistTable({
  items,
  title,
}: {
  items: QaChecklistItem[];
  title: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xl font-bold text-ink">{title}</h2>
      <AdminTable
        empty={items.length === 0}
        headers={["Name", "Description", "Status", "Last checked", "Actions"]}
      >
        {items.map((item) => {
          const action = updateQaChecklistAction.bind(null, item.checklist_key);

          return (
            <tr key={item.checklist_key}>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                {item.name}
              </td>
              <td className="min-w-[280px] px-4 py-3 text-slate-600">
                {item.description || "Chưa có"}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={item.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(item.last_checked_at)}
              </td>
              <td className="min-w-[360px] px-4 py-3">
                <AdminQaStatusForm
                  action={action}
                  checklistKey={item.checklist_key}
                  currentStatus={item.status}
                />
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </section>
  );
}

export default async function AdminQaPage() {
  const checklist = await getQaChecklist();
  const allItems = [...checklist.productItems, ...checklist.launchItems];

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Rà checklist nội bộ trước khi mở rộng thêm user. Mỗi dòng nên được mark lại sau khi test thủ công."
        title="QA Checklist"
      />

      {!checklist.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
          Chưa thấy bảng qa_checklists. Hãy chạy file SQL public-beta-readiness trong Supabase trước.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <AdminKpiCard
          icon={<ClipboardCheck className="h-5 w-5" />}
          label="Tổng checklist"
          value={allItems.length}
        />
        <AdminKpiCard
          label="Passed"
          value={allItems.filter((item) => item.status === "passed").length}
        />
        <AdminKpiCard
          label="Needs review"
          value={allItems.filter((item) => item.status === "needs_review").length}
        />
        <AdminKpiCard
          label="Failed"
          value={allItems.filter((item) => item.status === "failed").length}
        />
      </section>

      <ChecklistTable items={checklist.productItems} title="Product QA Checklist" />
      <ChecklistTable
        items={checklist.launchItems}
        title="Launch Checklist"
      />
    </div>
  );
}
