import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  countRowsByUser,
  getUserLabel,
  listAuthUsers,
  listProfiles,
  listUserIdRows,
  toProfileMap,
  toUserEmailMap,
} from "@/lib/admin/data/common";
import {
  distinctUserCount,
  formatPercent,
} from "@/lib/admin/data/utils";

type RecentUser = {
  createdAt?: string;
  email?: string;
  fullName?: string | null;
  id: string;
};

type RecentFeedback = {
  created_at?: string;
  feedback_type?: string;
  id: string;
  rating?: number | null;
  status?: string | null;
  title?: string | null;
  userLabel: string;
};

type RecentUpgradeInterest = {
  created_at?: string;
  expected_price?: string | null;
  id: string;
  plan_name?: string;
  status?: string | null;
  userLabel: string;
};

type RecentBetaSignup = {
  contact_status?: string | null;
  created_at?: string;
  full_name?: string;
  id: string;
  persona_label?: string | null;
};

type AdminNotificationStatRow = {
  delivered_email?: boolean | null;
  metadata?: {
    emailStatus?: string;
  } | null;
  type?: string | null;
};

function getPreviousRate(current: number, previous: number) {
  return previous > 0 ? formatPercent(current, previous) : 0;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  return date.toISOString();
}

export async function getAdminOverviewData() {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_ADMIN_DASHBOARD);

  const supabase = createSupabaseAdminClient();
  const [users, profiles] = await Promise.all([listAuthUsers(), listProfiles()]);
  const profileMap = toProfileMap(profiles);
  const emailMap = toUserEmailMap(users);

  const [
    leads,
    notes,
    reminders,
    mapSearches,
    routes,
    feedbackRows,
    upgradeRows,
    betaSignupCountResult,
    leadCountResult,
    mapSearchCountResult,
    routeCountResult,
    feedbackCountResult,
    upgradeCountResult,
    recentFeedbackResult,
    recentUpgradeResult,
    recentBetaSignupsResult,
  ] = await Promise.all([
    listUserIdRows("leads", "user_id"),
    listUserIdRows("lead_notes", "user_id"),
    listUserIdRows("reminders", "user_id"),
    listUserIdRows("map_searches", "user_id,search_type"),
    listUserIdRows("routes", "user_id"),
    listUserIdRows("beta_feedback", "user_id"),
    listUserIdRows("upgrade_interests", "user_id"),
    supabase.from("beta_signups").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("map_searches").select("id", { count: "exact", head: true }),
    supabase.from("routes").select("id", { count: "exact", head: true }),
    supabase.from("beta_feedback").select("id", { count: "exact", head: true }),
    supabase.from("upgrade_interests").select("id", { count: "exact", head: true }),
    supabase
      .from("beta_feedback")
      .select("id,user_id,feedback_type,rating,title,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("upgrade_interests")
      .select("id,user_id,plan_name,expected_price,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("beta_signups")
      .select("id,full_name,persona_label,contact_status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const { data: notificationStatsData } = await supabase
    .from("notifications")
    .select("type,delivered_email,metadata")
    .gte("created_at", startOfToday())
    .limit(10000);
  const notificationStats = (notificationStatsData ?? []) as AdminNotificationStatRow[];

  const userCount = users.length;
  const onboardingCount = profiles.filter((profile) => profile.onboarding_completed).length;
  const areaSearchUsers = new Set(
    mapSearches
      .filter((row) => row.search_type === "area_search")
      .map((row) => row.user_id)
      .filter(Boolean),
  ).size;

  const funnel = [
    { label: "Đăng ký tài khoản", users: userCount },
    { label: "Hoàn tất onboarding", users: onboardingCount },
    { label: "Tạo lead đầu tiên", users: distinctUserCount(leads) },
    { label: "Tạo note", users: distinctUserCount(notes) },
    { label: "Tạo reminder", users: distinctUserCount(reminders) },
    { label: "Tìm theo khu vực", users: areaSearchUsers },
    { label: "Search route", users: distinctUserCount(routes) },
    { label: "Gửi feedback", users: distinctUserCount(feedbackRows) },
    { label: "Quan tâm nâng cấp", users: distinctUserCount(upgradeRows) },
  ].map((item, index, items) => {
    const previous = index === 0 ? item.users : items[index - 1]?.users ?? 0;

    return {
      ...item,
      rateFromPrevious: index === 0 ? 100 : getPreviousRate(item.users, previous),
      rateFromTotal: formatPercent(item.users, userCount),
    };
  });

  const userProfiles = countRowsByUser(
    profiles.map((profile) => ({ user_id: profile.user_id })),
  );
  const recentUsers: RecentUser[] = users
    .slice()
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 5)
    .map((user) => ({
      createdAt: user.created_at,
      email: user.email,
      fullName: profileMap.get(user.id)?.full_name,
      id: user.id,
    }));

  const recentFeedback: RecentFeedback[] = ((recentFeedbackResult.data ?? []) as Array<{
    created_at?: string;
    feedback_type?: string;
    id: string;
    rating?: number | null;
    status?: string | null;
    title?: string | null;
    user_id?: string | null;
  }>).map((item) => ({
    ...item,
    userLabel: getUserLabel(item.user_id, profileMap, emailMap),
  }));

  const recentUpgradeInterests: RecentUpgradeInterest[] = ((
    recentUpgradeResult.data ?? []
  ) as Array<{
    created_at?: string;
    expected_price?: string | null;
    id: string;
    plan_name?: string;
    status?: string | null;
    user_id?: string | null;
  }>).map((item) => ({
    ...item,
    userLabel: getUserLabel(item.user_id, profileMap, emailMap),
  }));

  return {
    funnel,
    kpis: {
      betaSignups: betaSignupCountResult.count ?? 0,
      feedback: feedbackCountResult.count ?? 0,
      leads: leadCountResult.count ?? 0,
      mapSearches: mapSearchCountResult.count ?? 0,
      onboardingCompleted: onboardingCount,
      routeSearches: routeCountResult.count ?? 0,
      upgradeInterests: upgradeCountResult.count ?? 0,
      users: userCount,
      userProfiles: userProfiles.size,
      dailyDigestSentToday: notificationStats.filter(
        (item) => item.type === "daily_digest" && item.delivered_email,
      ).length,
      emailFailuresToday: notificationStats.filter(
        (item) => item.metadata?.emailStatus === "failed",
      ).length,
      reminderEmailsSentToday: notificationStats.filter(
        (item) => item.type === "reminder_due" && item.delivered_email,
      ).length,
      notificationsCreatedToday: notificationStats.length,
    },
    recent: {
      betaSignups: (recentBetaSignupsResult.data ?? []) as RecentBetaSignup[],
      feedback: recentFeedback,
      upgradeInterests: recentUpgradeInterests,
      users: recentUsers,
    },
  };
}
