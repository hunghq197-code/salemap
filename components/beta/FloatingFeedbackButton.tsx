"use client";

import { MessageSquareHeart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingFeedbackButton() {
  const pathname = usePathname();

  if (pathname === "/app/feedback") {
    return null;
  }

  const href = `/app/feedback?from=${encodeURIComponent(pathname)}`;

  return (
    <Link
      className="fixed bottom-24 right-4 z-40 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-ocean lg:bottom-6 lg:right-6 lg:px-5"
      href={href}
    >
      <MessageSquareHeart aria-hidden="true" className="h-5 w-5" />
      <span className="sm:hidden">Góp ý</span>
      <span className="hidden sm:inline">Gửi góp ý</span>
    </Link>
  );
}
