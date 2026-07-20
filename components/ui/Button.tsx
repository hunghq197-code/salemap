import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  onClick?: () => void;
  size?: ButtonSize;
  type?: "button" | "submit";
  variant?: ButtonVariant;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70";

const variantClasses: Record<ButtonVariant, string> = {
  accent:
    "bg-mint text-ink shadow-[0_16px_36px_rgba(34,197,139,0.28)] hover:bg-[#5de0b3] focus:ring-mint focus:ring-offset-white",
  primary:
    "bg-ink text-white shadow-soft hover:bg-ocean focus:ring-ocean focus:ring-offset-white",
  secondary:
    "border border-slate-300 bg-white text-ink hover:border-ocean hover:text-ocean focus:ring-ocean focus:ring-offset-white",
  ghost:
    "bg-transparent text-ink hover:bg-white/80 hover:text-ocean focus:ring-ocean focus:ring-offset-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  children,
  className,
  disabled = false,
  href,
  icon,
  iconPosition = "right",
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
      {iconPosition === "left" ? icon : null}
      <span>{children}</span>
      {iconPosition === "right" ? icon : null}
    </>
  );

  if (href) {
    return (
      <Link
        aria-disabled={disabled}
        className={classes}
        href={href}
        onClick={disabled ? undefined : onClick}
        tabIndex={disabled ? -1 : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} onClick={onClick} type={type}>
      {content}
    </button>
  );
}
