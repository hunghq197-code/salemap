import { ArrowLeft, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  DUPLICATE_STRATEGIES,
  IMPORTABLE_LEAD_FIELDS,
  type DuplicateStrategy,
} from "@/lib/constants/import";
import type { ImportJobRecord } from "@/lib/data/import-jobs";
import type { FieldMapping } from "@/lib/import/field-mapping";

type ImportConfirmationProps = {
  canExecute: boolean;
  duplicateStrategy: DuplicateStrategy;
  fieldMapping: FieldMapping;
  isImporting: boolean;
  job: ImportJobRecord;
  onDuplicateStrategyChange: (strategy: DuplicateStrategy) => void;
  onExecuteImport: () => void;
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

function expectedCreatedRows(job: ImportJobRecord, duplicateStrategy: DuplicateStrategy) {
  if (duplicateStrategy === "skip" || duplicateStrategy === "update_existing") {
    return job.valid_rows;
  }

  return job.valid_rows + job.duplicate_rows;
}

function fieldLabel(fieldKey: string | null) {
  return IMPORTABLE_LEAD_FIELDS.find((field) => field.key === fieldKey)?.label ?? fieldKey;
}

export function ImportConfirmation({
  canExecute,
  duplicateStrategy,
  fieldMapping,
  isImporting,
  job,
  onDuplicateStrategyChange,
  onExecuteImport,
}: ImportConfirmationProps) {
  const mappedFields = Object.entries(fieldMapping).filter(([, field]) => Boolean(field));
  const expectedCreated = expectedCreatedRows(job, duplicateStrategy);
  const expectedProcessed =
    duplicateStrategy === "skip" ? job.valid_rows : job.valid_rows + job.duplicate_rows;

  return (
    <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6">
      <SectionHeader
        description="Kiểm tra lần cuối trước khi SaleMap tạo hoặc cập nhật lead từ các dòng hợp lệ."
        eyebrow="Bước 4"
        title="Xác nhận nhập dữ liệu"
      />

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["File", job.file_name],
          ["Tổng dòng", formatNumber(job.total_rows)],
          ["Lỗi bị bỏ qua", formatNumber(job.invalid_rows + job.failed_rows)],
          ["Lead dự kiến tạo", formatNumber(expectedCreated)],
        ].map(([label, value]) => (
          <div className="rounded-control border border-border-soft bg-surface-muted p-4" key={label}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
              {label}
            </p>
            <p className="mt-2 break-words text-base font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <RadioGroup
          legend="Cách xử lý dòng có thể trùng"
          name="duplicateStrategy"
          onChange={(value) => onDuplicateStrategyChange(value as DuplicateStrategy)}
          options={DUPLICATE_STRATEGIES.map((strategy) => ({
            description: strategy.description,
            label: strategy.label,
            value: strategy.key,
          }))}
          value={duplicateStrategy}
        />

        <aside className="rounded-control border border-primary/20 bg-primary-soft p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
            Tiêu chí trùng hiện có
          </h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-text-secondary">
            Server kiểm tra lại theo số điện thoại, email, website hoặc cặp tên và địa chỉ trước khi import.
          </p>
          <p className="mt-3 text-sm font-semibold leading-6 text-text-secondary">
            Job tạo lúc {formatDate(job.created_at)}. Không có đường dẫn file hoặc signed URL được hiển thị.
          </p>
        </aside>
      </div>

      <div className="mt-5 rounded-control border border-border-soft bg-surface-muted p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-bold text-text-primary">Mapping sẽ được dùng khi ghi dữ liệu</p>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              {mappedFields.length > 0
                ? mappedFields.map(([header, field]) => `${header} → ${fieldLabel(field)}`).join("; ")
                : "Chưa có cột nào được map."}
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-20 z-10 -mx-4 mt-5 border-t border-border-soft bg-surface px-4 py-4 sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold leading-6 text-text-secondary">
            Sau khi xác nhận, SaleMap sẽ xử lý {formatNumber(expectedProcessed)} dòng. Server không tin số liệu tính từ client.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-5 py-3 text-base font-bold text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary"
              href="#import-review"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Quay lại kiểm tra
            </a>
            <Button
              disabled={!canExecute || isImporting}
              icon={<Play aria-hidden="true" className="h-5 w-5" />}
              iconPosition="left"
              loading={isImporting}
              loadingLabel="Đang nhập dữ liệu..."
              onClick={onExecuteImport}
              size="lg"
              variant="success"
            >
              Bắt đầu nhập dữ liệu
            </Button>
          </div>
        </div>
        {!canExecute ? (
          <p className="mt-3 text-sm font-semibold leading-6 text-text-muted">
            Vui lòng kiểm tra dữ liệu trước khi chạy import.
          </p>
        ) : null}
      </div>
    </section>
  );
}
