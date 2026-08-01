import { History } from "lucide-react";
import Link from "next/link";
import { ImportHistoryItem, statusLabel, statusTone } from "@/components/import/ImportHistoryItem";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ImportJobRecord } from "@/lib/data/import-jobs";

type ImportHistoryProps = {
  jobs: ImportJobRecord[];
};

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

export function ImportHistory({ jobs }: ImportHistoryProps) {
  return (
    <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6">
      <SectionHeader
        description="Các file bạn đã upload và trạng thái xử lý gần đây."
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <History aria-hidden="true" className="h-4 w-4" />
            Lịch sử
          </span>
        }
        title="Lịch sử import"
      />

      {jobs.length === 0 ? (
        <div className="mt-5 rounded-control border border-dashed border-border-strong bg-surface-muted p-5 text-base leading-7 text-text-secondary">
          Chưa có lịch sử import nào. Khi bạn tải file lên, job sẽ xuất hiện ở đây để kiểm tra lại.
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 md:hidden">
            {jobs.map((job) => (
              <ImportHistoryItem job={job} key={job.id} />
            ))}
          </div>

          <div className="mt-5 hidden overflow-x-auto rounded-control border border-border-soft md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-[0.12em] text-text-muted">
                <tr>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Dòng</th>
                  <th className="px-4 py-3">Thành công</th>
                  <th className="px-4 py-3">Lỗi</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft bg-surface">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="max-w-xs truncate px-4 py-3 font-bold text-text-primary">
                      {job.file_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {formatNumber(job.total_rows)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {formatNumber(job.imported_rows + job.updated_rows)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {formatNumber(job.invalid_rows + job.failed_rows)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge tone={statusTone(job.status)}>{statusLabel(job.status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                        href={`/app/import/${job.id}`}
                      >
                        Mở
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
