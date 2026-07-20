export const INTERACTION_TYPES = [
  { value: "call", label: "Gọi điện" },
  { value: "message", label: "Nhắn tin" },
  { value: "visit", label: "Ghé trực tiếp" },
  { value: "email", label: "Email" },
  { value: "quote_sent", label: "Đã gửi báo giá" },
  { value: "follow_up", label: "Follow-up" },
  { value: "other", label: "Khác" },
] as const;

export const INTERACTION_TYPE_OPTIONS = INTERACTION_TYPES;
export const DEFAULT_INTERACTION_TYPE = "call";

export type InteractionType = (typeof INTERACTION_TYPES)[number]["value"];

export function getInteractionTypeLabel(type?: string | null) {
  return INTERACTION_TYPES.find((option) => option.value === type)?.label || "Khác";
}
