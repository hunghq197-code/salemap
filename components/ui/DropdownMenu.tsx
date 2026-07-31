"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type DropdownMenuAlign = "end" | "start";

type DropdownMenuProps = {
  align?: DropdownMenuAlign;
  children: ReactNode;
  label: string;
  trigger: ReactNode;
};

type DropdownMenuItemProps = {
  children: ReactNode;
  disabled?: boolean;
  href?: string;
  onSelect?: () => void;
};

const alignClasses: Record<DropdownMenuAlign, string> = {
  end: "right-0",
  start: "left-0",
};

const DropdownMenuContext = createContext<(() => void) | null>(null);

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function DropdownMenu({
  align = "end",
  children,
  label,
  trigger,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="inline-flex"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {trigger}
      </button>
      {open ? (
        <DropdownMenuContext.Provider value={() => setOpen(false)}>
          <div
            className={joinClasses(
              "absolute top-full z-[60] mt-2 min-w-52 rounded-card border border-border-soft bg-surface p-1.5 shadow-floating",
              alignClasses[align],
            )}
            role="menu"
          >
            {children}
          </div>
        </DropdownMenuContext.Provider>
      ) : null}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  disabled = false,
  href,
  onSelect,
}: DropdownMenuItemProps) {
  const closeMenu = useContext(DropdownMenuContext);
  const className = joinClasses(
    "flex w-full items-center rounded-control px-3 py-2 text-left text-sm font-semibold text-text-secondary transition",
    disabled ? "cursor-not-allowed opacity-50" : "hover:bg-primary-soft hover:text-primary",
  );
  const handleSelect = () => {
    onSelect?.();
    closeMenu?.();
  };

  if (href) {
    return (
      <Link
        aria-disabled={disabled}
        className={className}
        href={href}
        onClick={disabled ? undefined : handleSelect}
        role="menuitem"
        tabIndex={disabled ? -1 : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={className}
      disabled={disabled}
      onClick={handleSelect}
      role="menuitem"
      type="button"
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border-soft" role="separator" />;
}
