import { Download, FileSpreadsheet, History, Info } from "lucide-react";
import Link from "next/link";
import { ImportPageTracker } from "@/components/import/ImportPageTracker";
import { ImportUploadForm } from "@/components/import/ImportUploadForm";
import { IMPORT_FILE_LIMITS } from "@/lib/constants/import";
import { getImportJobs } from "@/lib/data/import-jobs";
import { getPlanForCurrentUser } from "@/lib/data/subscriptions";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    cancelled: "Đã hủy",
    completed: "Hoàn tất",
    failed: "Lỗi",
    importing: "Đang import",
    mapped: "Đã mapping",
    previewed: "Đã preview",
    uploaded: "Đã upload",
    validated: "Đã kiểm tra",
  };

  return labels[status] ?? status;
}

export default async function ImportPage() {
  const [plan, jobs] = await Promise.all([
    getPlanForCurrentUser(),
    getImportJobs({ limit: 10 }),
  ]);
  const limits = IMPORT_FILE_LIMITS[plan.key];

  return (
    <div className="mx-auto max-w-6xl">
      <ImportPageTracker />

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Import dữ liệu
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Import lead từ Excel/CSV
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Đưa danh sách khách hàng cũ vào SaleMap để tiếp tục ghi chú, follow-up và chăm sóc
            trên một nơi duy nhất.
          </p>
        </div>
        <a
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean"
          download
          href="/sample-import-leads.csv"
        >
          <Download aria-hidden="true" className="h-5 w-5" />
          Tải file mẫu
        </a>
      </div>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <ImportUploadForm />

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
              <Info aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">Hướng dẫn định dạng</h2>
              <p className="mt-2 text-base leading-7 text-slate-600">
                File cần có dòng đầu tiên là tên cột. Mỗi dòng nên có ít nhất tên khách, số điện
                thoại, email hoặc website.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-cloud px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Gói hiện tại
              </p>
              <p className="mt-1 text-base font-bold text-ink">{plan.name}</p>
            </div>
            <div className="rounded-lg bg-cloud px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Giới hạn mỗi file
              </p>
              <p className="mt-1 text-base font-bold text-ink">
                {formatNumber(limits.maxRows)} dòng / 10MB
              </p>
            </div>
          </div>
          <ul className="mt-5 space-y-2 text-sm font-semibold leading-6 text-slate-600">
            <li>Hỗ trợ: .csv và .xlsx.</li>
            <li>Không import ngay sau upload. Bạn luôn được preview, mapping và validate trước.</li>
            <li>Dòng lỗi sẽ bị bỏ qua và có thể tải file lỗi để sửa lại.</li>
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
            <History aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink">Lịch sử import</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Các file bạn đã upload và trạng thái xử lý gần đây.
            </p>
          </div>
        </div>

        {jobs.items.length === 0 ? (
          <div className="mt-5 rounded-lg bg-cloud p-5 text-base leading-7 text-slate-600">
            Chưa có lịch sử import nào.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">File</th>
                  <th className="px-3 py-3">Ngày</th>
                  <th className="px-3 py-3">Dòng</th>
                  <th className="px-3 py-3">Imported</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.items.map((job) => (
                  <tr key={job.id}>
                    <td className="max-w-xs truncate px-3 py-3 font-bold text-ink">
                      {job.file_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                      {formatNumber(job.total_rows)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                      {formatNumber(job.imported_rows + job.updated_rows)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="inline-flex min-h-7 items-center rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-700">
                        {statusLabel(job.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <Link
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-ocean"
                        href={`/app/import/${job.id}`}
                      >
                        <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
                        Mở
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
