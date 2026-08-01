import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ImportRowsResult, ImportRowRecord } from "@/lib/data/import-rows";

type ImportPreviewProps = {
  headers: string[];
  jobId?: string;
  rowStatus?: string;
  rows?: ImportRowsResult;
  sampleRows?: Array<Record<string, string>>;
  title?: string;
};

const rowStatusLabels: Record<string, string> = {
  duplicate: "Có thể trùng",
  failed: "Thất bại",
  imported: "Đã tạo",
  invalid: "Có lỗi",
  pending: "Chưa kiểm tra",
  skipped: "Đã bỏ qua",
  updated: "Đã cập nhật",
  valid: "Hợp lệ",
};

const rowStatusTones: Record<
  string,
  "danger" | "neutral" | "primary" | "success" | "warning"
> = {
  duplicate: "warning",
  failed: "danger",
  imported: "success",
  invalid: "danger",
  pending: "neutral",
  skipped: "neutral",
  updated: "success",
  valid: "success",
};

const duplicateReasonLabels: Record<string, string> = {
  email: "email",
  name_address: "tên và địa chỉ",
  phone: "số điện thoại",
  website: "website",
};

function truncate(value: string, max = 80) {
  const clean = value.trim();
  if (!clean) return "-";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}...`;
}

function rowPreview(rawData: Record<string, string>, headers: string[]) {
  return headers
    .slice(0, 4)
    .map((header) => `${header}: ${truncate(String(rawData[header] ?? ""), 42)}`)
    .join(" | ");
}

function errorMessages(errors: ImportRowRecord["validation_errors"]) {
  return errors?.map((error) => error.message).filter(Boolean).join("; ") || "";
}

function duplicateMessage(row: ImportRowRecord) {
  const reason = String(row.mapped_data?.duplicateReason ?? "");
  const reasonLabel = duplicateReasonLabels[reason] ?? "tiêu chí trùng";
  return `Có khả năng trùng với lead hiện có theo ${reasonLabel}.`;
}

function statusLabel(status?: string) {
  return rowStatusLabels[status ?? "pending"] ?? status ?? "Chưa kiểm tra";
}

function statusTone(status?: string) {
  return rowStatusTones[status ?? "pending"] ?? "neutral";
}

function SampleMobileCard({
  headers,
  row,
  rowNumber,
}: {
  headers: string[];
  row: Record<string, string>;
  rowNumber: number;
}) {
  return (
    <article className="rounded-control border border-border-soft bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-bold text-text-primary">Dòng mẫu {rowNumber}</p>
        <Badge tone="neutral">Chưa kiểm tra</Badge>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        {headers.slice(0, 6).map((header) => (
          <div className="grid grid-cols-[110px_1fr] gap-2" key={header}>
            <dt className="font-bold text-text-muted">{header}</dt>
            <dd className="min-w-0 break-words text-text-secondary">
              {truncate(String(row[header] ?? ""), 54)}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function RowMobileCard({ headers, row }: { headers: string[]; row: ImportRowRecord }) {
  const hasError = row.status === "invalid" || row.status === "failed";

  return (
    <article className="rounded-control border border-border-soft bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-bold text-text-primary">Dòng {row.row_index}</p>
        <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
      </div>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        {rowPreview(row.raw_data, headers)}
      </p>
      {hasError ? (
        <p className="mt-2 text-sm font-semibold leading-6 text-danger">
          {errorMessages(row.validation_errors) || "Không thể import dòng này."}
        </p>
      ) : null}
      {row.status === "duplicate" ? (
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-800">
          {duplicateMessage(row)}
        </p>
      ) : null}
    </article>
  );
}

function FilterLinks({ jobId, rowStatus }: { jobId: string; rowStatus?: string }) {
  const filters = [
    ["", "Tất cả"],
    ["valid", "Hợp lệ"],
    ["invalid", "Lỗi"],
    ["duplicate", "Trùng"],
    ["failed", "Thất bại"],
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Lọc dòng import">
      {filters.map(([status, label]) => (
        <Link
          aria-current={(rowStatus ?? "") === status ? "page" : undefined}
          className={[
            "inline-flex min-h-10 shrink-0 items-center rounded-control px-4 py-2 text-sm font-bold transition",
            (rowStatus ?? "") === status
              ? "bg-primary text-white shadow-sm"
              : "border border-border-soft bg-surface text-text-primary hover:border-primary/40 hover:text-primary",
          ].join(" ")}
          href={status ? `/app/import/${jobId}?status=${status}` : `/app/import/${jobId}`}
          key={status || "all"}
          role="listitem"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function ImportPreview({
  headers,
  jobId,
  rowStatus,
  rows,
  sampleRows,
  title = "Xem trước dữ liệu",
}: ImportPreviewProps) {
  const validationRows = rows?.items ?? [];
  const previewRows = sampleRows ?? [];
  const hasValidationRows = Boolean(rows);
  const hasRows = hasValidationRows ? validationRows.length > 0 : previewRows.length > 0;

  return (
    <section
      className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6"
      id="import-review"
    >
      <SectionHeader
        actions={jobId ? <FilterLinks jobId={jobId} rowStatus={rowStatus} /> : null}
        description={
          hasValidationRows
            ? "Danh sách này chỉ hiển thị tối đa 50 dòng theo bộ lọc hiện tại."
            : "SaleMap chỉ hiển thị tối đa 20 dòng mẫu từ file để bạn kiểm tra cấu trúc."
        }
        eyebrow={hasValidationRows ? "Bước 3" : "Bước 1"}
        title={title}
      />

      {!hasRows ? (
        <div className="mt-5 rounded-control border border-dashed border-border-strong bg-surface-muted p-5 text-base leading-7 text-text-secondary">
          Chưa có dòng nào để hiển thị.
        </div>
      ) : hasValidationRows ? (
        <>
          <div className="mt-5 grid gap-3 md:hidden">
            {validationRows.map((row) => (
              <RowMobileCard headers={headers} key={row.id} row={row} />
            ))}
          </div>

          <div className="mt-5 hidden max-h-[560px] overflow-auto rounded-control border border-border-soft md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-surface-muted text-xs uppercase tracking-[0.12em] text-text-muted">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Dòng</th>
                  {headers.slice(0, 8).map((header) => (
                    <th className="whitespace-nowrap px-4 py-3" key={header}>
                      {header}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-4 py-3">Trạng thái</th>
                  <th className="min-w-[220px] px-4 py-3">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {validationRows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-text-primary">
                      {row.row_index}
                    </td>
                    {headers.slice(0, 8).map((header) => (
                      <td className="max-w-[220px] truncate px-4 py-3 text-text-secondary" key={header}>
                        {truncate(String(row.raw_data[header] ?? ""), 60)}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {row.status === "duplicate"
                        ? duplicateMessage(row)
                        : row.status === "invalid" || row.status === "failed"
                          ? errorMessages(row.validation_errors) || "Không thể import dòng này."
                          : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="mt-5 grid gap-3 md:hidden">
            {previewRows.map((row, index) => (
              <SampleMobileCard
                headers={headers}
                key={index}
                row={row}
                rowNumber={index + 1}
              />
            ))}
          </div>

          <div className="mt-5 hidden max-h-[420px] overflow-auto rounded-control border border-border-soft md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-surface-muted text-xs uppercase tracking-[0.12em] text-text-muted">
                <tr>
                  {headers.map((header) => (
                    <th className="whitespace-nowrap px-4 py-3" key={header}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {previewRows.map((row, index) => (
                  <tr key={index}>
                    {headers.map((header) => (
                      <td className="max-w-xs truncate px-4 py-3 text-text-secondary" key={header}>
                        {truncate(String(row[header] ?? ""), 72)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
