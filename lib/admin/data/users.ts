import { writeAdminAuditLog, writeSupportAccessLog } from "@/lib/admin/audit-log";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import {
  countRowsByUser,
  listAdminRoleRows,
  listAuthUsers,
  listProfiles,
  listUserIdRows,
  slicePage,
  toProfileMap,
} from "@/lib/admin/data/common";
import {
  getPaging,
  getParam,
  normalizeText,
  toListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";
import type { DailyQuotaAction } from "@/lib/constants/quota";
import { DAILY_QUOTA_LABELS, BILLING_QUOTA_ACTIONS } from "@/lib/constants/quota";
import type { SubscriptionRecord } from "@/lib/data/subscriptions";
import { getSubscriptionPlan } from "@/lib/constants/subscription-plans";
import { SafeError } from "@/lib/security/safe-error";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminUserRow = {
  accountStatus: string;
  adminRole: string;
  area: string;
  activationScore: number;
  activationStatus: string;
  createdAt?: string;
  email: string;
  feedbackCount: number;
  fullName: string;
  industry: string;
  isAdmin: boolean;
  leadCount: number;
  mapSearchCount: number;
  noteCount: number;
  onboardingCompleted: boolean;
  reminderCount: number;
  roleType: string;
  routeSearchCount: number;
  upgradeInterestCount: number;
  userId: string;
};

type UserQuotaOverride = {
  ai_daily_limit?: number | null;
  export_daily_limit?: number | null;
  import_monthly_limit?: number | null;
  lead_limit?: number | null;
  map_search_daily_limit?: number | null;
  reason?: string | null;
  route_search_daily_limit?: number | null;
  updated_at?: string | null;
};

type UserFeatureOverride = {
  enable_ai_assistant?: boolean | null;
  enable_cadences?: boolean | null;
  enable_export?: boolean | null;
  enable_import?: boolean | null;
  enable_map_discovery?: boolean | null;
  enable_route_search?: boolean | null;
  reason?: string | null;
  updated_at?: string | null;
};

type AdminActivationProgressRow = {
  activation_score?: number | null;
  applied_first_cadence?: boolean | null;
  applied_first_cadence_at?: string | null;
  completed_first_task?: boolean | null;
  completed_first_task_at?: string | null;
  created_at?: string | null;
  created_first_task?: boolean | null;
  created_first_task_at?: string | null;
  imported_leads?: boolean | null;
  imported_leads_at?: string | null;
  saved_first_lead?: boolean | null;
  saved_first_lead_at?: string | null;
  searched_map?: boolean | null;
  searched_map_at?: string | null;
  updated_at?: string | null;
  user_id: string;
  viewed_dashboard?: boolean | null;
  viewed_dashboard_at?: string | null;
};

type AdminOnboardingProfileRow = {
  completed_at?: string | null;
  created_at?: string | null;
  has_completed_onboarding?: boolean | null;
  skipped_at?: string | null;
  user_id: string;
};

export type AdminActivationDetail = {
  activationScore: number;
  appliedFirstCadence: boolean;
  appliedFirstCadenceAt?: string | null;
  completedAt?: string | null;
  completedFirstTask: boolean;
  completedFirstTaskAt?: string | null;
  completedOnboarding: boolean;
  createdAt?: string | null;
  createdFirstTask: boolean;
  createdFirstTaskAt?: string | null;
  importedLeads: boolean;
  importedLeadsAt?: string | null;
  savedFirstLead: boolean;
  savedFirstLeadAt?: string | null;
  searchedMap: boolean;
  searchedMapAt?: string | null;
  skippedAt?: string | null;
  updatedAt?: string | null;
  viewedDashboard: boolean;
  viewedDashboardAt?: string | null;
};

export type AdminUserDetail = AdminUserRow & {
  activation: AdminActivationDetail;
  aiRequestCount: number;
  cadenceCount: number;
  featureOverride: UserFeatureOverride | null;
  gatewayPaymentCount: number;
  importJobCount: number;
  lastActivityAt?: string | null;
  paymentRequestCount: number;
  quotaOverride: UserQuotaOverride | null;
  securityEventCount: number;
  subscription: (SubscriptionRecord & { planDisplayName: string }) | null;
  supportAccessCount: number;
  taskCount: number;
  usageSummary: Array<{
    actionType: DailyQuotaAction | string;
    label: string;
    limitCount: number;
    usedCount: number;
    usageDate: string;
  }>;
};

export type UserAccountStatus = "active" | "deleted" | "suspended";

function matchesDateRange(value: string | undefined, from?: string, to?: string) {
  if (!value) {
    return true;
  }

  const date = value.slice(0, 10);

  if (from && date < from) {
    return false;
  }

  if (to && date > to) {
    return false;
  }

  return true;
}

export async function getAdminUsers(params?: AdminSearchParams) {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_USERS);

  const { limit, page } = getPaging(params);
  const q = normalizeText(getParam(params, "q"));
  const role = getParam(params, "role") || "";
  const industry = getParam(params, "industry") || "";
  const onboarding = getParam(params, "onboarding") || "";
  const activation = getParam(params, "activation") || "";
  const fromDate = getParam(params, "fromDate") || "";
  const toDate = getParam(params, "toDate") || "";

  const [
    users,
    profiles,
    leads,
    notes,
    reminders,
    mapSearches,
    routes,
    feedback,
    interests,
    adminRoles,
    activationProgressRows,
    onboardingProfileRows,
  ] = await Promise.all([
    listAuthUsers(),
    listProfiles(),
    listUserIdRows("leads", "user_id"),
    listUserIdRows("lead_notes", "user_id"),
    listUserIdRows("reminders", "user_id"),
    listUserIdRows("map_searches", "user_id"),
    listUserIdRows("routes", "user_id"),
    listUserIdRows("beta_feedback", "user_id"),
    listUserIdRows("upgrade_interests", "user_id"),
    listAdminRoleRows(),
    listUserIdRows(
      "user_activation_progress",
      "user_id,activation_score,searched_map,saved_first_lead,created_first_task,applied_first_cadence,completed_first_task,imported_leads,viewed_dashboard,created_at,updated_at",
    ),
    listUserIdRows(
      "user_onboarding_profiles",
      "user_id,has_completed_onboarding,completed_at,skipped_at,created_at",
    ),
  ]);

  const profileMap = toProfileMap(profiles);
  const adminRoleMap = new Map(
    adminRoles
      .filter((row) => row.user_id && row.is_active)
      .map((row) => [row.user_id, row.role || "support"]),
  );
  const leadCounts = countRowsByUser(leads);
  const noteCounts = countRowsByUser(notes);
  const reminderCounts = countRowsByUser(reminders);
  const mapCounts = countRowsByUser(mapSearches);
  const routeCounts = countRowsByUser(routes);
  const feedbackCounts = countRowsByUser(feedback);
  const interestCounts = countRowsByUser(interests);
  const activationMap = new Map(
    (activationProgressRows as AdminActivationProgressRow[]).map((row) => [
      row.user_id,
      row,
    ]),
  );
  const onboardingProfileMap = new Map(
    (onboardingProfileRows as AdminOnboardingProfileRow[]).map((row) => [
      row.user_id,
      row,
    ]),
  );

  const rows: AdminUserRow[] = users.map((user) => {
    const profile = profileMap.get(user.id);
    const activationProgress = activationMap.get(user.id);
    const onboardingProfile = onboardingProfileMap.get(user.id);
    const activationScore = Number(activationProgress?.activation_score ?? 0);
    const onboardingCompleted = Boolean(
      profile?.onboarding_completed || onboardingProfile?.has_completed_onboarding,
    );

    return {
      accountStatus: profile?.account_status || "active",
      adminRole: adminRoleMap.get(user.id) || "",
      area: [profile?.primary_city, profile?.primary_district].filter(Boolean).join(" - "),
      activationScore,
      activationStatus:
        activationScore >= 100
          ? "score_100"
          : activationScore >= 60
            ? "score_60"
            : onboardingCompleted
              ? "onboarded_not_activated"
              : "not_onboarded",
      createdAt: user.created_at,
      email: user.email || "",
      feedbackCount: feedbackCounts.get(user.id) ?? 0,
      fullName: profile?.full_name || "",
      industry: profile?.industry || "",
      isAdmin: Boolean(adminRoleMap.get(user.id) || profile?.is_admin),
      leadCount: leadCounts.get(user.id) ?? 0,
      mapSearchCount: mapCounts.get(user.id) ?? 0,
      noteCount: noteCounts.get(user.id) ?? 0,
      onboardingCompleted,
      reminderCount: reminderCounts.get(user.id) ?? 0,
      roleType: profile?.role_type || "",
      routeSearchCount: routeCounts.get(user.id) ?? 0,
      upgradeInterestCount: interestCounts.get(user.id) ?? 0,
      userId: user.id,
    };
  });

  const filtered = rows.filter((row) => {
    if (q && !normalizeText(`${row.email} ${row.fullName}`).includes(q)) {
      return false;
    }

    if (role && row.roleType !== role) {
      return false;
    }

    if (industry && row.industry !== industry) {
      return false;
    }

    if (onboarding === "true" && !row.onboardingCompleted) {
      return false;
    }

    if (onboarding === "false" && row.onboardingCompleted) {
      return false;
    }

    if (activation === "not_onboarded" && row.onboardingCompleted) {
      return false;
    }

    if (
      activation === "onboarded_not_activated" &&
      (!row.onboardingCompleted || row.activationScore >= 60)
    ) {
      return false;
    }

    if (activation === "score_60" && row.activationScore < 60) {
      return false;
    }

    if (activation === "score_100" && row.activationScore !== 100) {
      return false;
    }

    return matchesDateRange(row.createdAt, fromDate, toDate);
  });

  const sorted = filtered.sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
  );

  return {
    filters: {
      industries: Array.from(new Set(rows.map((row) => row.industry).filter(Boolean))).sort(),
      roles: Array.from(new Set(rows.map((row) => row.roleType).filter(Boolean))).sort(),
    },
    result: toListResult(slicePage(sorted, page, limit), sorted.length, page, limit),
    selectedUser: getParam(params, "selectedUser")
      ? sorted.find((row) => row.userId === getParam(params, "selectedUser")) ?? null
      : null,
  };
}

function latestDate(...values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a))[0] ?? null;
}

async function getLatestSubscription(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const subscription = data as SubscriptionRecord;
  const plan = getSubscriptionPlan(subscription.plan_key);

  return {
    ...subscription,
    planDisplayName: plan.name,
  };
}

async function getMaybeSingle<T>(table: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as T;
}

function buildActivationDetail(
  progress: AdminActivationProgressRow | null,
  onboarding: AdminOnboardingProfileRow | null,
  onboardingCompleted: boolean,
): AdminActivationDetail {
  return {
    activationScore: Number(progress?.activation_score ?? 0),
    appliedFirstCadence: Boolean(progress?.applied_first_cadence),
    appliedFirstCadenceAt: progress?.applied_first_cadence_at ?? null,
    completedAt: onboarding?.completed_at ?? null,
    completedFirstTask: Boolean(progress?.completed_first_task),
    completedFirstTaskAt: progress?.completed_first_task_at ?? null,
    completedOnboarding: onboardingCompleted,
    createdAt: progress?.created_at ?? onboarding?.created_at ?? null,
    createdFirstTask: Boolean(progress?.created_first_task),
    createdFirstTaskAt: progress?.created_first_task_at ?? null,
    importedLeads: Boolean(progress?.imported_leads),
    importedLeadsAt: progress?.imported_leads_at ?? null,
    savedFirstLead: Boolean(progress?.saved_first_lead),
    savedFirstLeadAt: progress?.saved_first_lead_at ?? null,
    searchedMap: Boolean(progress?.searched_map),
    searchedMapAt: progress?.searched_map_at ?? null,
    skippedAt: onboarding?.skipped_at ?? null,
    updatedAt: progress?.updated_at ?? null,
    viewedDashboard: Boolean(progress?.viewed_dashboard),
    viewedDashboardAt: progress?.viewed_dashboard_at ?? null,
  };
}

async function getUsageSummary(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("daily_usage_limits")
    .select("action_type,usage_date,used_count,limit_count")
    .eq("user_id", userId)
    .order("usage_date", { ascending: false })
    .limit(50);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<{
    action_type?: string | null;
    limit_count?: number | null;
    usage_date?: string | null;
    used_count?: number | null;
  }>).map((row) => {
    const actionType = row.action_type || "";

    return {
      actionType,
      label:
        DAILY_QUOTA_LABELS[actionType as DailyQuotaAction]?.label ||
        actionType ||
        "Không rõ",
      limitCount: Number(row.limit_count ?? 0),
      usedCount: Number(row.used_count ?? 0),
      usageDate: row.usage_date || "",
    };
  });
}

export async function getAdminUserDetail(
  userId: string,
  options?: { reason?: string | null },
): Promise<AdminUserDetail | null> {
  const admin = await requirePermission(ADMIN_PERMISSIONS.VIEW_USER_DETAIL);

  if (!userId) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const [
    users,
    profiles,
    adminRoles,
    leads,
    notes,
    reminders,
    mapSearches,
    routes,
    feedback,
    interests,
    tasks,
    cadences,
    importJobs,
    aiRequests,
    paymentRequests,
    gatewayPayments,
    securityEvents,
    supportLogs,
    subscription,
    quotaOverride,
    featureOverride,
    usageSummary,
    activationProgress,
    onboardingProgress,
  ] = await Promise.all([
    listAuthUsers(),
    listProfiles(),
    listAdminRoleRows(),
    listUserIdRows("leads", "user_id,created_at"),
    listUserIdRows("lead_notes", "user_id,created_at"),
    listUserIdRows("reminders", "user_id,created_at"),
    listUserIdRows("map_searches", "user_id,created_at"),
    listUserIdRows("routes", "user_id,created_at"),
    listUserIdRows("beta_feedback", "user_id,created_at"),
    listUserIdRows("upgrade_interests", "user_id,created_at"),
    listUserIdRows("tasks", "user_id,created_at"),
    listUserIdRows("lead_cadences", "user_id,created_at"),
    listUserIdRows("import_jobs", "user_id,created_at"),
    listUserIdRows("ai_requests", "user_id,created_at"),
    listUserIdRows("payment_requests", "user_id,created_at"),
    listUserIdRows("payment_gateway_transactions", "user_id,created_at"),
    listUserIdRows("security_events", "user_id,created_at"),
    listUserIdRows("support_access_logs", "target_user_id,created_at"),
    getLatestSubscription(userId),
    getMaybeSingle<UserQuotaOverride>("user_quota_overrides", userId),
    getMaybeSingle<UserFeatureOverride>("user_feature_overrides", userId),
    getUsageSummary(userId),
    getMaybeSingle<AdminActivationProgressRow>("user_activation_progress", userId),
    getMaybeSingle<AdminOnboardingProfileRow>("user_onboarding_profiles", userId),
  ]);

  const authUser = users.find((user) => user.id === userId);

  if (!authUser) {
    return null;
  }

  const profileMap = toProfileMap(profiles);
  const profile = profileMap.get(userId);
  const onboardingCompleted = Boolean(
    profile?.onboarding_completed || onboardingProgress?.has_completed_onboarding,
  );
  const activationScore = Number(activationProgress?.activation_score ?? 0);
  const adminRole = adminRoles.find((row) => row.user_id === userId && row.is_active);
  const ownRows = (rows: Array<{ user_id?: string | null; [key: string]: unknown }>) =>
    rows.filter((row) => row.user_id === userId);
  const ownSupportRows = supportLogs.filter(
    (row) => String(row.target_user_id || "") === userId,
  );
  const sumUsage = (actionTypes: string[]) =>
    usageSummary
      .filter((row) => actionTypes.includes(String(row.actionType)))
      .reduce((total, row) => total + row.usedCount, 0);
  const rowDates = [
    ...ownRows(leads),
    ...ownRows(notes),
    ...ownRows(reminders),
    ...ownRows(mapSearches),
    ...ownRows(routes),
    ...ownRows(tasks),
    ...ownRows(cadences),
    ...ownRows(importJobs),
    ...ownRows(aiRequests),
    ...ownRows(paymentRequests),
  ].map((row) => String(row.created_at || ""));

  await writeSupportAccessLog({
    accessType: "view_user_detail",
    actorUserId: admin.userId,
    metadata: {
      viewerRole: admin.role,
    },
    reason: options?.reason || "admin_user_detail",
    targetUserId: userId,
  });

  return {
    accountStatus: profile?.account_status || "active",
    activation: buildActivationDetail(
      activationProgress,
      onboardingProgress,
      onboardingCompleted,
    ),
    activationScore,
    activationStatus:
      activationScore >= 100
        ? "score_100"
        : activationScore >= 60
          ? "score_60"
          : onboardingCompleted
            ? "onboarded_not_activated"
            : "not_onboarded",
    adminRole: adminRole?.role || "",
    aiRequestCount: ownRows(aiRequests).length,
    area: [profile?.primary_city, profile?.primary_district].filter(Boolean).join(" - "),
    cadenceCount: ownRows(cadences).length,
    createdAt: authUser.created_at,
    email: authUser.email || "",
    featureOverride,
    feedbackCount: ownRows(feedback).length,
    fullName: profile?.full_name || "",
    gatewayPaymentCount: ownRows(gatewayPayments).length,
    importJobCount: ownRows(importJobs).length,
    industry: profile?.industry || "",
    isAdmin: Boolean(adminRole?.role || profile?.is_admin),
    lastActivityAt: latestDate(...rowDates),
    leadCount: ownRows(leads).length,
    mapSearchCount: Math.max(
      ownRows(mapSearches).length,
      sumUsage(["near_me_search", "area_search"]),
    ),
    noteCount: ownRows(notes).length,
    onboardingCompleted,
    paymentRequestCount: ownRows(paymentRequests).length,
    quotaOverride,
    reminderCount: ownRows(reminders).length,
    roleType: profile?.role_type || "",
    routeSearchCount: Math.max(ownRows(routes).length, sumUsage(["route_search"])),
    securityEventCount: ownRows(securityEvents).length,
    subscription,
    supportAccessCount: ownSupportRows.length,
    taskCount: ownRows(tasks).length,
    upgradeInterestCount: ownRows(interests).length,
    usageSummary: usageSummary.filter((row) =>
      BILLING_QUOTA_ACTIONS.includes(row.actionType as DailyQuotaAction),
    ),
    userId,
  };
}

export async function updateAdminUserAccountStatus(
  userId: string,
  status: UserAccountStatus,
  request?: Request,
) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_USER_STATUS);

  if (!userId || !["active", "suspended", "deleted"].includes(status)) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  if (admin.userId === userId && status !== "active") {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("user_profiles").upsert(
    {
      account_status: status,
      updated_at: now,
      user_id: userId,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new SafeError("UNKNOWN_ERROR", 500);
  }

  await writeAdminAuditLog({
    action: "user_status_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      status,
    },
    request,
    severity: status === "active" ? "info" : "warning",
    targetId: userId,
    targetType: "user",
  });

  return {
    status,
    userId,
  };
}
