import type { ReactNode } from "react";

type TooltipSide = "bottom" | "left" | "right" | "top";

type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  side?: TooltipSide;
};

const sideClasses: Record<TooltipSide, string> = {
  bottom: "left-1/2 top-full mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
};

export function Tooltip({ children, content, side = "top" }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={[
          "pointer-events-none absolute z-[80] w-max max-w-64 rounded-control bg-sidebar px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-floating transition group-focus-within:opacity-100 group-hover:opacity-100",
          sideClasses[side],
        ].join(" ")}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}
