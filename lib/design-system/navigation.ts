import type { AdminPermission } from "@/lib/admin/admin-permissions";

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
  | "cms"
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
  permission?: AdminPermission;
};

export const adminPrimaryNavItems: AdminNavItem[] = [
  { href: "/admin", icon: "dashboard", label: "Tong quan he thong" },
  { href: "/admin/users", icon: "users", label: "Nguoi dung" },
  { href: "/admin/payments", icon: "payments", label: "Thanh toan" },
  { href: "/admin/subscriptions", icon: "subscriptions", label: "Goi dich vu" },
  { href: "/admin/usage", icon: "usage", label: "Usage" },
  { href: "/admin/quotas", icon: "usage", label: "Quota overrides" },
  { href: "/admin/feedback", icon: "feedback", label: "Feedback" },
  { href: "/admin/security-events", icon: "security", label: "Security events" },
  { href: "/admin/audit-logs", icon: "audit", label: "Audit logs" },
  { href: "/admin/system", icon: "system", label: "System health" },
  { href: "/admin/settings", icon: "settings", label: "Settings" },
];

export const adminSecondaryNavItems: AdminNavItem[] = [
  { href: "/admin/customers", icon: "customers", label: "Customers" },
  { href: "/admin/orders", icon: "orders", label: "Orders" },
  { href: "/admin/catalog", icon: "catalog", label: "Catalog" },
  { href: "/admin/tickets", icon: "tickets", label: "Tickets" },
  { href: "/admin/cms", icon: "cms", label: "CMS" },
  { href: "/admin/payment-requests", icon: "billing", label: "Payment requests" },
];
