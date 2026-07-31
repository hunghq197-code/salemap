"use client";

import {
  BarChart3,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  MapPinned,
  MessageSquareHeart,
  Search,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { FloatingFeedbackButton } from "@/components/beta/FloatingFeedbackButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LogoutButton } from "@/components/app/LogoutButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { NetworkStatusBanner } from "@/components/pwa/NetworkStatusBanner";
import { OfflineUserProvider } from "@/components/pwa/OfflineUserProvider";
import { Badge } from "@/components/ui/Badge";
import {
  appNavGroups,
  mobileNavItems,
  type AppNavIconKey,
  type AppNavItem,
} from "@/lib/design-system/navigation";

const iconMap: Record<AppNavIconKey, LucideIcon> = {
  analytics: BarChart3,
  billing: CreditCard,
  cadences: ListChecks,
  dashboard: LayoutDashboard,
  discover: MapPinned,
  feedback: MessageSquareHeart,
  import: FileSpreadsheet,
  leads: UsersRound,
  pipeline: BarChart3,
  settings: Settings,
  tasks: ListTodo,
  templates: BookOpenText,
};

const heavyPrefetchRoutePrefixes = [
  "/admin",
  "/app/ai-assistant",
  "/app/analytics",
  "/app/discover",
  "/app/export",
  "/app/import",
] as const;

type AppShellProps = {
  children: ReactNode;
  fullName: string;
  planName?: string;
  unreadNotificationCount?: number;
  userId: string;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPrefetchForRoute(href: string) {
  return heavyPrefetchRoutePrefixes.some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`),
  )
    ? false
    : undefined;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("") || "SM";
}

function getEnvironmentLabel() {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "local";

  if (env === "production") return null;
  if (env === "preview") return "Staging";
  return "Local";
}

function findActiveItem(pathname: string) {
  return appNavGroups
    .flatMap((group) => group.items)
    .find((item) => isActivePath(pathname, item.href));
}

function AppNavLink({
  collapsed = false,
  item,
  pathname,
}: {
  collapsed?: boolean;
  item: AppNavItem;
  pathname: string;
}) {
  const Icon = iconMap[item.icon];
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      className={[
        "group relative flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 text-sm font-bold transition duration-150",
        active
          ? "bg-sidebar-hover text-sidebar-text-active"
          : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active",
        collapsed ? "justify-center" : "",
      ].join(" ")}
      href={item.href}
      prefetch={getPrefetchForRoute(item.href)}
      title={collapsed ? item.label : undefined}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
      ) : null}
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
      {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
    </Link>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-soft bg-surface/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_34px_rgba(15,23,42,0.09)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {mobileNavItems.map((item) => {
          const Icon = iconMap[item.icon];
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              className={[
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-control px-1 text-[11px] font-bold transition duration-150",
                active ? "bg-primary-soft text-primary" : "text-text-muted hover:text-primary",
              ].join(" ")}
              href={item.href}
              key={item.href}
              prefetch={getPrefetchForRoute(item.href)}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({
  children,
  fullName,
  planName = "Free",
  unreadNotificationCount = 0,
  userId,
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const initials = useMemo(() => getInitials(fullName), [fullName]);
  const activeItem = findActiveItem(pathname);
  const environmentLabel = getEnvironmentLabel();

  return (
    <OfflineUserProvider userId={userId}>
      <div className="min-h-screen bg-background text-text-primary">
        <header className="sticky top-0 z-40 border-b border-border-soft bg-surface/95 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] shadow-sm backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link
              className="inline-flex min-w-0 items-center gap-2 font-bold text-text-primary"
              href="/app/dashboard"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-control bg-sidebar text-white">
                <MapPinned aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="truncate">SaleMap</span>
            </Link>
            <div className="flex flex-none items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell unreadCount={unreadNotificationCount} />
              <Link
                className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-border-soft bg-surface text-text-primary"
                href="/app/discover"
              >
                <Search aria-hidden="true" className="h-5 w-5" />
                <span className="sr-only">Tìm khách</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex min-h-screen">
          <aside
            className={[
              "sticky top-0 hidden h-screen flex-none flex-col overflow-hidden bg-sidebar text-sidebar-text shadow-[18px_0_40px_rgba(7,17,31,0.18)] transition-[width] duration-200 lg:flex",
              collapsed ? "w-20" : "w-64",
            ].join(" ")}
          >
            <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-white/10 px-4">
              <Link
                className={[
                  "inline-flex min-w-0 items-center gap-3 font-bold text-white",
                  collapsed ? "justify-center" : "",
                ].join(" ")}
                href="/app/dashboard"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-white text-sidebar">
                  <MapPinned aria-hidden="true" className="h-5 w-5" />
                </span>
                {collapsed ? null : <span className="truncate text-lg">SaleMap</span>}
              </Link>
              <button
                aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-control text-sidebar-text transition hover:bg-sidebar-hover hover:text-white xl:inline-flex"
                onClick={() => setCollapsed((current) => !current)}
                type="button"
              >
                {collapsed ? (
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                )}
              </button>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="App navigation">
              {appNavGroups.map((group) => (
                <div key={group.label}>
                  {collapsed ? null : (
                    <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <AppNavLink
                        collapsed={collapsed}
                        item={item}
                        key={item.href}
                        pathname={pathname}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-white/10 p-3">
              <div
                className={[
                  "rounded-card border border-white/10 bg-sidebar-secondary p-3",
                  collapsed ? "flex justify-center" : "",
                ].join(" ")}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent text-sm font-black text-white">
                    {initials}
                  </span>
                  {collapsed ? null : (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{fullName}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone="primary">{planName}</Badge>
                        {environmentLabel ? <Badge tone="warning">{environmentLabel}</Badge> : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {collapsed ? null : <div className="mt-3"><LogoutButton /></div>}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-30 hidden min-h-[68px] items-center justify-between gap-4 border-b border-border-soft bg-background/92 px-6 backdrop-blur lg:flex">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                  SaleMap Workspace
                </p>
                <h2 className="mt-1 truncate text-lg font-bold text-text-primary">
                  {activeItem?.label || "Workspace"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  className="inline-flex min-h-11 min-w-[240px] items-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-semibold text-text-muted shadow-sm transition hover:border-primary/40 hover:text-primary"
                  href="/app/leads"
                  prefetch={false}
                >
                  <Search aria-hidden="true" className="h-4 w-4" />
                  Tìm lead, khách hàng...
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover"
                  href="/app/discover"
                  prefetch={false}
                >
                  <MapPinned aria-hidden="true" className="h-4 w-4" />
                  Tìm khách nhanh
                </Link>
                <NotificationBell unreadCount={unreadNotificationCount} />
                <LanguageSwitcher />
              </div>
            </header>

            <main className="min-w-0 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7 xl:px-10">
              <NetworkStatusBanner />
              {children}
            </main>
          </div>
        </div>

        <FloatingFeedbackButton />
        <InstallPrompt />
        <MobileBottomNav pathname={pathname} />
      </div>
    </OfflineUserProvider>
  );
}
