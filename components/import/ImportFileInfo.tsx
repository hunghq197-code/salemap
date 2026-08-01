import { FileSpreadsheet, ShieldCheck, X } from "lucide-react";

type ImportFileInfoProps = {
  file: File;
  maxRows: number;
  onClear: () => void;
};

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value)} ${units[exponent]}`;
}

function getFileKind(fileName: string) {
  return fileName.toLowerCase().endsWith(".xlsx") ? "Excel XLSX" : "CSV";
}

export function ImportFileInfo({ file, maxRows, onClear }: ImportFileInfoProps) {
  return (
    <div className="rounded-control border border-primary/25 bg-primary-soft p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface text-primary">
          <FileSpreadsheet aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-text-primary">{file.name}</p>
          <dl className="mt-2 grid gap-2 text-sm text-text-secondary sm:grid-cols-3">
            <div>
              <dt className="font-bold text-text-muted">Dung lượng</dt>
              <dd className="mt-0.5 font-semibold">{formatBytes(file.size)}</dd>
            </div>
            <div>
              <dt className="font-bold text-text-muted">Loại file</dt>
              <dd className="mt-0.5 font-semibold">{getFileKind(file.name)}</dd>
            </div>
            <div>
              <dt className="font-bold text-text-muted">Giới hạn dòng</dt>
              <dd className="mt-0.5 font-semibold">
                {new Intl.NumberFormat("vi-VN").format(maxRows)} dòng/file
              </dd>
            </div>
          </dl>
          <p className="mt-3 inline-flex items-start gap-2 text-sm font-semibold leading-6 text-primary">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            SaleMap chỉ tạo lead sau khi bạn xem trước, ánh xạ và xác nhận.
          </p>
        </div>
        <button
          aria-label="Chọn file khác"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border-soft bg-surface text-text-secondary transition hover:border-primary/40 hover:text-primary"
          onClick={onClear}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
