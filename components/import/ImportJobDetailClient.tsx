"use client";

import { AlertTriangle, Download, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ColumnMapping } from "@/components/import/ColumnMapping";
import { ImportConfirmation } from "@/components/import/ImportConfirmation";
import { statusLabel, statusTone } from "@/components/import/ImportHistoryItem";
import { ImportPreview } from "@/components/import/ImportPreview";
import { ImportProgress } from "@/components/import/ImportProgress";
import { ImportResult } from "@/components/import/ImportResult";
import { ImportStepper, type ImportStepKey } from "@/components/import/ImportStepper";
import { ImportValidationSummary } from "@/components/import/ImportValidationSummary";
import { Badge } from "@/components/ui/Badge";
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

function activeStepForStatus(status: ImportJobRecord["status"]): ImportStepKey {
  if (status === "completed" || status === "failed" || status === "cancelled" || status === "importing") {
    return "done";
  }

  if (status === "validated") {
    return "confirm";
  }

  return "mapping";
}

function getHeaders(job: ImportJobRecord, rows: ImportRowsResult) {
  return Object.keys(job.sample_rows?.[0] ?? rows.items[0]?.raw_data ?? {});
}

export function ImportJobDetailClient({
  job,
  rows,
  rowStatus,
}: ImportJobDetailClientProps) {
  const router = useRouter();
  const headers = useMemo(() => getHeaders(job, rows), [job, rows]);
  const sampleRows = useMemo(
    () => job.sample_rows ?? rows.items.slice(0, 20).map((row) => row.raw_data),
    [job.sample_rows, rows.items],
  );
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>(
    (job.field_mapping ?? {}) as FieldMapping,
  );
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>(
    (job.duplicate_strategy as DuplicateStrategy | null) ?? "skip",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"danger" | "neutral" | "success" | "warning">(
    "neutral",
  );
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
  const isTerminal =
    job.status === "completed" || job.status === "failed" || job.status === "cancelled";

  function showMessage(nextMessage: string, tone: typeof messageTone = "neutral") {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

  function updateFieldMapping(header: string, value: ImportableLeadFieldKey | null) {
    setFieldMapping((current) => {
      const next = { ...current, [header]: value };

      if (value) {
        Object.keys(next).forEach((currentHeader) => {
          if (currentHeader !== header && next[currentHeader] === value) {
            next[currentHeader] = null;
          }
        });
      }

      return next;
    });
  }

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
      showMessage("Đã lưu mapping.", "success");
      router.refresh();
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Không thể lưu mapping lúc này.",
        "danger",
      );
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
      showMessage("Đã kiểm tra dữ liệu. Vui lòng xem lại tổng quan trước khi xác nhận.", "success");
      router.refresh();
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Không thể kiểm tra dữ liệu lúc này.",
        "danger",
      );
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
      showMessage("Server đã hoàn tất job import.", "success");
      router.refresh();
    } catch (error) {
      trackImportExecuteFailed({ duplicateStrategy, fileType: job.file_type });
      showMessage(error instanceof Error ? error.message : "Không thể import lúc này.", "danger");
    } finally {
      setIsImporting(false);
    }
  }

  function trackErrorDownload() {
    trackImportErrorCsvDownloaded({
      fileType: job.file_type,
      invalidRows: job.invalid_rows + job.failed_rows,
      totalRows: job.total_rows,
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Import job
            </p>
            <h1 className="mt-2 flex items-start gap-3 text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
              <FileSpreadsheet aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <span className="min-w-0 break-words">{job.file_name}</span>
            </h1>
            <p className="mt-3 text-base leading-7 text-text-secondary">
              {job.file_type.toUpperCase()} · {formatNumber(job.total_rows)} dòng · upload{" "}
              {formatDate(job.created_at)}
            </p>
          </div>
          <Badge tone={statusTone(job.status)}>{statusLabel(job.status)}</Badge>
        </div>
        <ImportStepper activeStep={activeStepForStatus(job.status)} className="mt-5" />
      </section>

      {message ? (
        <div
          className={[
            "rounded-control border px-4 py-3 text-sm font-semibold leading-6",
            messageTone === "danger" && "border-danger/20 bg-danger-soft text-danger",
            messageTone === "success" && "border-success/20 bg-success-soft text-emerald-800",
            messageTone === "warning" && "border-warning/25 bg-warning-soft text-amber-800",
            messageTone === "neutral" && "border-border-soft bg-surface-muted text-text-secondary",
          ]
            .filter(Boolean)
            .join(" ")}
          role={messageTone === "danger" ? "alert" : "status"}
        >
          {message}
        </div>
      ) : null}

      <ImportPreview headers={headers} sampleRows={sampleRows} title="Preview file" />

      {!isTerminal ? (
        <ColumnMapping
          fieldMapping={fieldMapping}
          hasContactMapping={hasContactMapping}
          headers={headers}
          isSavingMapping={isSavingMapping}
          isValidating={isValidating}
          onFieldChange={updateFieldMapping}
          onSaveMapping={saveMapping}
          onValidateRows={validateRows}
          sampleRows={sampleRows}
        />
      ) : null}

      <ImportValidationSummary
        duplicateRows={job.duplicate_rows}
        invalidRows={job.invalid_rows}
        totalRows={job.total_rows}
        validRows={job.valid_rows}
      />

      {job.invalid_rows > 0 ? (
        <div className="flex flex-col gap-3 rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex gap-2">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            Dòng lỗi sẽ không được import. Bạn có thể tải CSV lỗi để sửa và import lại.
          </span>
          <a
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-surface px-4 py-2 text-sm font-bold text-text-primary shadow-sm transition hover:text-primary"
            href={`/api/import/leads/${job.id}/error-csv`}
            onClick={trackErrorDownload}
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Tải file lỗi
          </a>
        </div>
      ) : null}

      <ImportPreview
        headers={headers}
        jobId={job.id}
        rowStatus={rowStatus}
        rows={rows}
        title="Dòng dữ liệu sau kiểm tra"
      />

      {!isTerminal ? (
        <ImportConfirmation
          canExecute={canExecute}
          duplicateStrategy={duplicateStrategy}
          fieldMapping={fieldMapping}
          isImporting={isImporting}
          job={job}
          onDuplicateStrategyChange={setDuplicateStrategy}
          onExecuteImport={executeImport}
        />
      ) : null}

      <ImportProgress job={job} />

      {isTerminal ? (
        <ImportResult job={job} onErrorCsvDownloaded={trackErrorDownload} />
      ) : null}
    </div>
  );
}
