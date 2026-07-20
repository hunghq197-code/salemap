import { getLeadStatusOption } from "@/lib/constants/lead-status";

type LeadStatusBadgeProps = {
  status?: string | null;
};

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const option = getLeadStatusOption(status);

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-bold",
        option.badgeClass,
      ].join(" ")}
    >
      {option.label}
    </span>
  );
}
