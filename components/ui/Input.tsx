import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = {
  error?: ReactNode;
  label?: ReactNode;
  wrapperClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>;

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Input({
  className,
  disabled,
  error,
  id,
  label,
  readOnly,
  required,
  wrapperClassName,
  ...props
}: InputProps) {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <label className={joinClasses("block text-sm font-bold text-text-primary", wrapperClassName)}>
      {label ? (
        <span>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </span>
      ) : null}
      <input
        aria-describedby={errorId}
        aria-invalid={Boolean(error) || undefined}
        className={joinClasses(
          "mt-2 min-h-11 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted read-only:bg-surface-muted/70",
          error ? "border-danger focus:border-danger focus:ring-danger/20" : undefined,
          className,
        )}
        disabled={disabled}
        id={id}
        readOnly={readOnly}
        required={required}
        {...props}
      />
      {error ? (
        <p className="mt-2 text-sm font-semibold leading-6 text-danger" id={errorId}>
          {error}
        </p>
      ) : null}
    </label>
  );
}
