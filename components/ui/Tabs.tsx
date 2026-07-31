import Link from "next/link";
import type { ReactNode } from "react";

type TabItem = {
  active?: boolean;
  disabled?: boolean;
  href?: string;
  label: ReactNode;
  onClick?: () => void;
  value: string;
};

type TabsProps = {
  ariaLabel: string;
  className?: string;
  items: TabItem[];
};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function tabClasses(active?: boolean, disabled?: boolean) {
  return joinClasses(
    "inline-flex min-h-10 items-center justify-center rounded-control px-4 py-2 text-sm font-bold transition",
    active
      ? "bg-primary text-white shadow-sm"
      : "text-text-secondary hover:bg-primary-soft hover:text-primary",
    disabled && "pointer-events-none opacity-50",
  );
}

export function Tabs({ ariaLabel, className, items }: TabsProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={joinClasses(
        "flex gap-1 overflow-x-auto rounded-card border border-border-soft bg-surface p-1",
        className,
      )}
      role="tablist"
    >
      {items.map((item) =>
        item.href ? (
          <Link
            aria-current={item.active ? "page" : undefined}
            className={tabClasses(item.active, item.disabled)}
            href={item.href}
            key={item.value}
            role="tab"
          >
            {item.label}
          </Link>
        ) : (
          <button
            aria-selected={item.active}
            className={tabClasses(item.active, item.disabled)}
            disabled={item.disabled}
            key={item.value}
            onClick={item.onClick}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
