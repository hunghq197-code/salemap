import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ImportJobRecord } from "@/lib/data/import-jobs";

type ImportResultProps = {
  job: ImportJobRecord;
  onErrorCsvDownloaded?: () => void;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function getTitle(job: ImportJobRecord) {
  if (job.status === "failed") {
    return "Không thể hoàn tất import";
  }

  if (job.failed_rows > 0 || job.invalid_rows > 0) {
    return "Đã nhập dữ liệu, nhưng có một số dòng chưa được xử lý";
  }

  return "Đã nhập dữ liệu";
}

export function ImportResult({ job, onErrorCsvDownloaded }: ImportResultProps) {
  const hasErrorRows = job.invalid_rows + job.failed_rows > 0;
  const failed = job.status === "failed";
  const Icon = failed || hasErrorRows ? AlertTriangle : CheckCircle2;

  return (
    <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6">
      <SectionHeader
        description={
          failed
            ? "SaleMap không ghi stack trace hoặc lỗi hệ thống ra màn hình. Vui lòng thử lại sau khi kiểm tra dữ liệu."
            : "Bạn có thể mở danh sách lead để tiếp tục ghi chú, đặt follow-up hoặc đưa lead vào pipeline."
        }
        eyebrow="Kết quả"
        title={getTitle(job)}
      />

      <div className="mt-5 flex gap-3 rounded-control border border-border-soft bg-surface-muted p-4">
        <Icon
          aria-hidden="true"
          className={`mt-0.5 h-5 w-5 shrink-0 ${failed || hasErrorRows ? "text-amber-700" : "text-emerald-700"}`}
        />
        <p className="text-sm font-semibold leading-6 text-text-secondary">
          {failed
            ? "Import chưa hoàn tất. SaleMap không tự động retry để tránh tạo dữ liệu trùng ngoài ý muốn."
            : `Đã tạo ${formatNumber(job.imported_rows)} lead mới, cập nhật ${formatNumber(
                job.updated_rows,
              )} lead và bỏ qua ${formatNumber(job.skipped_rows)} dòng.`}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Đã tạo mới", job.imported_rows],
          ["Đã cập nhật", job.updated_rows],
          ["Đã bỏ qua", job.skipped_rows],
          ["Thất bại", job.failed_rows],
        ].map(([label, value]) => (
          <div className="rounded-control border border-border-soft bg-surface-muted p-4" key={label}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-text-primary">
              {formatNumber(Number(value))}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button
          href="/app/leads"
          icon={<FileSpreadsheet aria-hidden="true" className="h-5 w-5" />}
          iconPosition="left"
          size="lg"
          variant="primary"
        >
          Xem danh sách lead
        </Button>
        <Button href="/app/import" size="lg" variant="secondary">
          Nhập file khác
        </Button>
        {hasErrorRows ? (
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-5 py-3 text-base font-bold text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary"
            href={`/api/import/leads/${job.id}/error-csv`}
            onClick={onErrorCsvDownloaded}
          >
            <Download aria-hidden="true" className="h-5 w-5" />
            Xem chi tiết lỗi
          </Link>
        ) : null}
      </div>
    </section>
  );
}
