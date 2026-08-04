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

type RecentSupportTicket = {
  created_at?: string | null;
  id: string;
  priority?: string | null;
  status?: string | null;
  subject?: string | null;
  ticket_code?: string | null;
  userLabel: string;
};

type RecentAdminAuditLog = {
  action?: string | null;
  actor_role?: string | null;
  created_at?: string | null;
  id: string;
  severity?: string | null;
  target_id?: string | null;
  target_type?: string | null;
};

export type AdminOverviewAlert = {
  ctaHref?: string;
  ctaLabel?: string;
  description: string;
  severity: "critical" | "info" | "warning";
  source: string;
  status: string;
  time?: string | null;
  title: string;
};

type AdminNotificationStatRow = {
  delivered_email?: boolean | null;
  metadata?: {
    emailStatus?: string;
  } | null;
  type?: string | null;
};

type AdminSupportTicketStatRow = {
  first_response_at?: string | null;
  first_response_due_at?: string | null;
  resolution_due_at?: string | null;
  status?: string | null;
};

function getPreviousRate(current: number, previous: number) {
  return previous > 0 ? formatPercent(current, previous) : 0;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  return date.toISOString();
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function addCountAlert(
  alerts: AdminOverviewAlert[],
  input: Omit<AdminOverviewAlert, "description" | "title"> & {
    count: number;
    description: string;
    title: string;
  },
) {
  if (input.count <= 0) return;

  alerts.push({
    ctaHref: input.ctaHref,
    ctaLabel: input.ctaLabel,
    description: input.description,
    severity: input.severity,
    source: input.source,
    status: input.status,
    time: input.time,
    title: input.title,
  });
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
    activePaidSubscriptionsResult,
    pendingPaymentsResult,
    paidPaymentsResult,
    recentFeedbackResult,
    recentUpgradeResult,
    recentBetaSignupsResult,
    supportTicketsResult,
    recentSupportTicketsResult,
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
      .from("subscriptions")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "active")
      .in("plan_key", ["pro", "pro_plus"]),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "processing", "waiting_confirmation"]),
    supabase.from("payments").select("amount,status").eq("status", "paid").limit(10000),
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
    supabase
      .from("support_tickets")
      .select("id,status,first_response_due_at,resolution_due_at,first_response_at")
      .limit(10000),
    supabase
      .from("support_tickets")
      .select("id,ticket_code,user_id,subject,status,priority,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const { data: notificationStatsData } = await supabase
    .from("notifications")
    .select("type,delivered_email,metadata")
    .gte("created_at", startOfToday())
    .limit(10000);
  const [
    unresolvedSecurityEventsResult,
    recentCriticalSecurityEventsResult,
    failedImportJobsResult,
    failedPaymentsResult,
    expiringSubscriptionsResult,
    suspendedUsersResult,
    recentAuditLogsResult,
  ] = await Promise.all([
    supabase
      .from("security_events")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false),
    supabase
      .from("security_events")
      .select("id,event_type,severity,created_at")
      .eq("resolved", false)
      .in("severity", ["critical", "warning"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("import_jobs")
      .select("id,status,created_at,updated_at", { count: "exact" })
      .eq("status", "failed")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("payments")
      .select("id,status,provider,created_at,updated_at", { count: "exact" })
      .eq("status", "failed")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("subscriptions")
      .select("id,user_id,status,current_period_end", { count: "exact" })
      .eq("status", "active")
      .not("current_period_end", "is", null)
      .lte("current_period_end", daysFromNow(7))
      .order("current_period_end", { ascending: true })
      .limit(5),
    supabase
      .from("user_profiles")
      .select("user_id,full_name,account_status,updated_at", { count: "exact" })
      .eq("account_status", "suspended")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("admin_audit_logs")
      .select("id,actor_role,action,target_type,target_id,severity,created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const notificationStats = (notificationStatsData ?? []) as AdminNotificationStatRow[];
  const supportTicketStats = (supportTicketsResult.data ?? []) as AdminSupportTicketStatRow[];
  const now = Date.now();
  const openSupportTickets = supportTicketStats.filter(
    (ticket) => !["cancelled", "closed", "resolved"].includes(ticket.status || ""),
  );
  const breachedSupportTickets = openSupportTickets.filter((ticket) => {
    const firstResponseDue = ticket.first_response_due_at
      ? new Date(ticket.first_response_due_at).getTime()
      : null;
    const resolutionDue = ticket.resolution_due_at
      ? new Date(ticket.resolution_due_at).getTime()
      : null;

    return (
      (!ticket.first_response_at && Boolean(firstResponseDue && firstResponseDue < now)) ||
      Boolean(resolutionDue && resolutionDue < now)
    );
  });

  const userCount = users.length;
  const activeUsers = Math.max(
    0,
    userCount - Number(suspendedUsersResult.count ?? 0),
  );
  const newUsers7d = users.filter((user) => {
    const createdAt = user.created_at;

    return Boolean(createdAt && createdAt >= daysAgo(7));
  }).length;
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

  const recentSupportTickets: RecentSupportTicket[] = ((
    recentSupportTicketsResult.data ?? []
  ) as Array<{
    created_at?: string | null;
    id: string;
    priority?: string | null;
    status?: string | null;
    subject?: string | null;
    ticket_code?: string | null;
    user_id?: string | null;
  }>).map((item) => ({
    ...item,
    userLabel: getUserLabel(item.user_id, profileMap, emailMap),
  }));
  const failedImportJobs = failedImportJobsResult.count ?? 0;
  const failedPayments = failedPaymentsResult.count ?? 0;
  const emailFailuresToday = notificationStats.filter(
    (item) => item.metadata?.emailStatus === "failed",
  ).length;
  const operationFailures = failedImportJobs + failedPayments + emailFailuresToday;
  const unresolvedSecurityEvents = unresolvedSecurityEventsResult.count ?? 0;
  const alerts: AdminOverviewAlert[] = [];

  addCountAlert(alerts, {
    count: pendingPaymentsResult.count ?? 0,
    ctaHref: "/admin/payments?status=waiting_confirmation",
    ctaLabel: "Mo payment queue",
    description: `${pendingPaymentsResult.count ?? 0} payment dang can doi soat hoac xac nhan.`,
    severity: "warning",
    source: "payments",
    status: "waiting",
    title: "Payment dang cho xu ly",
  });
  addCountAlert(alerts, {
    count: unresolvedSecurityEvents,
    ctaHref: "/admin/security-events?resolved=false",
    ctaLabel: "Mo security events",
    description: `${unresolvedSecurityEvents} security event chua duoc review.`,
    severity: unresolvedSecurityEvents > 5 ? "critical" : "warning",
    source: "security",
    status: "open",
    title: "Security events chua xu ly",
  });
  addCountAlert(alerts, {
    count: failedImportJobs,
    ctaHref: "/admin/imports?status=failed",
    ctaLabel: "Mo import jobs",
    description: `${failedImportJobs} import job dang o trang thai failed.`,
    severity: "warning",
    source: "import",
    status: "failed",
    title: "Import job failed",
  });
  addCountAlert(alerts, {
    count: failedPayments,
    ctaHref: "/admin/payments?status=failed",
    ctaLabel: "Mo failed payments",
    description: `${failedPayments} payment failed can kiem tra neu co user lien he.`,
    severity: "warning",
    source: "payments",
    status: "failed",
    title: "Payment failed",
  });
  addCountAlert(alerts, {
    count: expiringSubscriptionsResult.count ?? 0,
    ctaHref: "/admin/subscriptions?expiring=soon",
    ctaLabel: "Mo subscriptions",
    description: `${expiringSubscriptionsResult.count ?? 0} subscription active sap het han trong 7 ngay.`,
    severity: "info",
    source: "subscriptions",
    status: "expiring",
    title: "Subscription sap het han",
  });
  addCountAlert(alerts, {
    count: suspendedUsersResult.count ?? 0,
    ctaHref: "/admin/users?accountStatus=suspended",
    ctaLabel: "Mo users",
    description: `${suspendedUsersResult.count ?? 0} user dang bi khoa tai khoan.`,
    severity: "info",
    source: "users",
    status: "suspended",
    title: "User dang suspended",
  });
  addCountAlert(alerts, {
    count: process.env.CRON_SECRET?.trim() ? 0 : 1,
    ctaHref: "/admin/system",
    ctaLabel: "Mo system health",
    description: "CRON_SECRET dang missing, cac cron route production se khong duoc bao ve/cau hinh dung.",
    severity: "critical",
    source: "system",
    status: "missing_config",
    title: "Missing CRON_SECRET",
  });

  const criticalSecurityAlerts = ((recentCriticalSecurityEventsResult.data ?? []) as Array<{
    created_at?: string | null;
    event_type?: string | null;
    id: string;
    severity?: string | null;
  }>).map((event) => ({
    ctaHref: "/admin/security-events?resolved=false",
    ctaLabel: "Review",
    description: `Event type: ${event.event_type || "unknown"}. Metadata da duoc sanitize trong detail list.`,
    severity: event.severity === "critical" ? "critical" as const : "warning" as const,
    source: "security",
    status: "open",
    time: event.created_at,
    title: "Security event can review",
  }));
  const recentAuditLogs = (recentAuditLogsResult.data ?? []) as RecentAdminAuditLog[];

  return {
    funnel,
    alerts: [...criticalSecurityAlerts, ...alerts].slice(0, 8),
    operationKpis: {
      activePaidSubscriptions: activePaidSubscriptionsResult.count ?? 0,
      activeUsers,
      newUsers7d,
      operationFailures,
      pendingPayments: pendingPaymentsResult.count ?? 0,
      unresolvedSecurityEvents,
    },
    kpis: {
      activePaidCustomers: activePaidSubscriptionsResult.count ?? 0,
      betaSignups: betaSignupCountResult.count ?? 0,
      feedback: feedbackCountResult.count ?? 0,
      leads: leadCountResult.count ?? 0,
      mapSearches: mapSearchCountResult.count ?? 0,
      onboardingCompleted: onboardingCount,
      openSupportTickets: openSupportTickets.length,
      paidRevenue: ((paidPaymentsResult.data ?? []) as Array<{
        amount?: number | null;
      }>).reduce((total, row) => total + Number(row.amount ?? 0), 0),
      pendingPayments: pendingPaymentsResult.count ?? 0,
      routeSearches: routeCountResult.count ?? 0,
      breachedSupportTickets: breachedSupportTickets.length,
      upgradeInterests: upgradeCountResult.count ?? 0,
      users: userCount,
      userProfiles: userProfiles.size,
      dailyDigestSentToday: notificationStats.filter(
        (item) => item.type === "daily_digest" && item.delivered_email,
      ).length,
      emailFailuresToday,
      reminderEmailsSentToday: notificationStats.filter(
        (item) => item.type === "reminder_due" && item.delivered_email,
      ).length,
      notificationsCreatedToday: notificationStats.length,
    },
    recent: {
      betaSignups: (recentBetaSignupsResult.data ?? []) as RecentBetaSignup[],
      feedback: recentFeedback,
      auditLogs: recentAuditLogs,
      supportTickets: recentSupportTickets,
      upgradeInterests: recentUpgradeInterests,
      users: recentUsers,
    },
  };
}
