export const BETA_CHECKLIST_ITEMS = [
  {
    description: "Tạo một khách tiềm năng thủ công để làm quen với Lead Core.",
    href: "/app/leads?create=1",
    key: "create_first_lead",
    title: "Thêm lead đầu tiên",
  },
  {
    description: "Ghi lại nội dung sau khi gọi/gặp khách.",
    href: "/app/leads",
    key: "add_first_note",
    title: "Thêm ghi chú cho lead",
  },
  {
    description: "Đặt lịch nhắc gọi lại hoặc chăm sóc khách.",
    href: "/app/reminders",
    key: "create_first_reminder",
    title: "Tạo lịch follow-up",
  },
  {
    description: "Nhập khu vực và từ khóa để tìm khách tiềm năng.",
    href: "/app/discover",
    key: "search_area",
    title: "Tìm khách theo khu vực",
  },
  {
    description: "Nhập điểm đi, điểm đến và tìm khách gần tuyến đường.",
    href: "/app/discover?tab=route",
    key: "search_route",
    title: "Tìm khách dọc tuyến",
  },
  {
    description: "Dùng thử thư viện mẫu tin nhắn/kịch bản.",
    href: "/app/templates",
    key: "copy_template",
    title: "Sao chép một mẫu sale",
  },
  {
    description: "Cho chúng tôi biết điểm bạn thích, chưa thích hoặc lỗi gặp phải.",
    href: "/app/feedback",
    key: "send_feedback",
    title: "Gửi góp ý",
  },
] as const;

export type BetaChecklistKey = (typeof BETA_CHECKLIST_ITEMS)[number]["key"];

export function isBetaChecklistKey(value: string): value is BetaChecklistKey {
  return BETA_CHECKLIST_ITEMS.some((item) => item.key === value);
}
