import type { ReactNode, SelectHTMLAttributes } from "react";

type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type SelectProps = {
  error?: ReactNode;
  label?: ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Select({
  children,
  className,
  disabled,
  error,
  id,
  label,
  options,
  placeholder,
  required,
  wrapperClassName,
  ...props
}: SelectProps) {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <label className={joinClasses("block text-sm font-bold text-text-primary", wrapperClassName)}>
      {label ? (
        <span>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </span>
      ) : null}
      <select
        aria-describedby={errorId}
        aria-invalid={Boolean(error) || undefined}
        className={joinClasses(
          "mt-2 min-h-11 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted",
          error ? "border-danger focus:border-danger focus:ring-danger/20" : undefined,
          className,
        )}
        disabled={disabled}
        id={id}
        required={required}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options?.map((option) => (
          <option disabled={option.disabled} key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {error ? (
        <p className="mt-2 text-sm font-semibold leading-6 text-danger" id={errorId}>
          {error}
        </p>
      ) : null}
    </label>
  );
}
