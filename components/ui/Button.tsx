import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

type ButtonVariant =
  | "accent"
  | "danger"
  | "ghost"
  | "link"
  | "outline"
  | "primary"
  | "secondary"
  | "success";
type ButtonSize = "icon" | "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  loadingLabel?: string;
  onClick?: () => void;
  size?: ButtonSize;
  type?: "button" | "submit";
  variant?: ButtonVariant;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  accent:
    "bg-accent text-white shadow-[0_16px_34px_rgba(6,182,212,0.24)] hover:bg-cyan-500 focus:ring-accent focus:ring-offset-white",
  danger:
    "bg-danger text-white shadow-[0_16px_34px_rgba(239,68,68,0.18)] hover:bg-red-600 focus:ring-danger focus:ring-offset-white",
  primary:
    "bg-primary text-white shadow-[0_16px_34px_rgba(37,99,235,0.24)] hover:bg-primary-hover focus:ring-primary focus:ring-offset-white",
  secondary:
    "border border-border-soft bg-surface text-text-primary shadow-sm hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus:ring-primary focus:ring-offset-white",
  ghost:
    "bg-transparent text-text-secondary hover:bg-primary-soft hover:text-primary focus:ring-primary focus:ring-offset-white",
  link: "min-h-0 rounded-none bg-transparent p-0 text-primary hover:text-primary-hover focus:ring-primary focus:ring-offset-white",
  outline:
    "border border-border-soft bg-transparent text-text-primary hover:border-primary/50 hover:bg-primary-soft hover:text-primary focus:ring-primary focus:ring-offset-white",
  success:
    "bg-success text-white shadow-[0_16px_34px_rgba(16,185,129,0.2)] hover:bg-emerald-600 focus:ring-success focus:ring-offset-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  icon: "h-10 w-10 p-0 text-sm",
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  children,
  className,
  disabled = false,
  href,
  icon,
  iconPosition = "right",
  loading = false,
  loadingLabel = "Đang xử lý...",
  onClick,
  size = "md",
  type = "button",
  variant = "primary",
}: ButtonProps) {
  const classes = joinClasses(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  const content = (
    <>
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : iconPosition === "left" ? (
        icon
      ) : null}
      <span>{loading ? loadingLabel : children}</span>
      {!loading && iconPosition === "right" ? icon : null}
    </>
  );

  if (href) {
    const linkDisabled = disabled || loading;
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (linkDisabled) {
        event.preventDefault();
        return;
      }

      onClick?.();
    };

    return (
      <Link
        aria-disabled={linkDisabled}
        className={joinClasses(classes, linkDisabled && "pointer-events-none opacity-60")}
        href={href}
        onClick={handleClick}
        tabIndex={linkDisabled ? -1 : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      aria-busy={loading || undefined}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
    >
      {content}
    </button>
  );
}
