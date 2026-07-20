import { requireAdmin } from "@/lib/admin/auth";
import {
  getPaging,
  getParam,
  toListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const HEALTH_LABEL_OPTIONS = [
  "high_intent",
  "active",
  "activated",
  "at_risk",
  "inactive",
  "unknown",
] as const;

export const RECOMMENDED_ACTION_OPTIONS = [
  "invite_interview",
  "ask_feedback",
  "offer_help",
  "monitor",
  "not_priority",
] as const;

type ActivityRow = {
  active_score?: number | null;
  activity_date?: string;
  area_searches?: number | null;
  feedback_submitted?: number | null;
  lead_notes_created?: number | null;
  leads_created?: number | null;
  map_places_saved?: number | null;
  near_me_searches?: number | null;
  reminders_completed?: number | null;
  reminders_created?: number | null;
  route_searches?: number | null;
  upgrade_interest_submitted?: number | null;
};

export type UserHealthScoreRow = {
  activation_completed?: boolean | null;
  core_loop_completed?: boolean | null;
  days_active_14d?: number | null;
  days_active_7d?: number | null;
  feedback_count?: number | null;
  first_active_at?: string | null;
  health_label?: string | null;
  health_score?: number | null;
  industry?: string | null;
  last_active_at?: string | null;
  leads_created_total?: number | null;
  monetization_signal?: boolean | null;
  notes_created_total?: number | null;
  recommended_action?: string | null;
  reminders_completed_total?: number | null;
  reminders_created_total?: number | null;
  retention_signal?: boolean | null;
  role_type?: string | null;
  route_searches_total?: number | null;
  saved_map_leads_total?: number | null;
  searches_total?: number | null;
  upgrade_interest_count?: number | null;
  userEmail?: string | null;
  userLabel: string;
  user_id: string;
};

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function isoDate(days: number) {
  return daysAgo(days).toISOString().slice(0, 10);
}

function sum(rows: ActivityRow[], key: keyof ActivityRow) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function cap(value: number, max: number) {
  return Math.min(max, value);
}

async function countRows(
  table: string,
  userId: string,
  configure?: (query: any) => any,
) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (configure) {
    query = configure(query);
  }

  const { count, error } = await query;

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function getQuotaReachedCount(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("daily_usage_limits")
    .select("used_count,limit_count")
    .eq("user_id", userId)
    .gte("usage_date", isoDate(14))
    .limit(1000);

  if (error) {
    return 0;
  }

  return ((data ?? []) as Array<{ limit_count?: number; used_count?: number }>).filter(
    (row) => Number(row.used_count ?? 0) >= Number(row.limit_count ?? 1),
  ).length;
}

function getHealthLabel(params: {
  coreActionTotal: number;
  daysActive14d: number;
  daysActive7d: number;
  healthScore: number;
  upgradeInterestCount: number;
}) {
  if (params.upgradeInterestCount > 0 || params.healthScore >= 75) {
    return "high_intent";
  }

  if (params.healthScore >= 50) {
    return "active";
  }

  if (params.healthScore >= 30) {
    return "activated";
  }

  if (params.daysActive14d > 0 && params.daysActive7d === 0) {
    return "at_risk";
  }

  if (params.coreActionTotal === 0 || params.daysActive14d === 0) {
    return "inactive";
  }

  return "unknown";
}

function getRecommendedAction(params: {
  feedbackCount: number;
  healthLabel: string;
}) {
  if (params.healthLabel === "high_intent") {
    return "invite_interview";
  }

  if (params.healthLabel === "at_risk" || params.healthLabel === "inactive") {
    return "offer_help";
  }

  if (params.feedbackCount === 0 && params.healthLabel === "activated") {
    return "ask_feedback";
  }

  if (params.healthLabel === "active") {
    return "monitor";
  }

  return "not_priority";
}

export async function calculateUserHealthScore(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: activityData } = await supabase
    .from("user_activity_daily")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", isoDate(14))
    .order("activity_date", { ascending: true });
  const activityRows = (activityData ?? []) as ActivityRow[];
  const activeRows = activityRows.filter((row) => Number(row.active_score ?? 0) > 0);
  const activeRows7d = activeRows.filter(
    (row) => String(row.activity_date ?? "") >= isoDate(7),
  );

  const [
    leadsTotal,
    notesTotal,
    remindersTotal,
    remindersCompletedTotal,
    areaSearchesTotal,
    nearMeSearchesTotal,
    routeSearchesTotal,
    savedMapLeadsTotal,
    feedbackCount,
    upgradeInterestCount,
    quotaReachedCount,
  ] = await Promise.all([
    countRows("leads", userId, (query) => query.is("deleted_at", null)),
    countRows("lead_notes", userId, (query) => query.is("deleted_at", null)),
    countRows("reminders", userId, (query) => query.is("deleted_at", null)),
    countRows("reminders", userId, (query) =>
      query.eq("status", "done").is("deleted_at", null),
    ),
    countRows("map_searches", userId, (query) => query.eq("search_type", "area_search")),
    countRows("map_searches", userId, (query) =>
      query.eq("search_type", "near_me_search"),
    ),
    countRows("routes", userId),
    countRows("leads", userId, (query) => query.not("place_id", "is", null)),
    countRows("beta_feedback", userId),
    countRows("upgrade_interests", userId),
    getQuotaReachedCount(userId),
  ]);

  const activityLeads = sum(activityRows, "leads_created");
  const activityNotes = sum(activityRows, "lead_notes_created");
  const activityReminders = sum(activityRows, "reminders_created");
  const activityCompletedReminders = sum(activityRows, "reminders_completed");
  const activityAreaSearches = sum(activityRows, "area_searches");
  const activityRouteSearches = sum(activityRows, "route_searches");
  const activitySavedMapLeads = sum(activityRows, "map_places_saved");
  const activityFeedback = sum(activityRows, "feedback_submitted");
  const activityUpgrade = sum(activityRows, "upgrade_interest_submitted");

  const leads = Math.max(leadsTotal, activityLeads);
  const notes = Math.max(notesTotal, activityNotes);
  const reminders = Math.max(remindersTotal, activityReminders);
  const remindersCompleted = Math.max(
    remindersCompletedTotal,
    activityCompletedReminders,
  );
  const areaSearches = Math.max(areaSearchesTotal, activityAreaSearches);
  const routeSearches = Math.max(routeSearchesTotal, activityRouteSearches);
  const savedMapLeads = Math.max(savedMapLeadsTotal, activitySavedMapLeads);
  const feedback = Math.max(feedbackCount, activityFeedback);
  const upgradeInterests = Math.max(upgradeInterestCount, activityUpgrade);
  const searchesTotal = areaSearches + nearMeSearchesTotal + routeSearches;

  const score = Math.min(
    100,
    activeRows7d.length * 5 +
      cap(leads * 4, 20) +
      cap(notes * 3, 15) +
      cap(reminders * 3, 15) +
      cap(remindersCompleted * 4, 20) +
      cap(areaSearches * 2, 10) +
      cap(routeSearches * 4, 20) +
      cap(savedMapLeads * 4, 20) +
      (feedback > 0 ? 10 : 0) +
      (upgradeInterests > 0 ? 20 : 0),
  );
  const coreLoopCompleted = leads > 0 && notes > 0 && reminders > 0;
  const retentionSignal = activeRows7d.length >= 2;
  const monetizationSignal = upgradeInterests > 0 || quotaReachedCount >= 2;
  const healthLabel = getHealthLabel({
    coreActionTotal: leads + notes + reminders + searchesTotal,
    daysActive14d: activeRows.length,
    daysActive7d: activeRows7d.length,
    healthScore: score,
    upgradeInterestCount: upgradeInterests,
  });
  const now = new Date().toISOString();
  const payload = {
    activation_completed: leads > 0,
    calculated_at: now,
    core_loop_completed: coreLoopCompleted,
    days_active_14d: activeRows.length,
    days_active_7d: activeRows7d.length,
    feedback_count: feedback,
    first_active_at: activeRows[0]?.activity_date
      ? `${activeRows[0].activity_date}T00:00:00.000Z`
      : null,
    health_label: healthLabel,
    health_score: score,
    last_active_at: activeRows[activeRows.length - 1]?.activity_date
      ? `${activeRows[activeRows.length - 1].activity_date}T23:59:59.999Z`
      : null,
    leads_created_total: leads,
    monetization_signal: monetizationSignal,
    notes_created_total: notes,
    recommended_action: getRecommendedAction({
      feedbackCount: feedback,
      healthLabel,
    }),
    reminders_completed_total: remindersCompleted,
    reminders_created_total: reminders,
    retention_signal: retentionSignal,
    route_searches_total: routeSearches,
    saved_map_leads_total: savedMapLeads,
    searches_total: searchesTotal,
    updated_at: now,
    upgrade_interest_count: upgradeInterests,
    user_id: userId,
  };
  const { error } = await supabase
    .from("user_health_scores")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw new Error(error.message);
  }

  return payload;
}

export async function calculateAllUserHealthScores() {
  const supabase = createSupabaseAdminClient();
  const [{ data: authData }, { data: profileData }, { data: activityData }] =
    await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabase.from("user_profiles").select("user_id").limit(10000),
      supabase.from("user_activity_daily").select("user_id").limit(10000),
    ]);
  const userIds = new Set<string>();

  (authData?.users ?? []).forEach((user) => userIds.add(user.id));
  ((profileData ?? []) as Array<{ user_id?: string }>).forEach((row) => {
    if (row.user_id) userIds.add(row.user_id);
  });
  ((activityData ?? []) as Array<{ user_id?: string }>).forEach((row) => {
    if (row.user_id) userIds.add(row.user_id);
  });

  let processed = 0;

  for (const userId of Array.from(userIds)) {
    try {
      await calculateUserHealthScore(userId);
      processed += 1;
    } catch (error) {
      console.error("Calculate user health failed", { error, userId });
    }
  }

  return { processed };
}

export async function getUserHealthScores(params?: AdminSearchParams) {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { limit, page } = getPaging(params);
  const healthLabel = getParam(params, "healthLabel") || "";
  const role = getParam(params, "role") || "";
  const industry = getParam(params, "industry") || "";
  const action = getParam(params, "recommendedAction") || "";
  const active7d = getParam(params, "active7d") === "true";
  const coreLoop = getParam(params, "coreLoop") === "true";
  const hasUpgrade = getParam(params, "hasUpgrade") === "true";

  const [scoresResult, profilesResult, usersResult] = await Promise.all([
    supabase
      .from("user_health_scores")
      .select("*")
      .order("health_score", { ascending: false })
      .limit(10000),
    supabase
      .from("user_profiles")
      .select("user_id,full_name,role_type,industry")
      .limit(10000),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const profiles = (profilesResult.data ?? []) as Array<{
    full_name?: string | null;
    industry?: string | null;
    role_type?: string | null;
    user_id: string;
  }>;
  const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const emailMap = new Map(
    (usersResult.data?.users ?? []).map((user) => [user.id, user.email ?? ""]),
  );
  let rows = ((scoresResult.data ?? []) as Array<Omit<UserHealthScoreRow, "userLabel">>).map(
    (score) => {
      const profile = profileMap.get(score.user_id);
      const email = emailMap.get(score.user_id);

      return {
        ...score,
        industry: profile?.industry ?? null,
        role_type: profile?.role_type ?? null,
        userEmail: email ?? null,
        userLabel: profile?.full_name || email || score.user_id,
      } satisfies UserHealthScoreRow;
    },
  );

  rows = rows.filter((row) => {
    if (healthLabel && row.health_label !== healthLabel) return false;
    if (role && row.role_type !== role) return false;
    if (industry && row.industry !== industry) return false;
    if (action && row.recommended_action !== action) return false;
    if (active7d && Number(row.days_active_7d ?? 0) <= 0) return false;
    if (coreLoop && !row.core_loop_completed) return false;
    if (hasUpgrade && Number(row.upgrade_interest_count ?? 0) <= 0) return false;

    return true;
  });

  const total = rows.length;
  const items = rows.slice((page - 1) * limit, page * limit);
  const kpis = {
    activatedUsers: rows.filter((row) => row.activation_completed).length,
    atRiskUsers: rows.filter((row) => row.health_label === "at_risk").length,
    coreLoopUsers: rows.filter((row) => row.core_loop_completed).length,
    d1ActiveUsers: rows.filter((row) => Number(row.days_active_14d ?? 0) >= 1).length,
    d7RetainedUsers: rows.filter((row) => Number(row.days_active_7d ?? 0) >= 2)
      .length,
    highIntentUsers: rows.filter((row) => row.health_label === "high_intent").length,
    inactiveUsers: rows.filter((row) => row.health_label === "inactive").length,
    usersWithUpgradeInterest: rows.filter(
      (row) => Number(row.upgrade_interest_count ?? 0) > 0,
    ).length,
  };
  const insights = {
    atRisk: rows
      .filter((row) => row.health_label === "at_risk" || row.health_label === "inactive")
      .slice(0, 5),
    highIntent: rows.filter((row) => row.health_label === "high_intent").slice(0, 5),
    leadNoReminder: rows
      .filter(
        (row) =>
          Number(row.leads_created_total ?? 0) > 0 &&
          Number(row.reminders_created_total ?? 0) === 0,
      )
      .slice(0, 5),
    routeNoSave: rows
      .filter(
        (row) =>
          Number(row.route_searches_total ?? 0) > 0 &&
          Number(row.saved_map_leads_total ?? 0) === 0,
      )
      .slice(0, 5),
    upgradeSignals: rows
      .filter((row) => row.monetization_signal && Number(row.upgrade_interest_count ?? 0) === 0)
      .slice(0, 5),
  };

  return {
    filters: {
      healthLabels: HEALTH_LABEL_OPTIONS,
      recommendedActions: RECOMMENDED_ACTION_OPTIONS,
    },
    insights,
    kpis,
    result: toListResult(items, total, page, limit),
  };
}
