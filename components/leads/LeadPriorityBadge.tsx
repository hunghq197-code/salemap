import { getLeadPriorityOption } from "@/lib/constants/lead-priority";

type LeadPriorityBadgeProps = {
  priority?: string | null;
};

export function LeadPriorityBadge({ priority }: LeadPriorityBadgeProps) {
  const option = getLeadPriorityOption(priority);

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
