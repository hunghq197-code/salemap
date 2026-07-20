"use client";

import {
  BarChart3,
  Bot,
  CircleDollarSign,
  CreditCard,
  DatabaseZap,
  ClipboardList,
  ClipboardCheck,
  FileSpreadsheet,
  Flag,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  MousePointerClick,
  Settings,
  Ticket,
  UserRound,
  UsersRound,
  HeartPulse,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/admin/users", icon: UsersRound, label: "Người dùng" },
  { href: "/admin/beta-signups", icon: MousePointerClick, label: "Đăng ký" },
  { href: "/admin/feedback", icon: MessageSquareText, label: "Feedback" },
  { href: "/admin/upgrade-interests", icon: Settings, label: "Quan tâm nâng cấp" },
  { href: "/admin/payment-requests", icon: CreditCard, label: "Thanh toán" },
  { href: "/admin/payment-gateway", icon: CircleDollarSign, label: "Cổng thanh toán" },
  { href: "/admin/ai-usage", icon: Bot, label: "AI Usage" },
  { href: "/admin/imports", icon: FileSpreadsheet, label: "Imports" },
  { href: "/admin/data-quality", icon: DatabaseZap, label: "Data Quality" },
  { href: "/admin/lead-views", icon: DatabaseZap, label: "Lead Views" },
  { href: "/admin/sales-analytics", icon: BarChart3, label: "Sales Analytics" },
  { href: "/admin/revenue", icon: CircleDollarSign, label: "Doanh thu" },
  { href: "/admin/subscriptions", icon: RefreshCw, label: "Subscriptions" },
  { href: "/admin/usage", icon: BarChart3, label: "Usage" },
  { href: "/admin/retention", icon: HeartPulse, label: "Retention" },
  { href: "/admin/beta-cohorts", icon: UsersRound, label: "Cohorts" },
  { href: "/admin/invite-codes", icon: Ticket, label: "Invite Codes" },
  { href: "/admin/feature-flags", icon: Flag, label: "Feature Flags" },
  { href: "/admin/surveys", icon: ClipboardList, label: "Surveys" },
  { href: "/admin/qa", icon: ClipboardCheck, label: "QA Checklist" },
] as const;

type AdminShellProps = {
  children: ReactNode;
  email: string | null;
  fullName: string | null;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
}

export function AdminShell({ children, email, fullName }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-ink">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link className="inline-flex items-center gap-2 font-bold text-ink" href="/admin">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
              <LayoutDashboard aria-hidden="true" className="h-5 w-5" />
            </span>
            SaleMap Admin
          </Link>
          <Link
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink"
            href="/app/dashboard"
          >
            <Home aria-hidden="true" className="h-5 w-5" />
            <span className="sr-only">Về app</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-80 flex-none overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 lg:block">
          <Link className="inline-flex items-center gap-2 text-xl font-bold text-ink" href="/admin">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
              <LayoutDashboard aria-hidden="true" className="h-5 w-5" />
            </span>
            SaleMap Admin
          </Link>

          <div className="mt-8 rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ocean">
              Admin
            </p>
            <p className="mt-1 truncate text-sm font-bold text-ink">
              {fullName || email || "SaleMap admin"}
            </p>
          </div>

          <nav aria-label="Admin navigation" className="mt-8 space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  className={[
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition",
                    active
                      ? "bg-mint/15 text-ocean"
                      : "text-slate-600 hover:bg-slate-50 hover:text-ink",
                  ].join(" ")}
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 space-y-3 border-t border-slate-200 pt-5">
            <Link
              className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-ink transition hover:border-ocean"
              href="/app/dashboard"
            >
              <Home aria-hidden="true" className="h-5 w-5" />
              Về app
            </Link>
            <button
              className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-70"
              disabled={isSigningOut}
              onClick={handleLogout}
              type="button"
            >
              <LogOut aria-hidden="true" className="h-5 w-5" />
              {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Admin mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {adminNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                className={[
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-bold transition",
                  active ? "bg-mint/15 text-ocean" : "text-slate-500",
                ].join(" ")}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
