"use client";

import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  trackImportFileSelected,
  trackImportFileUploadCompleted,
  trackImportFileUploadFailed,
  trackImportFileUploadStarted,
} from "@/lib/analytics/client";

type UploadResponse = {
  data?: {
    jobId: string;
    totalRows: number;
  };
  message?: string;
  success: boolean;
};

function getFileType(fileName: string) {
  return fileName.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv";
}

export function ImportUploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(formData: FormData) {
    const file = formData.get("file");

    if (!(file instanceof File) || !file.name) {
      setError("Vui lòng chọn file CSV hoặc XLSX.");
      return;
    }

    setError(null);
    setIsUploading(true);
    trackImportFileUploadStarted({ fileType: getFileType(file.name) });

    try {
      const response = await fetch("/api/import/leads/upload", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as UploadResponse;

      if (!response.ok || !payload.success || !payload.data?.jobId) {
        throw new Error(payload.message || "Không thể đọc file này. Vui lòng thử lại.");
      }

      trackImportFileUploadCompleted({
        fileType: getFileType(file.name),
        totalRows: payload.data.totalRows,
      });
      router.push(`/app/import/${payload.data.jobId}`);
      router.refresh();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Không thể đọc file này. Vui lòng kiểm tra định dạng CSV/XLSX và thử lại.";

      setError(message);
      trackImportFileUploadFailed({ fileType: getFileType(file.name) });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form action={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <label className="block">
        <span className="text-sm font-bold text-ink">Upload file</span>
        <span className="mt-2 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-cloud px-4 py-6 text-center transition hover:border-ocean">
          <FileSpreadsheet aria-hidden="true" className="h-8 w-8 text-ocean" />
          <span className="mt-3 text-base font-bold text-ink">
            {fileName || "Chọn file CSV/XLSX"}
          </span>
          <span className="mt-1 text-sm leading-6 text-slate-500">
            Hỗ trợ file .csv và .xlsx. Dòng đầu tiên nên là tên cột.
          </span>
        </span>
        <input
          accept=".csv,.xlsx"
          className="sr-only"
          name="file"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];
            setFileName(selectedFile?.name ?? null);

            if (selectedFile?.name) {
              trackImportFileSelected({ fileType: getFileType(selectedFile.name) });
            }
          }}
          required
          type="file"
        />
      </label>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        disabled={isUploading}
        type="submit"
      >
        <UploadCloud aria-hidden="true" className="h-5 w-5" />
        {isUploading ? "Đang đọc file..." : "Chọn file CSV/XLSX"}
      </button>
    </form>
  );
}
