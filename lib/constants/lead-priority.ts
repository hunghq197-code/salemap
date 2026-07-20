export const LEAD_PRIORITIES = [
  {
    value: "low",
    label: "Thấp",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
  },
  {
    value: "medium",
    label: "Trung bình",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    value: "high",
    label: "Cao",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
  },
] as const;

export const LEAD_PRIORITY_OPTIONS = LEAD_PRIORITIES;
export const DEFAULT_LEAD_PRIORITY = "medium";

export type LeadPriority = (typeof LEAD_PRIORITIES)[number]["value"];

export function getLeadPriorityOption(priority?: string | null) {
  return (
    LEAD_PRIORITIES.find((option) => option.value === priority) ||
    LEAD_PRIORITIES[1]
  );
}
