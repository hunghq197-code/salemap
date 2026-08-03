export type AppNavIconKey =
  | "analytics"
  | "billing"
  | "cadences"
  | "dashboard"
  | "discover"
  | "feedback"
  | "import"
  | "leads"
  | "pipeline"
  | "settings"
  | "support"
  | "tasks"
  | "templates";

export type AppNavItem = {
  href: string;
  icon: AppNavIconKey;
  label: string;
};

export type AppNavGroup = {
  items: AppNavItem[];
  label: string;
};

export const appNavGroups: AppNavGroup[] = [
  {
    label: "Làm việc",
    items: [
      { href: "/app/dashboard", icon: "dashboard", label: "Tổng quan" },
      { href: "/app/discover", icon: "discover", label: "Tìm khách" },
      { href: "/app/tasks", icon: "tasks", label: "Việc cần làm" },
      { href: "/app/leads", icon: "leads", label: "Lead" },
      { href: "/app/pipeline", icon: "pipeline", label: "Pipeline" },
    ],
  },
  {
    label: "Công cụ",
    items: [
      { href: "/app/cadences", icon: "cadences", label: "Quy trình chăm sóc" },
      { href: "/app/templates", icon: "templates", label: "Mẫu nội dung" },
      { href: "/app/import", icon: "import", label: "Import dữ liệu" },
      { href: "/app/analytics", icon: "analytics", label: "Phân tích" },
    ],
  },
  {
    label: "Tài khoản",
    items: [
      { href: "/app/billing", icon: "billing", label: "Gói dịch vụ" },
      { href: "/app/support/tickets", icon: "support", label: "Hỗ trợ" },
      { href: "/app/settings", icon: "settings", label: "Cài đặt" },
      { href: "/app/feedback", icon: "feedback", label: "Góp ý / Trợ giúp" },
    ],
  },
];

export const mobileNavItems: AppNavItem[] = [
  { href: "/app/dashboard", icon: "dashboard", label: "Tổng quan" },
  { href: "/app/discover", icon: "discover", label: "Tìm khách" },
  { href: "/app/tasks", icon: "tasks", label: "Việc" },
  { href: "/app/leads", icon: "leads", label: "Lead" },
];

export const mobileMoreNavItems: AppNavItem[] = [
  { href: "/app/pipeline", icon: "pipeline", label: "Pipeline" },
  { href: "/app/cadences", icon: "cadences", label: "Quy trình chăm sóc" },
  { href: "/app/import", icon: "import", label: "Import dữ liệu" },
  { href: "/app/analytics", icon: "analytics", label: "Phân tích" },
  { href: "/app/billing", icon: "billing", label: "Gói dịch vụ" },
  { href: "/app/support/tickets", icon: "support", label: "Hỗ trợ" },
  { href: "/app/settings", icon: "settings", label: "Cài đặt" },
  { href: "/app/feedback", icon: "feedback", label: "Góp ý / Trợ giúp" },
];

export type AdminNavIconKey =
  | "audit"
  | "billing"
  | "catalog"
  | "customers"
  | "dashboard"
  | "feedback"
  | "payments"
  | "orders"
  | "security"
  | "settings"
  | "subscriptions"
  | "system"
  | "tickets"
  | "usage"
  | "users";

export type AdminNavItem = {
  href: string;
  icon: AdminNavIconKey;
  label: string;
};

export const adminPrimaryNavItems: AdminNavItem[] = [
  { href: "/admin", icon: "dashboard", label: "Tổng quan hệ thống" },
  { href: "/admin/customers", icon: "customers", label: "Khách hàng" },
  { href: "/admin/orders", icon: "orders", label: "Đơn hàng" },
  { href: "/admin/catalog", icon: "catalog", label: "Catalog" },
  { href: "/admin/tickets", icon: "tickets", label: "Tickets" },
  { href: "/admin/users", icon: "users", label: "Người dùng" },
  { href: "/admin/subscriptions", icon: "subscriptions", label: "Gói dịch vụ" },
  { href: "/admin/payments", icon: "payments", label: "Thanh toán" },
  { href: "/admin/usage", icon: "usage", label: "Quota & Usage" },
  { href: "/admin/feedback", icon: "feedback", label: "Feedback" },
  { href: "/admin/audit-logs", icon: "security", label: "Bảo mật & Nhật ký" },
  { href: "/admin/system", icon: "system", label: "Hệ thống" },
  { href: "/admin/settings", icon: "settings", label: "Cài đặt" },
];

export const adminSecondaryNavItems: AdminNavItem[] = [
  { href: "/admin/payment-requests", icon: "billing", label: "Yêu cầu thanh toán" },
  { href: "/admin/quotas", icon: "usage", label: "Quota overrides" },
];
