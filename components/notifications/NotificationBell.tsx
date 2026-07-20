"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

type NotificationBellProps = {
  unreadCount?: number;
};

export function NotificationBell({ unreadCount = 0 }: NotificationBellProps) {
  const countLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink transition hover:border-ocean hover:text-ocean"
      href="/app/notifications"
    >
      <Bell aria-hidden="true" className="h-5 w-5" />
      <span className="sr-only">Thông báo</span>
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white">
          {countLabel}
        </span>
      ) : null}
    </Link>
  );
}
