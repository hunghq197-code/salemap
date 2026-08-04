"use client";

import {
  ClipboardList,
  ContactRound,
  Boxes,
  BookOpenText,
  CreditCard,
  GaugeCircle,
  Home,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MessageSquareText,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  TicketCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AdminRoleBadge } from "@/components/admin/AdminRoleBadge";
import { Badge } from "@/components/ui/Badge";
import {
  adminPrimaryNavItems,
  adminSecondaryNavItems,
  type AdminNavIconKey,
  type AdminNavItem,
} from "@/lib/design-system/navigation";
import {
  hasPermission,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin/admin-permissions";
import { clearUserOfflineData } from "@/lib/offline/clear-user-offline-data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const iconMap: Record<AdminNavIconKey, LucideIcon> = {
  audit: ClipboardList,
  billing: CreditCard,
  catalog: Boxes,
  cms: BookOpenText,
  customers: ContactRound,
  dashboard: LayoutDashboard,
  feedback: MessageSquareText,
  orders: ClipboardList,
  payments: CreditCard,
  security: ShieldCheck,
  settings: LockKeyhole,
  subscriptions: RefreshCw,
  system: ServerCog,
  tickets: TicketCheck,
  usage: GaugeCircle,
  users: UsersRound,
};

const securityEventsNavItem: AdminNavItem = {
  href: "/admin/security-events",
  icon: "security",
  label: "Security events",
  permission: "VIEW_SECURITY_EVENTS",
};

const adminNavSectionDefinitions = [
  {
    hrefs: ["/admin"],
    label: "TONG QUAN",
  },
  {
    hrefs: [
      "/admin/users",
      "/admin/payments",
      "/admin/subscriptions",
      "/admin/usage",
      "/admin/quotas",
      "/admin/feedback",
    ],
    label: "VAN HANH",
  },
  {
    hrefs: ["/admin/security-events", "/admin/audit-logs"],
    label: "AN TOAN",
  },
  {
    hrefs: ["/admin/system", "/admin/settings"],
    label: "HE THONG",
  },
  {
    hrefs: [
      "/admin/customers",
      "/admin/orders",
      "/admin/catalog",
      "/admin/tickets",
      "/admin/cms",
      "/admin/payment-requests",
    ],
    label: "MO RONG",
  },
] as const;

const mobileAdminNavOrder = [
  "/admin",
  "/admin/users",
  "/admin/payments",
  "/admin/security-events",
];

const adminNavPermissionByHref: Record<string, AdminPermission> = {
  "/admin": "VIEW_ADMIN_DASHBOARD",
  "/admin/audit-logs": "VIEW_AUDIT_LOGS",
  "/admin/catalog": "VIEW_CATALOG",
  "/admin/cms": "VIEW_CMS",
  "/admin/customers": "VIEW_CUSTOMERS",
  "/admin/feedback": "VIEW_FEEDBACK",
  "/admin/orders": "VIEW_ORDERS",
  "/admin/payment-requests": "VIEW_PAYMENTS",
  "/admin/payments": "VIEW_PAYMENTS",
  "/admin/quotas": "VIEW_USAGE",
  "/admin/security-events": "VIEW_SECURITY_EVENTS",
  "/admin/settings": "MANAGE_SYSTEM_SETTINGS",
  "/admin/subscriptions": "VIEW_SUBSCRIPTIONS",
  "/admin/system": "VIEW_SYSTEM_HEALTH",
  "/admin/tickets": "VIEW_TICKETS",
  "/admin/usage": "VIEW_USAGE",
  "/admin/users": "VIEW_USERS",
};

type AdminShellProps = {
  children: ReactNode;
  email: string | null;
  fullName: string | null;
  role: AdminRole;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
}

function getEnvironmentLabel() {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "local";

  if (env === "production") return "Production";
  if (env === "preview") return "Staging";
  return "Local";
}

function injectSecurityEventsNav(items: AdminNavItem[]) {
  if (items.some((item) => item.href === securityEventsNavItem.href)) {
    return items;
  }

  return items.flatMap((item) =>
    item.href === "/admin/audit-logs" ? [securityEventsNavItem, item] : [item],
  );
}

function getVisibleAdminNavItems(role: AdminRole, items: AdminNavItem[]) {
  return injectSecurityEventsNav(items).filter((item) => {
    const permission = item.permission ?? adminNavPermissionByHref[item.href];

    return permission ? hasPermission(role, permission) : true;
  });
}

function findActiveItem(pathname: string, items: AdminNavItem[]) {
  return items.find((item) =>
    isActivePath(pathname, item.href),
  );
}

function getAdminNavSections(items: AdminNavItem[]) {
  const itemByHref = new Map(items.map((item) => [item.href, item]));

  return adminNavSectionDefinitions
    .map((section) => ({
      ...section,
      items: section.hrefs
        .map((href) => itemByHref.get(href))
        .filter((item): item is AdminNavItem => Boolean(item)),
    }))
    .filter((section) => section.items.length > 0);
}

function getMobileAdminNavItems(items: AdminNavItem[]) {
  const itemByHref = new Map(items.map((item) => [item.href, item]));
  const preferredItems = mobileAdminNavOrder
    .map((href) => itemByHref.get(href))
    .filter((item): item is AdminNavItem => Boolean(item));
  const fallbackItems = items.filter(
    (item) => !mobileAdminNavOrder.includes(item.href),
  );

  return [...preferredItems, ...fallbackItems].slice(0, 4);
}

function AdminNavLink({ item, pathname }: { item: AdminNavItem; pathname: string }) {
  const Icon = iconMap[item.icon];
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      className={[
        "relative flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 text-sm font-bold transition duration-150",
        active
          ? "bg-sidebar-hover text-white"
          : "text-sidebar-text hover:bg-sidebar-hover hover:text-white",
      ].join(" ")}
      href={item.href}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-warning" />
      ) : null}
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function AdminMobileNav({
  items,
  pathname,
}: {
  items: AdminNavItem[];
  pathname: string;
}) {
  return (
    <nav
      aria-label="Admin mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-soft bg-surface/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_34px_rgba(15,23,42,0.09)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.slice(0, 4).map((item) => {
          const Icon = iconMap[item.icon];
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              className={[
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-control px-1 text-[11px] font-bold transition",
                active ? "bg-primary-soft text-primary" : "text-text-muted",
              ].join(" ")}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span>{item.label.replace(" hệ thống", "")}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminShell({ children, email, fullName, role }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const environmentLabel = getEnvironmentLabel();
  const primaryNavItems = getVisibleAdminNavItems(role, adminPrimaryNavItems);
  const secondaryNavItems = getVisibleAdminNavItems(role, adminSecondaryNavItems);
  const visibleNavItems = [...primaryNavItems, ...secondaryNavItems];
  const activeItem = findActiveItem(pathname, visibleNavItems);
  const navSections = getAdminNavSections(visibleNavItems);
  const mobileNavItems = getMobileAdminNavItems(visibleNavItems);

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        clearUserOfflineData(user.id);
      }

      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border-soft bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link className="inline-flex items-center gap-2 font-bold text-text-primary" href="/admin">
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-sidebar text-white">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            SaleMap Admin
          </Link>
          <Link
            className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-border-soft bg-surface text-text-primary"
            href="/app/dashboard"
          >
            <Home aria-hidden="true" className="h-5 w-5" />
            <span className="sr-only">Về app</span>
          </Link>
        </div>
      </header>

      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 flex-none flex-col overflow-hidden bg-sidebar text-sidebar-text shadow-[18px_0_40px_rgba(7,17,31,0.18)] lg:flex">
          <div className="flex min-h-[72px] items-center gap-3 border-b border-white/10 px-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-white text-sidebar">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold text-white">SaleMap Admin</p>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sidebar-text">
                Operations
              </p>
            </div>
          </div>

          <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-5">
            {navSections.map((section, index) => (
              <div className={index === 0 ? "" : "pt-5"} key={section.label}>
                <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <AdminNavLink item={item} key={item.href} pathname={pathname} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-card border border-white/10 bg-sidebar-secondary p-3">
              <p className="truncate text-sm font-bold text-white">
                {fullName || email || "SaleMap admin"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <AdminRoleBadge role={role} />
                <Badge tone={environmentLabel === "Production" ? "danger" : "warning"}>
                  {environmentLabel}
                </Badge>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white transition hover:bg-sidebar-hover"
                href="/app/dashboard"
              >
                <Home aria-hidden="true" className="h-4 w-4" />
                Về app
              </Link>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-danger/30 bg-danger-soft/10 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-danger/20 disabled:opacity-70"
                disabled={isSigningOut}
                onClick={handleLogout}
                type="button"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Thoát
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 hidden min-h-[68px] items-center justify-between gap-4 border-b border-border-soft bg-background/92 px-6 backdrop-blur lg:flex">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                Admin Console
              </p>
              <h1 className="mt-1 text-lg font-bold text-text-primary">
                {activeItem?.label || "Tổng quan hệ thống"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={environmentLabel === "Production" ? "danger" : "warning"}>
                {environmentLabel}
              </Badge>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary"
                href="/app/dashboard"
              >
                <Home aria-hidden="true" className="h-4 w-4" />
                Về app
              </Link>
            </div>
          </header>

          <main className="min-w-0 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7 xl:px-10">
            {children}
          </main>
        </div>
      </div>

      <AdminMobileNav items={mobileNavItems} pathname={pathname} />
    </div>
  );
}
