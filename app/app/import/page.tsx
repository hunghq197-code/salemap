import { Download } from "lucide-react";
import { ImportHistory } from "@/components/import/ImportHistory";
import { ImportPageTracker } from "@/components/import/ImportPageTracker";
import { ImportQuotaCard } from "@/components/import/ImportQuotaCard";
import { ImportStepper } from "@/components/import/ImportStepper";
import { ImportUploadForm } from "@/components/import/ImportUploadForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { IMPORT_FILE_LIMITS } from "@/lib/constants/import";
import { getImportJobs } from "@/lib/data/import-jobs";
import { getPlanForCurrentUser } from "@/lib/data/subscriptions";
import { getDailyUsageSnapshot } from "@/lib/data/usage";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const [plan, jobs, quotaSnapshot] = await Promise.all([
    getPlanForCurrentUser(),
    getImportJobs({ limit: 10 }),
    getDailyUsageSnapshot(["import_rows"]),
  ]);
  const limits = IMPORT_FILE_LIMITS[plan.key];
  const importQuota = quotaSnapshot.items[0] ?? null;
  const quotaReached = quotaSnapshot.schemaReady && importQuota ? importQuota.remaining <= 0 : false;
  const disabledReason = quotaReached
    ? "Bạn đã dùng hết lượt import của gói hiện tại. Bạn vẫn có thể xem lịch sử và kết quả import cũ."
    : null;

  return (
    <div className="mx-auto max-w-6xl">
      <ImportPageTracker />

      <PageHeader
        actions={
          <a
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-6 py-3 text-base font-semibold text-text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
            download
            href="/sample-import-leads.csv"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Tải file mẫu
          </a>
        }
        description="Đưa danh sách khách hàng cũ vào SaleMap từ file CSV hoặc Excel."
        eyebrow="Import dữ liệu"
        title="Nhập danh sách khách hàng"
      />

      <ImportStepper activeStep="upload" className="mt-6" />

      <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <ImportUploadForm
          disabledReason={disabledReason}
          maxFileSizeBytes={limits.maxFileSizeBytes}
          maxRows={limits.maxRows}
          sampleHref="/sample-import-leads.csv"
        />

        <div className="space-y-5">
          <ImportQuotaCard
            maxFileSizeBytes={limits.maxFileSizeBytes}
            maxRows={limits.maxRows}
            monthlyRows={limits.monthlyRows}
            planName={plan.name}
            quota={importQuota}
            schemaReady={quotaSnapshot.schemaReady}
          />

          <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
            <h2 className="text-lg font-bold text-text-primary">Quy trình an toàn</h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-text-secondary">
              <li>File được đọc trên server và tạo job riêng cho tài khoản của bạn.</li>
              <li>Bạn luôn xem trước, ánh xạ cột và kiểm tra lỗi trước khi ghi lead.</li>
              <li>Dòng lỗi không được import; nếu có lỗi, bạn có thể tải file lỗi ở trang chi tiết.</li>
              <li>SaleMap không hiển thị đường dẫn file cục bộ hoặc storage path.</li>
            </ul>
          </section>
        </div>
      </section>

      <div className="mt-8">
        <ImportHistory jobs={jobs.items} />
      </div>
    </div>
  );
}
