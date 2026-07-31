"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

type PopoverAlign = "end" | "start";

type PopoverProps = {
  align?: PopoverAlign;
  children: ReactNode;
  label: string;
  title?: ReactNode;
  trigger: ReactNode;
};

const alignClasses: Record<PopoverAlign, string> = {
  end: "right-0",
  start: "left-0",
};

export function Popover({
  align = "end",
  children,
  label,
  title,
  trigger,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

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
        aria-haspopup="dialog"
        aria-label={label}
        className="inline-flex"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {trigger}
      </button>
      {open ? (
        <div
          aria-labelledby={title ? titleId : undefined}
          className={[
            "absolute top-full z-[60] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-card border border-border-soft bg-surface p-4 shadow-floating",
            alignClasses[align],
          ].join(" ")}
          role="dialog"
        >
          {title ? (
            <h2 className="mb-3 text-sm font-bold text-text-primary" id={titleId}>
              {title}
            </h2>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}
