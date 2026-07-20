"use client";

import { AlertTriangle, CheckCircle2, Download, Play, RefreshCw, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  trackImportErrorCsvDownloaded,
  trackImportExecuteCompleted,
  trackImportExecuteFailed,
  trackImportExecuteStarted,
  trackImportMappingSaved,
  trackImportValidationCompleted,
  trackImportValidationStarted,
} from "@/lib/analytics/client";
import {
  DUPLICATE_STRATEGIES,
  IMPORTABLE_LEAD_FIELDS,
  type DuplicateStrategy,
  type ImportableLeadFieldKey,
} from "@/lib/constants/import";
import type { ImportJobRecord } from "@/lib/data/import-jobs";
import type { ImportRowsResult } from "@/lib/data/import-rows";
import type { FieldMapping } from "@/lib/import/field-mapping";

type ImportJobDetailClientProps = {
  job: ImportJobRecord;
  rows: ImportRowsResult;
  rowStatus?: string;
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

function rawPreview(row: Record<string, string>) {
  return Object.entries(row)
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");
}

function errorMessages(errors: Array<{ message?: string }> | null) {
  return errors?.map((error) => error.message).filter(Boolean).join("; ") || "";
}

export function ImportJobDetailClient({
  job,
  rows,
  rowStatus,
}: ImportJobDetailClientProps) {
  const router = useRouter();
  const headers = useMemo(
    () => Object.keys(job.sample_rows?.[0] ?? rows.items[0]?.raw_data ?? {}),
    [job.sample_rows, rows.items],
  );
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>(
    (job.field_mapping ?? {}) as FieldMapping,
  );
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>(
    (job.duplicate_strategy as DuplicateStrategy | null) ?? "skip",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isSavingMapping, setIsSavingMapping] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const mappedSafetyFields = new Set(Object.values(fieldMapping).filter(Boolean));
  const hasContactMapping =
    mappedSafetyFields.has("name") ||
    mappedSafetyFields.has("phone") ||
    mappedSafetyFields.has("email") ||
    mappedSafetyFields.has("website");
  const canExecute = job.status === "validated";
  const isCompleted = job.status === "completed";

  async function saveMapping() {
    setIsSavingMapping(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/import/leads/${job.id}/mapping`, {
        body: JSON.stringify({ fieldMapping }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Không thể lưu mapping lúc này.");
      }

      trackImportMappingSaved({ fileType: job.file_type, totalRows: job.total_rows });
      setMessage("Đã lưu mapping.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu mapping lúc này.");
    } finally {
      setIsSavingMapping(false);
    }
  }

  async function validateRows() {
    setIsValidating(true);
    setMessage(null);
    trackImportValidationStarted({ fileType: job.file_type, totalRows: job.total_rows });

    try {
      const mappingResponse = await fetch(`/api/import/leads/${job.id}/mapping`, {
        body: JSON.stringify({ fieldMapping }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!mappingResponse.ok) {
        throw new Error("Không thể lưu mapping trước khi kiểm tra.");
      }

      const response = await fetch(`/api/import/leads/${job.id}/validate`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error("Không thể kiểm tra dữ liệu lúc này.");
      }

      trackImportValidationCompleted({
        duplicateRows: payload.data.duplicateRows,
        fileType: job.file_type,
        invalidRows: payload.data.invalidRows,
        totalRows: payload.data.totalRows,
        validRows: payload.data.validRows,
      });
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể kiểm tra dữ liệu lúc này.");
    } finally {
      setIsValidating(false);
    }
  }

  async function executeImport() {
    setIsImporting(true);
    setMessage(null);
    trackImportExecuteStarted({
      duplicateStrategy,
      duplicateRows: job.duplicate_rows,
      fileType: job.file_type,
      invalidRows: job.invalid_rows,
      totalRows: job.total_rows,
      validRows: job.valid_rows,
    });

    try {
      const response = await fetch(`/api/import/leads/${job.id}/execute`, {
        body: JSON.stringify({ duplicateStrategy }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Không thể import lúc này.");
      }

      trackImportExecuteCompleted({
        duplicateStrategy,
        failedRows: payload.data.failedRows,
        fileType: job.file_type,
        importedRows: payload.data.importedRows,
        updatedRows: payload.data.updatedRows,
      });
      router.refresh();
    } catch (error) {
      trackImportExecuteFailed({ duplicateStrategy, fileType: job.file_type });
      setMessage(error instanceof Error ? error.message : "Không thể import lúc này.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          {message}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
              Bước 1
            </p>
            <h2 className="mt-2 text-xl font-bold text-ink">Preview file</h2>
            <p className="mt-2 text-base leading-7 text-slate-600">
              {job.file_name} · {job.file_type.toUpperCase()} · {formatNumber(job.total_rows)} dòng
              · upload {formatDate(job.created_at)}
            </p>
          </div>
          <span className="inline-flex min-h-9 items-center rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-700">
            {job.status}
          </span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                {headers.map((header) => (
                  <th className="whitespace-nowrap px-3 py-3" key={header}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(job.sample_rows ?? []).slice(0, 10).map((row, index) => (
                <tr key={index}>
                  {headers.map((header) => (
                    <td className="max-w-xs truncate px-3 py-3 text-slate-700" key={header}>
                      {row[header] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">Bước 2</p>
        <h2 className="mt-2 text-xl font-bold text-ink">Mapping cột</h2>
        <p className="mt-2 text-base leading-7 text-slate-600">
          Mỗi cột trong file cần được map sang field SaleMap hoặc bỏ qua.
        </p>

        {!hasContactMapping ? (
          <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            File nên có ít nhất tên khách, số điện thoại, email hoặc website.
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {headers.map((header) => (
            <label className="text-sm font-bold text-ink" key={header}>
              Cột trong file: “{header}”
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                onChange={(event) =>
                  setFieldMapping((current) => ({
                    ...current,
                    [header]: event.target.value
                      ? (event.target.value as ImportableLeadFieldKey)
                      : null,
                  }))
                }
                value={fieldMapping[header] ?? ""}
              >
                <option value="">Không import cột này</option>
                {IMPORTABLE_LEAD_FIELDS.map((field) => (
                  <option key={field.key} value={field.key}>
                    {field.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean disabled:opacity-70"
            disabled={isSavingMapping}
            onClick={saveMapping}
            type="button"
          >
            <Save aria-hidden="true" className="h-5 w-5" />
            {isSavingMapping ? "Đang lưu..." : "Lưu mapping"}
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white hover:bg-ocean disabled:opacity-70"
            disabled={isValidating}
            onClick={validateRows}
            type="button"
          >
            <RefreshCw aria-hidden="true" className={`h-5 w-5 ${isValidating ? "animate-spin" : ""}`} />
            {isValidating ? "Đang kiểm tra..." : "Kiểm tra dữ liệu"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">Bước 3</p>
        <h2 className="mt-2 text-xl font-bold text-ink">Kiểm tra dữ liệu</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ["Tổng dòng", job.total_rows],
            ["Hợp lệ", job.valid_rows],
            ["Có lỗi", job.invalid_rows],
            ["Có thể trùng", job.duplicate_rows],
          ].map(([label, value]) => (
            <div className="rounded-lg bg-cloud px-4 py-3" key={label}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold text-ink">{formatNumber(Number(value))}</p>
            </div>
          ))}
        </div>

        {job.invalid_rows > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <span>Các dòng lỗi sẽ không được import. Bạn có thể tải file lỗi để sửa và import lại.</span>
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-ink"
              href={`/api/import/leads/${job.id}/error-csv`}
              onClick={() =>
                trackImportErrorCsvDownloaded({
                  fileType: job.file_type,
                  invalidRows: job.invalid_rows,
                  totalRows: job.total_rows,
                })
              }
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Tải file lỗi
            </a>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["", "Tất cả"],
            ["valid", "Hợp lệ"],
            ["invalid", "Có lỗi"],
            ["duplicate", "Có thể trùng"],
          ].map(([status, label]) => (
            <Link
              className={[
                "inline-flex min-h-10 items-center rounded-lg px-4 py-2 text-sm font-bold",
                (rowStatus ?? "") === status
                  ? "bg-ink text-white"
                  : "border border-slate-200 bg-white text-ink",
              ].join(" ")}
              href={status ? `/app/import/${job.id}?status=${status}` : `/app/import/${job.id}`}
              key={status || "all"}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {rows.items.length === 0 ? (
            <div className="rounded-lg bg-cloud p-5 text-base leading-7 text-slate-600">
              Chưa có dòng nào để hiển thị.
            </div>
          ) : (
            rows.items.map((row) => (
              <article className="rounded-lg border border-slate-200 bg-cloud p-4" key={row.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-ink">Dòng {row.row_index}</p>
                    <p className="mt-1 max-w-3xl truncate text-sm leading-6 text-slate-600">
                      {rawPreview(row.raw_data)}
                    </p>
                    {row.status === "invalid" || row.status === "failed" ? (
                      <p className="mt-2 text-sm font-semibold leading-6 text-rose-700">
                        {errorMessages(row.validation_errors)}
                      </p>
                    ) : null}
                    {row.status === "duplicate" ? (
                      <p className="mt-2 text-sm font-semibold leading-6 text-amber-700">
                        Có khả năng trùng với lead {row.duplicate_lead_id}. Lý do:{" "}
                        {String(row.mapped_data?.duplicateReason ?? "duplicate")}
                      </p>
                    ) : null}
                  </div>
                  <span className="inline-flex min-h-7 shrink-0 items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                    {row.status}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">Bước 4</p>
        <h2 className="mt-2 text-xl font-bold text-ink">Import</h2>

        {isCompleted ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
            <div className="flex gap-2">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Import hoàn tất. Bạn có thể bắt đầu ghi chú và đặt follow-up cho các lead vừa
                import.
              </span>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Bạn sắp import {formatNumber(job.valid_rows + job.duplicate_rows)} lead hợp lệ.
              Các dòng lỗi sẽ bị bỏ qua.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {DUPLICATE_STRATEGIES.map((strategy) => (
                <label
                  className={[
                    "rounded-lg border p-4",
                    duplicateStrategy === strategy.key
                      ? "border-ocean bg-ocean/5"
                      : "border-slate-200 bg-white",
                  ].join(" ")}
                  key={strategy.key}
                >
                  <input
                    checked={duplicateStrategy === strategy.key}
                    className="h-4 w-4 accent-ocean"
                    name="duplicateStrategy"
                    onChange={() => setDuplicateStrategy(strategy.key)}
                    type="radio"
                  />
                  <span className="ml-2 text-sm font-bold text-ink">{strategy.label}</span>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{strategy.description}</p>
                </label>
              ))}
            </div>
            <button
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              disabled={!canExecute || isImporting}
              onClick={executeImport}
              type="button"
            >
              <Play aria-hidden="true" className="h-5 w-5" />
              {isImporting ? "Đang import..." : "Bắt đầu import"}
            </button>
            {!canExecute ? (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                Vui lòng kiểm tra dữ liệu trước khi import.
              </p>
            ) : null}
          </>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ["Đã tạo mới", job.imported_rows],
            ["Đã cập nhật", job.updated_rows],
            ["Đã bỏ qua", job.skipped_rows],
            ["Thất bại", job.failed_rows],
          ].map(([label, value]) => (
            <div className="rounded-lg bg-cloud px-4 py-3" key={label}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold text-ink">{formatNumber(Number(value))}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-5 py-3 text-base font-bold text-white hover:bg-ocean"
            href="/app/leads"
          >
            Xem danh sách lead
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink hover:border-ocean"
            href="/app/import"
          >
            Import file khác
          </Link>
        </div>
      </section>
    </div>
  );
}
