"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type SwitchProps = {
  checked: boolean;
  description?: ReactNode;
  label: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-checked" | "onChange" | "onClick" | "role" | "type">;

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Switch({
  checked,
  className,
  description,
  disabled,
  label,
  onCheckedChange,
  ...props
}: SwitchProps) {
  return (
    <button
      {...props}
      aria-checked={checked}
      className={joinClasses(
        "flex min-h-11 w-full items-center justify-between gap-4 rounded-control border border-border-soft bg-surface px-3 py-2.5 text-left transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      role="switch"
      type="button"
    >
      <span>
        <span className="block text-sm font-bold text-text-primary">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm leading-6 text-text-secondary">
            {description}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={joinClasses(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-primary" : "bg-border-strong",
        )}
      >
        <span
          className={joinClasses(
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}
