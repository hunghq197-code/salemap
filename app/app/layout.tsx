import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { trackUserActivityForUser } from "@/lib/data/activity-tracking";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const AUXILIARY_DATA_TIMEOUT_MS = 900;

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function withTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = AUXILIARY_DATA_TIMEOUT_MS,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

async function getUnreadNotificationCountForUser(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

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

  void trackUserActivityForUser(user.id, "session_started");
  const unreadNotificationCount = await withTimeout(
    getUnreadNotificationCountForUser(supabase, user.id),
    0,
  );

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
