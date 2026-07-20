import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProductAppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name,onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  await trackUserActivity("session_started");
  const unreadNotificationCount = await getUnreadNotificationCount();

  return (
    <AppShell
      fullName={profile.full_name || user.email?.split("@")[0] || "Bạn"}
      unreadNotificationCount={unreadNotificationCount}
      userId={user.id}
    >
      {children}
    </AppShell>
  );
}
