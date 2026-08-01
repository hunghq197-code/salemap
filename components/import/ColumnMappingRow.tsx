import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { ImportableLeadFieldKey } from "@/lib/constants/import";
import { IMPORTABLE_LEAD_FIELDS } from "@/lib/constants/import";
import type { FieldMapping } from "@/lib/import/field-mapping";
import { normalizeHeader } from "@/lib/import/field-mapping";

type ColumnMappingRowProps = {
  fieldMapping: FieldMapping;
  header: string;
  onChange: (header: string, value: ImportableLeadFieldKey | null) => void;
  sampleRows: Array<Record<string, string>>;
};

function hasSampleValue(header: string, sampleRows: Array<Record<string, string>>) {
  return sampleRows.some((row) => String(row[header] ?? "").trim().length > 0);
}

function truncate(value: string, max = 34) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

function maskSampleValue(value: string, field?: ImportableLeadFieldKey | null) {
  const clean = value.trim();

  if (!clean) return "-";

  if (field === "email") {
    const [name, domain] = clean.split("@");
    if (!domain) return "***";
    return `${name.slice(0, 1)}***@${domain}`;
  }

  if (field === "phone") {
    const digits = clean.replace(/\D/g, "");
    return digits.length >= 4 ? `***${digits.slice(-4)}` : "***";
  }

  if (field === "address" || field === "initial_note") {
    return truncate(clean, 28);
  }

  return truncate(clean);
}

function sampleValues(
  header: string,
  sampleRows: Array<Record<string, string>>,
  field?: ImportableLeadFieldKey | null,
) {
  const values = Array.from(
    new Set(sampleRows.map((row) => String(row[header] ?? "").trim()).filter(Boolean)),
  )
    .slice(0, 3)
    .map((value) => maskSampleValue(value, field));

  return values.length > 0 ? values : ["-"];
}

function getStatus(field: ImportableLeadFieldKey | null | undefined, hasValue: boolean) {
  if (field) {
    return {
      className: "border-success/25 bg-success-soft text-emerald-800",
      icon: CheckCircle2,
      label: "Đã map",
    };
  }

  if (hasValue) {
    return {
      className: "border-warning/25 bg-warning-soft text-amber-800",
      icon: AlertTriangle,
      label: "Bỏ qua dữ liệu",
    };
  }

  return {
    className: "border-border-soft bg-surface-muted text-text-secondary",
    icon: CircleDashed,
    label: "Không có dữ liệu",
  };
}

export function ColumnMappingRow({
  fieldMapping,
  header,
  onChange,
  sampleRows,
}: ColumnMappingRowProps) {
  const mappedField = fieldMapping[header] ?? null;
  const usedFields = new Set(
    Object.entries(fieldMapping)
      .filter(([currentHeader, field]) => currentHeader !== header && field)
      .map(([, field]) => field),
  );
  const hasValue = hasSampleValue(header, sampleRows);
  const status = getStatus(mappedField, hasValue);
  const StatusIcon = status.icon;
  const sample = sampleValues(header, sampleRows, mappedField);
  const normalizedHeader = normalizeHeader(header);

  return (
    <div className="grid gap-3 rounded-control border border-border-soft bg-surface p-4 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.8fr)_minmax(220px,0.9fr)_150px] md:items-center">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
          Cột trong file
        </p>
        <p className="mt-1 break-words text-base font-bold text-text-primary">{header}</p>
        {normalizedHeader !== header.toLowerCase() ? (
          <p className="mt-1 text-xs font-semibold text-text-muted">{normalizedHeader}</p>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
          Giá trị mẫu
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sample.map((value, index) => (
            <span
              className="max-w-full truncate rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-text-secondary"
              key={`${value}-${index}`}
            >
              {value}
            </span>
          ))}
        </div>
      </div>
      <Select
        label="Trường SaleMap"
        onChange={(event) =>
          onChange(
            header,
            event.target.value ? (event.target.value as ImportableLeadFieldKey) : null,
          )
        }
        value={mappedField ?? ""}
      >
        <option value="">Bỏ qua cột này</option>
        {IMPORTABLE_LEAD_FIELDS.map((field) => (
          <option
            disabled={usedFields.has(field.key)}
            key={field.key}
            value={field.key}
          >
            {field.label}
          </option>
        ))}
      </Select>
      <span
        className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
      >
        <StatusIcon aria-hidden="true" className="h-4 w-4" />
        {status.label}
      </span>
    </div>
  );
}
