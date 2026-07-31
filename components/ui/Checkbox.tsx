import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxProps = {
  description?: ReactNode;
  label: ReactNode;
  wrapperClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Checkbox({
  className,
  description,
  label,
  wrapperClassName,
  ...props
}: CheckboxProps) {
  return (
    <label
      className={joinClasses(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-control border border-border-soft bg-surface px-3 py-2.5 text-sm transition hover:border-primary/40",
        wrapperClassName,
      )}
    >
      <input
        className={joinClasses(
          "mt-1 h-4 w-4 rounded border-border-strong text-primary focus:ring-2 focus:ring-primary/20",
          className,
        )}
        type="checkbox"
        {...props}
      />
      <span>
        <span className="font-bold text-text-primary">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm leading-6 text-text-secondary">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
