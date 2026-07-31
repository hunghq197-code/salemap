import type { ReactNode } from "react";

type FilterBarProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FilterBar({ actions, children, className }: FilterBarProps) {
  return (
    <div
      className={joinClasses(
        "rounded-card border border-border-soft bg-surface p-3 shadow-card sm:p-4",
        className,
      )}
    >
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
        {actions ? <div className="flex flex-wrap gap-2 md:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}
