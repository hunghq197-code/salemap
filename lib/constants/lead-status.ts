export const LEAD_STATUSES = [
  {
    value: "new",
    label: "Mới lưu",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
  },
  {
    value: "contacted",
    label: "Đã liên hệ",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    value: "interested",
    label: "Quan tâm",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    value: "follow_up",
    label: "Hẹn lại",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    value: "not_fit",
    label: "Không phù hợp",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
  },
  {
    value: "won",
    label: "Đã chốt",
    badgeClass: "border-mint/40 bg-mint/15 text-ocean",
  },
  {
    value: "lost",
    label: "Đã mất",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
  },
] as const;

export const LEAD_STATUS_OPTIONS = LEAD_STATUSES;
export const DEFAULT_LEAD_STATUS = "new";

export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];

export function getLeadStatusOption(status?: string | null) {
  return (
    LEAD_STATUSES.find((option) => option.value === status) || LEAD_STATUSES[0]
  );
}
