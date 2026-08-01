import { CheckCircle2, CircleDot, Circle } from "lucide-react";

export type ImportStepKey = "confirm" | "done" | "mapping" | "review" | "upload";

type ImportStepperProps = {
  activeStep: ImportStepKey;
  className?: string;
};

const steps: Array<{ key: ImportStepKey; label: string; shortLabel: string }> = [
  { key: "upload", label: "Tải file", shortLabel: "File" },
  { key: "mapping", label: "Ánh xạ dữ liệu", shortLabel: "Mapping" },
  { key: "review", label: "Kiểm tra", shortLabel: "Kiểm tra" },
  { key: "confirm", label: "Xác nhận", shortLabel: "Xác nhận" },
  { key: "done", label: "Hoàn tất", shortLabel: "Xong" },
];

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ImportStepper({ activeStep, className }: ImportStepperProps) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === activeStep),
  );

  return (
    <nav aria-label="Các bước nhập dữ liệu" className={className}>
      <ol className="grid gap-2 sm:grid-cols-5">
        {steps.map((step, index) => {
          const completed = index < activeIndex;
          const active = index === activeIndex;
          const Icon = completed ? CheckCircle2 : active ? CircleDot : Circle;

          return (
            <li
              aria-current={active ? "step" : undefined}
              className={joinClasses(
                "flex min-h-14 items-center gap-3 rounded-control border px-3 py-2 text-sm",
                completed && "border-success/30 bg-success-soft text-emerald-800",
                active && "border-primary/35 bg-primary-soft text-primary",
                !completed && !active && "border-border-soft bg-surface text-text-secondary",
              )}
              key={step.key}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-[0.12em]">
                  Bước {index + 1}
                </span>
                <span className="block truncate font-bold sm:hidden">{step.shortLabel}</span>
                <span className="hidden font-bold sm:block">{step.label}</span>
                <span className="sr-only">
                  {completed ? "đã hoàn tất" : active ? "đang thực hiện" : "chưa tới"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
