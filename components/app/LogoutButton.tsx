"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackLogoutClicked } from "@/lib/analytics/client";
import { clearUserOfflineData } from "@/lib/offline/clear-user-offline-data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    trackLogoutClicked();

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
    <button
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isSigningOut}
      onClick={handleLogout}
      type="button"
    >
      <LogOut aria-hidden="true" className="h-4 w-4" />
      {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
}
