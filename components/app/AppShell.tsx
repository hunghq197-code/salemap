"use client";

import {
  BarChart3,
  Bot,
  BookOpenText,
  CircleHelp,
  CreditCard,
  Download,
  FileSpreadsheet,
  HardDriveDownload,
  LayoutDashboard,
  ListTodo,
  MapPinned,
  MessageSquareHeart,
  Search,
  Settings,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FloatingFeedbackButton } from "@/components/beta/FloatingFeedbackButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { NetworkStatusBanner } from "@/components/pwa/NetworkStatusBanner";
import { OfflineUserProvider } from "@/components/pwa/OfflineUserProvider";

const mobileNavConfig = [
  { href: "/app/dashboard", icon: LayoutDashboard },
  { href: "/app/pipeline", icon: LayoutDashboard },
  { href: "/app/discover", icon: Search },
  { href: "/app/leads", icon: UsersRound },
  { href: "/app/tasks", icon: ListTodo },
  { href: "/app/templates", icon: BookOpenText },
] as const;

const desktopNavConfig = [
  { href: "/app/dashboard", icon: LayoutDashboard },
  { href: "/app/pipeline", icon: LayoutDashboard },
  { href: "/app/discover", icon: Search },
  { href: "/app/leads", icon: UsersRound },
  { href: "/app/analytics", icon: BarChart3 },
  { href: "/app/analytics/goals", icon: Target },
  { href: "/app/leads/views", icon: Sparkles },
  { href: "/app/leads/cleanup", icon: Sparkles },
  { href: "/app/tasks", icon: ListTodo },
  { href: "/app/templates", icon: BookOpenText },
  { href: "/app/ai-assistant", icon: Bot },
  { href: "/app/import", icon: FileSpreadsheet },
  { href: "/app/export", icon: Download },
  { href: "/app/billing", icon: CreditCard },
  { href: "/app/offline", icon: HardDriveDownload },
  { href: "/app/settings", icon: Settings },
  { href: "/app/huong-dan", icon: CircleHelp },
  { href: "/app/feedback", icon: MessageSquareHeart },
] as const;

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

export function AppShell({
  children,
  fullName,
  unreadNotificationCount = 0,
  userId,
}: AppShellProps) {
  const pathname = usePathname();
  const { dictionary } = useLanguage();
  const shellCopy = dictionary.appShell;
  const mobileNavItems = mobileNavConfig.map((item, index) => ({
    ...item,
    label: shellCopy.bottomNav[index],
  }));
  const desktopNavItems = desktopNavConfig.map((item, index) => ({
    ...item,
    label: shellCopy.desktopNav[index],
  }));

  return (
    <OfflineUserProvider userId={userId}>
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f5f8fb_55%,#eef8f4_100%)] text-ink">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] shadow-[0_12px_32px_rgba(16,32,51,0.06)] backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link className="inline-flex min-w-0 items-center gap-2 font-bold text-ink" href="/app/dashboard">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-ink text-white">
                <MapPinned aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="truncate">SaleMap</span>
            </Link>
            <div className="flex flex-none items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell unreadCount={unreadNotificationCount} />
              <Link
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink"
                href="/app/settings"
              >
                <Settings aria-hidden="true" className="h-5 w-5" />
                <span className="sr-only">{shellCopy.settings}</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl">
          <aside className="sticky top-0 hidden h-screen w-72 flex-none overflow-y-auto border-r border-slate-200 bg-white/95 px-5 py-6 shadow-[12px_0_34px_rgba(16,32,51,0.04)] lg:block">
            <div className="flex items-center justify-between gap-3">
              <Link className="inline-flex items-center gap-2 text-xl font-bold text-ink" href="/app/dashboard">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
                  <MapPinned aria-hidden="true" className="h-5 w-5" />
                </span>
                SaleMap
              </Link>
              <NotificationBell unreadCount={unreadNotificationCount} />
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-cloud px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ocean">
                    {shellCopy.workspace}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-ink">{fullName}</p>
                </div>
                <LanguageSwitcher />
              </div>
            </div>

            <nav aria-label="App navigation" className="mt-6 space-y-2">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    className={[
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition",
                      isActive
                        ? "bg-mint/15 text-ocean"
                        : "text-slate-600 hover:bg-cloud hover:text-ink",
                    ].join(" ")}
                    href={item.href}
                    key={item.href}
                    prefetch={getPrefetchForRoute(item.href)}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
            <NetworkStatusBanner />
            {children}
          </main>
        </div>

        <FloatingFeedbackButton />
        <InstallPrompt />

        <nav
          aria-label="Mobile bottom navigation"
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
        >
          <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  className={[
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-bold transition",
                    isActive ? "bg-mint/15 text-ocean" : "text-slate-500",
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
      </div>
    </OfflineUserProvider>
  );
}
