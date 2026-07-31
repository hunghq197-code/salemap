import type { ReactNode } from "react";

export type RadioOption = {
  description?: ReactNode;
  disabled?: boolean;
  label: ReactNode;
  value: string;
};

type RadioGroupProps = {
  className?: string;
  defaultValue?: string;
  legend: ReactNode;
  name: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  value?: string;
};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function RadioGroup({
  className,
  defaultValue,
  legend,
  name,
  onChange,
  options,
  value,
}: RadioGroupProps) {
  return (
    <fieldset className={className}>
      <legend className="text-sm font-bold text-text-primary">{legend}</legend>
      <div className="mt-2 grid gap-2">
        {options.map((option) => (
          <label
            className={joinClasses(
              "flex min-h-11 cursor-pointer items-start gap-3 rounded-control border border-border-soft bg-surface px-3 py-2.5 text-sm transition hover:border-primary/40",
              option.disabled && "cursor-not-allowed opacity-60",
            )}
            key={option.value}
          >
            <input
              checked={value === undefined ? undefined : value === option.value}
              className="mt-1 h-4 w-4 border-border-strong text-primary focus:ring-2 focus:ring-primary/20"
              defaultChecked={value === undefined ? defaultValue === option.value : undefined}
              disabled={option.disabled}
              name={name}
              onChange={() => onChange?.(option.value)}
              type="radio"
              value={option.value}
            />
            <span>
              <span className="font-bold text-text-primary">{option.label}</span>
              {option.description ? (
                <span className="mt-1 block text-sm leading-6 text-text-secondary">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
