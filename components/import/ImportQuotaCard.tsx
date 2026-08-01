import { ArrowRight, Gauge } from "lucide-react";
import Link from "next/link";
import type { DailyUsage } from "@/lib/data/usage";

type ImportQuotaCardProps = {
  maxFileSizeBytes: number;
  maxRows: number;
  monthlyRows: number;
  planName: string;
  quota?: DailyUsage | null;
  schemaReady?: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatMegabytes(bytes: number) {
  return `${formatNumber(Math.round(bytes / (1024 * 1024)))}MB`;
}

function percent(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function ImportQuotaCard({
  maxFileSizeBytes,
  maxRows,
  monthlyRows,
  planName,
  quota,
  schemaReady = true,
}: ImportQuotaCardProps) {
  const quotaPercent = quota ? percent(quota.used, quota.limit) : 0;
  const quotaReached = schemaReady && quota ? quota.remaining <= 0 : false;

  return (
    <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
          <Gauge aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-text-primary">Giới hạn import</h2>
          <p className="mt-2 text-base leading-7 text-text-secondary">
            Gói hiện tại: <span className="font-bold text-text-primary">{planName}</span>.
            Server kiểm tra giới hạn trước khi nhận file.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-control bg-surface-muted px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
            Dòng mỗi file
          </dt>
          <dd className="mt-1 text-base font-bold text-text-primary">
            {formatNumber(maxRows)} dòng
          </dd>
        </div>
        <div className="rounded-control bg-surface-muted px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
            Dung lượng
          </dt>
          <dd className="mt-1 text-base font-bold text-text-primary">
            {formatMegabytes(maxFileSizeBytes)}
          </dd>
        </div>
        <div className="rounded-control bg-surface-muted px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
            Dòng/tháng theo gói
          </dt>
          <dd className="mt-1 text-base font-bold text-text-primary">
            {formatNumber(monthlyRows)}
          </dd>
        </div>
        <div className="rounded-control bg-surface-muted px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
            Lượt import còn lại
          </dt>
          <dd className="mt-1 text-base font-bold text-text-primary">
            {schemaReady && quota ? `${quota.remaining}/${quota.limit}` : "Đang dùng mặc định"}
          </dd>
        </div>
      </dl>

      {schemaReady && quota ? (
        <div
          aria-label={`Đã dùng ${quota.used} trên ${quota.limit} lượt import`}
          aria-valuemax={quota.limit}
          aria-valuemin={0}
          aria-valuenow={quota.used}
          className="mt-4"
          role="progressbar"
        >
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={quotaReached ? "h-full rounded-full bg-danger" : "h-full rounded-full bg-primary"}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          Bảng quota chưa sẵn sàng, SaleMap sẽ dùng kiểm tra server hiện có khi upload.
        </p>
      )}

      {quotaReached ? (
        <div className="mt-4 rounded-control border border-danger/20 bg-danger-soft px-4 py-3">
          <p className="text-sm font-bold text-danger">
            Bạn đã dùng hết lượt import của gói hiện tại.
          </p>
          <Link
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-surface px-4 py-2 text-sm font-bold text-text-primary shadow-sm transition hover:text-primary"
            href="/app/billing"
          >
            Xem gói dịch vụ
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
