import type { ReactNode } from "react";

type AdminFieldProps = {
  children: ReactNode;
  label: string;
};

export function AdminField({ children, label }: AdminFieldProps) {
  return (
    <label className="text-sm font-bold text-ink">
      {label}
      {children}
    </label>
  );
}
