import { AlertTriangle, CheckCircle2, CircleAlert, CopyCheck, Rows3 } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

type ImportValidationSummaryProps = {
  duplicateRows: number;
  invalidRows: number;
  totalRows: number;
  validRows: number;
  warningRows?: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function ImportValidationSummary({
  duplicateRows,
  invalidRows,
  totalRows,
  validRows,
  warningRows = 0,
}: ImportValidationSummaryProps) {
  const expectedRows = validRows + duplicateRows;
  const stats = [
    {
      icon: Rows3,
      label: "Tổng dòng",
      tone: "bg-surface-muted text-text-secondary",
      value: totalRows,
    },
    {
      icon: CheckCircle2,
      label: "Hợp lệ",
      tone: "bg-success-soft text-emerald-700",
      value: validRows,
    },
    {
      icon: AlertTriangle,
      label: "Cảnh báo",
      tone: "bg-warning-soft text-amber-700",
      value: warningRows,
    },
    {
      icon: CircleAlert,
      label: "Có lỗi",
      tone: "bg-danger-soft text-danger",
      value: invalidRows,
    },
    {
      icon: CopyCheck,
      label: "Có thể trùng",
      tone: "bg-warning-soft text-amber-700",
      value: duplicateRows,
    },
  ];

  return (
    <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6">
      <SectionHeader
        description={`File có ${formatNumber(totalRows)} dòng: ${formatNumber(
          validRows,
        )} dòng hợp lệ, ${formatNumber(duplicateRows)} dòng có thể trùng và ${formatNumber(
          invalidRows,
        )} dòng lỗi.`}
        eyebrow="Kết quả kiểm tra"
        title="Tổng quan dữ liệu"
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="rounded-control border border-border-soft bg-surface-muted p-4" key={stat.label}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-text-secondary">{stat.label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-control ${stat.tone}`}>
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-text-primary">
                {formatNumber(stat.value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-control border border-primary/20 bg-primary-soft px-4 py-3 text-sm font-semibold leading-6 text-primary">
        Số dòng có thể xử lý sau khi xác nhận: {formatNumber(expectedRows)}. Dòng lỗi sẽ bị bỏ qua.
      </div>
    </section>
  );
}
