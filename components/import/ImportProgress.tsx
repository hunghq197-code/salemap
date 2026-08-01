import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ImportJobRecord } from "@/lib/data/import-jobs";

type ImportProgressProps = {
  job: ImportJobRecord;
};

const statusLabels: Record<string, string> = {
  cancelled: "Đã hủy",
  completed: "Hoàn tất",
  failed: "Lỗi",
  importing: "Đang import",
  mapped: "Đã ánh xạ",
  previewed: "Đã xem trước",
  uploaded: "Đã upload",
  validated: "Sẵn sàng nhập",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

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

export function ImportProgress({ job }: ImportProgressProps) {
  const totalProcessableRows = Math.max(1, job.valid_rows + job.duplicate_rows);
  const processedRows = job.imported_rows + job.updated_rows + job.skipped_rows + job.failed_rows;
  const progress = Math.min(100, Math.round((processedRows / totalProcessableRows) * 100));
  const isImporting = job.status === "importing";

  return (
    <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6">
      <SectionHeader
        description="SaleMap hiển thị tiến trình dựa trên số dòng đã xử lý thật trong job hiện tại."
        eyebrow="Bước 5"
        title="Theo dõi xử lý"
      />

      <div className="mt-5 flex flex-col gap-4 rounded-control border border-border-soft bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <Loader2 aria-hidden="true" className={`h-5 w-5 ${isImporting ? "animate-spin" : ""}`} />
          </span>
          <div>
            <p className="text-base font-bold text-text-primary">
              {statusLabels[job.status] ?? job.status}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-text-secondary">
              Bắt đầu: {formatDate(job.started_at)} · Hoàn tất: {formatDate(job.completed_at)}
            </p>
          </div>
        </div>
        <Badge tone={job.status === "failed" ? "danger" : job.status === "completed" ? "success" : "primary"}>
          {formatNumber(processedRows)}/{formatNumber(totalProcessableRows)} dòng
        </Badge>
      </div>

      <div
        aria-label={`Đã xử lý ${processedRows} trên ${totalProcessableRows} dòng`}
        aria-valuemax={totalProcessableRows}
        aria-valuemin={0}
        aria-valuenow={processedRows}
        className="mt-4"
        role="progressbar"
      >
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}
