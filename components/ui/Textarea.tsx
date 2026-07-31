import type { ReactNode, TextareaHTMLAttributes } from "react";

type TextareaProps = {
  error?: ReactNode;
  label?: ReactNode;
  wrapperClassName?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Textarea({
  className,
  disabled,
  error,
  id,
  label,
  readOnly,
  required,
  wrapperClassName,
  ...props
}: TextareaProps) {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <label className={joinClasses("block text-sm font-bold text-text-primary", wrapperClassName)}>
      {label ? (
        <span>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </span>
      ) : null}
      <textarea
        aria-describedby={errorId}
        aria-invalid={Boolean(error) || undefined}
        className={joinClasses(
          "mt-2 min-h-28 w-full resize-y rounded-control border border-border-soft bg-surface px-3 py-2.5 text-base leading-7 text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted read-only:bg-surface-muted/70",
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
