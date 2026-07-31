import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function SearchInput({ className, label, ...props }: SearchInputProps) {
  return (
    <label className="text-sm font-bold text-text-primary">
      {label}
      <div className="relative mt-2">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        />
        <input
          className={[
            "min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 pl-10 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
      </div>
    </label>
  );
}
