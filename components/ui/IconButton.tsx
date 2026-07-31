import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonVariant = "danger" | "ghost" | "outline" | "primary" | "secondary";
type IconButtonSize = "sm" | "md" | "lg";

type IconButtonProps = {
  icon: ReactNode;
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children">;

const variantClasses: Record<IconButtonVariant, string> = {
  danger: "bg-danger text-white hover:bg-red-600",
  ghost: "bg-transparent text-text-secondary hover:bg-primary-soft hover:text-primary",
  outline: "border border-border-soft bg-transparent text-text-primary hover:border-primary/50 hover:bg-primary-soft hover:text-primary",
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-border-soft bg-surface text-text-primary shadow-sm hover:border-primary/40 hover:text-primary",
};

const sizeClasses: Record<IconButtonSize, string> = {
  lg: "h-12 w-12",
  md: "h-10 w-10",
  sm: "h-9 w-9",
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function IconButton({
  className,
  icon,
  label,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={joinClasses(
        "inline-flex shrink-0 items-center justify-center rounded-control font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    >
      {icon}
    </button>
  );
}
