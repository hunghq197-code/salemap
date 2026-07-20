import {
  createAdminDataClient,
  getPaging,
  toListResult,
  todayDate,
  type AdminListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";

export type AdminDataQualityKpis = {
  bulkActionsToday: number;
  duplicateGroupsMerged: number;
  leadsArchivedByBulkAction: number;
  openDataQualityIssues: number;
  totalDuplicateGroups: number;
  usersUsingCleanup: number;
};

export type AdminDataQualityUserRow = {
  bulkActions: number;
  duplicateGroups: number;
  lastCleanupActivity: string | null;
  mergeCompleted: number;
  openIssues: number;
  userId: string;
  userLabel: string;
};

function startOfTodayIso() {
  return `${todayDate()}T00:00:00.000Z`;
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

function inc(map: Map<string, number>, userId: string, amount = 1) {
  map.set(userId, (map.get(userId) ?? 0) + amount);
}

function latest(current: string | null, next: string | null | undefined) {
  if (!next) return current;
  if (!current) return next;

  return new Date(next).getTime() > new Date(current).getTime() ? next : current;
}

export async function getAdminDataQuality(params?: AdminSearchParams): Promise<{
  kpis: AdminDataQualityKpis;
  result: AdminListResult<AdminDataQualityUserRow>;
}> {
  const supabase = await createAdminDataClient();
  const { from, limit, page, to } = getPaging(params);
  const [
    duplicateGroupsResult,
    mergedGroupsResult,
    openIssuesResult,
    bulkTodayResult,
    bulkArchiveResult,
    mergeRowsResult,
    issueRowsResult,
    bulkRowsResult,
  ] = await Promise.all([
    supabase.from("lead_merge_groups").select("id", { count: "exact", head: true }),
    supabase
      .from("lead_merge_groups")
      .select("id", { count: "exact", head: true })
      .eq("status", "merged"),
    supabase
      .from("lead_data_quality_issues")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("bulk_action_jobs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfTodayIso()),
    supabase
      .from("bulk_action_jobs")
      .select("success_count")
      .eq("action_type", "archive")
      .eq("status", "completed"),
    supabase
      .from("lead_merge_groups")
      .select("user_id,status,created_at,updated_at")
      .limit(5000),
    supabase
      .from("lead_data_quality_issues")
      .select("user_id,status,created_at,updated_at")
      .limit(5000),
    supabase
      .from("bulk_action_jobs")
      .select("user_id,status,created_at,updated_at")
      .limit(5000),
  ]);

  const duplicateGroupsByUser = new Map<string, number>();
  const mergedByUser = new Map<string, number>();
  const openIssuesByUser = new Map<string, number>();
  const bulkByUser = new Map<string, number>();
  const lastActivityByUser = new Map<string, string | null>();

  (mergeRowsResult.data ?? []).forEach((row) => {
    const userId = String(row.user_id);
    inc(duplicateGroupsByUser, userId);

    if (row.status === "merged") {
      inc(mergedByUser, userId);
    }

    lastActivityByUser.set(
      userId,
      latest(lastActivityByUser.get(userId) ?? null, row.updated_at || row.created_at),
    );
  });

  (issueRowsResult.data ?? []).forEach((row) => {
    const userId = String(row.user_id);

    if (row.status === "open") {
      inc(openIssuesByUser, userId);
    }

    lastActivityByUser.set(
      userId,
      latest(lastActivityByUser.get(userId) ?? null, row.updated_at || row.created_at),
    );
  });

  (bulkRowsResult.data ?? []).forEach((row) => {
    const userId = String(row.user_id);
    inc(bulkByUser, userId);
    lastActivityByUser.set(
      userId,
      latest(lastActivityByUser.get(userId) ?? null, row.updated_at || row.created_at),
    );
  });

  const userIds = Array.from(
    new Set([
      ...Array.from(duplicateGroupsByUser.keys()),
      ...Array.from(mergedByUser.keys()),
      ...Array.from(openIssuesByUser.keys()),
      ...Array.from(bulkByUser.keys()),
    ]),
  );
  const labels = await getUserLabels(userIds);
  const rows = userIds
    .map((userId) => ({
      bulkActions: bulkByUser.get(userId) ?? 0,
      duplicateGroups: duplicateGroupsByUser.get(userId) ?? 0,
      lastCleanupActivity: lastActivityByUser.get(userId) ?? null,
      mergeCompleted: mergedByUser.get(userId) ?? 0,
      openIssues: openIssuesByUser.get(userId) ?? 0,
      userId,
      userLabel: labels.get(userId) || userId,
    }))
    .sort((a, b) => {
      const aTime = new Date(a.lastCleanupActivity || 0).getTime();
      const bTime = new Date(b.lastCleanupActivity || 0).getTime();
      return bTime - aTime;
    });

  return {
    kpis: {
      bulkActionsToday: bulkTodayResult.count ?? 0,
      duplicateGroupsMerged: mergedGroupsResult.count ?? 0,
      leadsArchivedByBulkAction: (bulkArchiveResult.data ?? []).reduce(
        (sum, row) => sum + Number(row.success_count ?? 0),
        0,
      ),
      openDataQualityIssues: openIssuesResult.count ?? 0,
      totalDuplicateGroups: duplicateGroupsResult.count ?? 0,
      usersUsingCleanup: userIds.length,
    },
    result: toListResult(rows.slice(from, to + 1), rows.length, page, limit),
  };
}
