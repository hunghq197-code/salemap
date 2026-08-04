import {
  AdminAlertItem,
  type AdminAlertItemData,
} from "@/components/admin/dashboard/AdminAlertItem";

export function AdminAlertCenter({ alerts }: { alerts: AdminAlertItemData[] }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Can xu ly ngay</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Payment, security, import va provider signals can kiem tra truoc.
          </p>
        </div>
        <span className="text-sm font-bold text-slate-500">{alerts.length} alert</span>
      </div>

      {alerts.length > 0 ? (
        <ul className="space-y-3">
          {alerts.map((item) => (
            <AdminAlertItem item={item} key={`${item.source}:${item.title}:${item.status}`} />
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
          Khong co alert van hanh can xu ly.
        </div>
      )}
    </section>
  );
}
