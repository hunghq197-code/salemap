import type { ReactNode } from "react";
import { ChartErrorState } from "@/components/analytics/ChartErrorState";

type ChartContainerProps = {
  children: ReactNode;
  description?: ReactNode;
  error?: boolean;
  title: ReactNode;
};

export function ChartContainer({
  children,
  description,
  error = false,
  title,
}: ChartContainerProps) {
  return (
    <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight text-text-primary sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">{error ? <ChartErrorState /> : children}</div>
    </section>
  );
}
