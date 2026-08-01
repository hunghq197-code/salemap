"use client";

import { Download, FileUp, UploadCloud, WifiOff } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { ImportFileInfo } from "@/components/import/ImportFileInfo";
import {
  trackImportFileSelected,
  trackImportFileUploadCompleted,
  trackImportFileUploadFailed,
  trackImportFileUploadStarted,
} from "@/lib/analytics/client";

type ImportDropzoneProps = {
  disabledReason?: string | null;
  maxFileSizeBytes: number;
  maxRows: number;
  sampleHref?: string;
};

type UploadResponse = {
  data?: {
    jobId: string;
    totalRows: number;
  };
  message?: string;
  success: boolean;
};

const allowedMimeTypes = new Set([
  "",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
]);

function getFileType(fileName: string) {
  return fileName.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv";
}

function formatBytes(bytes: number) {
  const value = bytes / (1024 * 1024);
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}MB`;
}

function getFileValidationError(file: File, maxFileSizeBytes: number) {
  const lowerName = file.name.toLowerCase();

  if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".xlsx")) {
    return "Định dạng file chưa được hỗ trợ.";
  }

  if (!allowedMimeTypes.has(file.type)) {
    return "Định dạng file chưa được hỗ trợ.";
  }

  if (file.size <= 0) {
    return "Không thể đọc dữ liệu trong file.";
  }

  if (file.size > maxFileSizeBytes) {
    return "File vượt quá dung lượng cho phép.";
  }

  return null;
}

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

export function ImportDropzone({
  disabledReason,
  maxFileSizeBytes,
  maxRows,
  sampleHref = "/sample-import-leads.csv",
}: ImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );
  const [isUploading, setIsUploading] = useState(false);
  const disabled = Boolean(disabledReason) || !isOnline || isUploading;

  function selectFile(nextFile?: File | null) {
    if (!nextFile) {
      setFile(null);
      return;
    }

    const validationError = getFileValidationError(nextFile, maxFileSizeBytes);
    setError(validationError);
    setFile(validationError ? null : nextFile);

    if (!validationError) {
      trackImportFileSelected({ fileType: getFileType(nextFile.name) });
    }
  }

  async function uploadFile() {
    if (!file) {
      setError("Vui lòng chọn file CSV hoặc Excel.");
      return;
    }

    if (!isOnline) {
      setError("Bạn đang ngoại tuyến. Vui lòng kết nối Internet để nhập dữ liệu.");
      return;
    }

    const validationError = getFileValidationError(file, maxFileSizeBytes);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    trackImportFileUploadStarted({ fileType: getFileType(file.name) });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import/leads/upload", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as UploadResponse;

      if (!response.ok || !payload.success || !payload.data?.jobId) {
        throw new Error(payload.message || "Không thể đọc dữ liệu trong file.");
      }

      trackImportFileUploadCompleted({
        fileType: getFileType(file.name),
        totalRows: payload.data.totalRows,
      });
      window.location.assign(`/app/import/${payload.data.jobId}`);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Không thể đọc dữ liệu trong file.";

      setError(message);
      trackImportFileUploadFailed({ fileType: getFileType(file.name) });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
            Bước 1
          </p>
          <h2 className="mt-2 text-xl font-bold text-text-primary">Chọn file khách hàng</h2>
          <p className="mt-2 text-base leading-7 text-text-secondary">
            Hỗ trợ file CSV hoặc Excel theo định dạng SaleMap đang cho phép.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary"
          download
          href={sampleHref}
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Tải file mẫu
        </Link>
      </div>

      {!isOnline ? (
        <div className="mt-4 flex gap-3 rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          <WifiOff aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          Bạn đang ngoại tuyến. Vui lòng kết nối Internet để nhập dữ liệu.
        </div>
      ) : null}

      {disabledReason ? (
        <div className="mt-4 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-semibold leading-6 text-danger">
          {disabledReason}
        </div>
      ) : null}

      <div
        className={[
          "mt-5 rounded-card border border-dashed px-4 py-8 text-center transition sm:px-6",
          isDragging ? "border-primary bg-primary-soft" : "border-border-strong bg-surface-muted",
          disabled ? "opacity-70" : "hover:border-primary/60",
        ].join(" ")}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) selectFile(event.dataTransfer.files.item(0));
        }}
      >
        <FileUp aria-hidden="true" className="mx-auto h-9 w-9 text-primary" />
        <p className="mt-3 text-lg font-bold text-text-primary">
          Kéo thả file vào đây hoặc chọn từ máy
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          Bạn sẽ được xem trước và kiểm tra dữ liệu trước khi hệ thống tạo lead.
          Hỗ trợ `.csv`, `.xlsx`, tối đa {formatBytes(maxFileSizeBytes)} và{" "}
          {new Intl.NumberFormat("vi-VN").format(maxRows)} dòng mỗi file.
        </p>
        <button
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <FileUp aria-hidden="true" className="h-4 w-4" />
          Chọn file
        </button>
        <input
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => selectFile(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />
      </div>

      {file ? (
        <div className="mt-4">
          <ImportFileInfo
            file={file}
            maxRows={maxRows}
            onClear={() => {
              setFile(null);
              setError(null);
              if (inputRef.current) {
                inputRef.current.value = "";
              }
            }}
          />
        </div>
      ) : null}

      {error ? (
        <div
          className="mt-4 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-semibold leading-6 text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-border-soft pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-text-secondary">
          Client kiểm tra nhanh để giúp bạn sửa sớm. Server vẫn là nguồn quyết định khi nhận file.
        </p>
        <button
          aria-busy={isUploading || undefined}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-success px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={disabled || !file}
          onClick={uploadFile}
          type="button"
        >
          <UploadCloud aria-hidden="true" className="h-5 w-5" />
          {isUploading ? "Đang đọc file..." : "Tải lên và xem trước"}
        </button>
      </div>
    </section>
  );
}
