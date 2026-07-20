import {
  createAdminDataClient,
  getPaging,
  toListResult,
  type AdminListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";

export type AdminSalesAnalyticsKpis = {
  activeGoals: number;
  averageFollowupsCompleted30d: number;
  averageLeadsCreated30d: number;
  goalsCompleted: number;
  goalsCreated: number;
  pipelineStatusChangesToday: number;
  usersWithAnalyticsData: number;
};

export type AdminSalesAnalyticsUserRow = {
  activeGoals: number;
  completedGoals: number;
  followupsCompleted30d: number;
  goalsCount: number;
  lastAnalyticsActivity: string | null;
  leadsCreated30d: number;
  userId: string;
  userLabel: string;
  wonLeads30d: number;
};

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfTodayIso() {
  return `${dateOnly(new Date())}T00:00:00.000Z`;
}

function thirtyDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return dateOnly(date);
}

function inc(map: Map<string, number>, userId: string, amount = 1) {
  map.set(userId, (map.get(userId) ?? 0) + amount);
}

function latest(current: string | null, next: string | null | undefined) {
  if (!next) return current;
  if (!current) return next;

  return new Date(next).getTime() > new Date(current).getTime() ? next : current;
}

async function getUserLabels(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await createAdminDataClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("user_id,full_name")
    .in("user_id", Array.from(new Set(userIds)));

  return new Map(
    (data ?? []).map((profile) => [
      String(profile.user_id),
      String(profile.full_name || profile.user_id),
    ]),
  );
}

export async function getAdminSalesAnalytics(params?: AdminSearchParams): Promise<{
  kpis: AdminSalesAnalyticsKpis;
  result: AdminListResult<AdminSalesAnalyticsUserRow>;
}> {
  const supabase = await createAdminDataClient();
  const { from, limit, page, to } = getPaging(params);
  const since = thirtyDaysAgo();
  const [
    activityResult,
    goalsResult,
    pipelineTodayResult,
    snapshotsResult,
  ] = await Promise.all([
    supabase
      .from("sales_activity_daily")
      .select("user_id,activity_date,leads_created,followups_completed,leads_won,pipeline_status_changes")
      .gte("activity_date", since)
      .limit(10000),
    supabase
      .from("sales_goals")
      .select("user_id,status,created_at,updated_at,completed_at")
      .limit(10000),
    supabase
      .from("lead_pipeline_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfTodayIso()),
    supabase
      .from("sales_analytics_snapshots")
      .select("user_id,updated_at")
      .gte("snapshot_date", since)
      .limit(10000),
  ]);

  const leadsByUser = new Map<string, number>();
  const followupsByUser = new Map<string, number>();
  const wonByUser = new Map<string, number>();
  const goalsByUser = new Map<string, number>();
  const activeGoalsByUser = new Map<string, number>();
  const completedGoalsByUser = new Map<string, number>();
  const lastActivityByUser = new Map<string, string | null>();

  (activityResult.data ?? []).forEach((row) => {
    const userId = String(row.user_id);
    inc(leadsByUser, userId, Number(row.leads_created ?? 0));
    inc(followupsByUser, userId, Number(row.followups_completed ?? 0));
    inc(wonByUser, userId, Number(row.leads_won ?? 0));
    lastActivityByUser.set(
      userId,
      latest(lastActivityByUser.get(userId) ?? null, `${row.activity_date}T00:00:00.000Z`),
    );
  });

  (goalsResult.data ?? []).forEach((row) => {
    const userId = String(row.user_id);
    inc(goalsByUser, userId);
    if (row.status === "active") inc(activeGoalsByUser, userId);
    if (row.status === "completed") inc(completedGoalsByUser, userId);
    lastActivityByUser.set(
      userId,
      latest(lastActivityByUser.get(userId) ?? null, row.updated_at || row.completed_at || row.created_at),
    );
  });

  (snapshotsResult.data ?? []).forEach((row) => {
    const userId = String(row.user_id);
    lastActivityByUser.set(userId, latest(lastActivityByUser.get(userId) ?? null, row.updated_at));
  });

  const userIds = Array.from(
    new Set([
      ...Array.from(leadsByUser.keys()),
      ...Array.from(goalsByUser.keys()),
      ...Array.from(lastActivityByUser.keys()),
    ]),
  );
  const labels = await getUserLabels(userIds);
  const rows = userIds
    .map((userId) => ({
      activeGoals: activeGoalsByUser.get(userId) ?? 0,
      completedGoals: completedGoalsByUser.get(userId) ?? 0,
      followupsCompleted30d: followupsByUser.get(userId) ?? 0,
      goalsCount: goalsByUser.get(userId) ?? 0,
      lastAnalyticsActivity: lastActivityByUser.get(userId) ?? null,
      leadsCreated30d: leadsByUser.get(userId) ?? 0,
      userId,
      userLabel: labels.get(userId) || userId,
      wonLeads30d: wonByUser.get(userId) ?? 0,
    }))
    .sort((a, b) => {
      return (
        new Date(b.lastAnalyticsActivity || 0).getTime() -
        new Date(a.lastAnalyticsActivity || 0).getTime()
      );
    });

  const activeUsers = Math.max(1, userIds.length);

  return {
    kpis: {
      activeGoals: Array.from(activeGoalsByUser.values()).reduce((sum, value) => sum + value, 0),
      averageFollowupsCompleted30d: Math.round(
        Array.from(followupsByUser.values()).reduce((sum, value) => sum + value, 0) / activeUsers,
      ),
      averageLeadsCreated30d: Math.round(
        Array.from(leadsByUser.values()).reduce((sum, value) => sum + value, 0) / activeUsers,
      ),
      goalsCompleted: Array.from(completedGoalsByUser.values()).reduce((sum, value) => sum + value, 0),
      goalsCreated: goalsResult.data?.length ?? 0,
      pipelineStatusChangesToday: pipelineTodayResult.count ?? 0,
      usersWithAnalyticsData: userIds.length,
    },
    result: toListResult(rows.slice(from, to + 1), rows.length, page, limit),
  };
}
