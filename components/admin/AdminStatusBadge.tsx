type AdminStatusBadgeProps = {
  tone?: "blue" | "green" | "red" | "slate" | "yellow";
  value?: string | null;
};

const toneClasses = {
  blue: "border-ocean/20 bg-ocean/10 text-ocean",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  yellow: "border-amber-200 bg-amber-50 text-amber-700",
};

function getTone(value?: string | null): AdminStatusBadgeProps["tone"] {
  if (!value) {
    return "slate";
  }

  if (["fixed", "invited_beta", "high_intent", "completed"].includes(value)) {
    return "green";
  }

  if (["urgent", "high", "reviewing", "planned", "contacted"].includes(value)) {
    return "yellow";
  }

  if (["rejected", "closed", "not_fit", "no_response"].includes(value)) {
    return "red";
  }

  if (["new", "normal"].includes(value)) {
    return "blue";
  }

  return "slate";
}

export function AdminStatusBadge({ tone, value }: AdminStatusBadgeProps) {
  const safeValue = value || "unknown";

  return (
    <span
      className={[
        "inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-bold",
        toneClasses[tone || getTone(safeValue) || "slate"],
      ].join(" ")}
    >
      {safeValue}
    </span>
  );
}
