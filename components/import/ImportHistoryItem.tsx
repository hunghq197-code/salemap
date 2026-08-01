import { FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { ImportJobRecord } from "@/lib/data/import-jobs";

type ImportHistoryItemProps = {
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
  validated: "Đã kiểm tra",
};

const statusTones: Record<string, "danger" | "neutral" | "primary" | "success" | "warning"> = {
  cancelled: "neutral",
  completed: "success",
  failed: "danger",
  importing: "primary",
  mapped: "primary",
  previewed: "warning",
  uploaded: "warning",
  validated: "success",
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

export function statusLabel(status: string) {
  return statusLabels[status] ?? status;
}

export function statusTone(status: string) {
  return statusTones[status] ?? "neutral";
}

export function ImportHistoryItem({ job }: ImportHistoryItemProps) {
  const importedCount = job.imported_rows + job.updated_rows;

  return (
    <article className="rounded-control border border-border-soft bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-text-primary">{job.file_name}</p>
          <p className="mt-1 text-sm font-semibold text-text-secondary">
            {formatDate(job.created_at)} · {job.file_type.toUpperCase()}
          </p>
        </div>
        <Badge tone={statusTone(job.status)}>{statusLabel(job.status)}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="font-bold text-text-muted">Dòng</dt>
          <dd className="mt-1 font-bold text-text-primary">{formatNumber(job.total_rows)}</dd>
        </div>
        <div>
          <dt className="font-bold text-text-muted">Thành công</dt>
          <dd className="mt-1 font-bold text-text-primary">{formatNumber(importedCount)}</dd>
        </div>
        <div>
          <dt className="font-bold text-text-muted">Lỗi</dt>
          <dd className="mt-1 font-bold text-text-primary">
            {formatNumber(job.invalid_rows + job.failed_rows)}
          </dd>
        </div>
      </dl>
      <Link
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
        href={`/app/import/${job.id}`}
      >
        <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
        Xem chi tiết
      </Link>
    </article>
  );
}
