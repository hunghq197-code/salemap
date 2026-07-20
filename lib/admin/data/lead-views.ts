import {
  createAdminDataClient,
  getPaging,
  toListResult,
  todayDate,
  type AdminListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";
import { isMissingSupabaseSchema } from "@/lib/supabase/schema-error";

export type AdminLeadViewsKpis = {
  advancedFilterUsage: number;
  mostUsedSmartView: string;
  pinnedViews: number;
  pipelineStatusChangesToday: number;
  savedViewsCreated: number;
  usersUsingPipeline: number;
};

export type AdminLeadViewsUserRow = {
  lastPipelineActivity: string | null;
  lastSavedViewActivity: string | null;
  pinnedViewsCount: number;
  pipelineEventsCount: number;
  savedViewsCount: number;
  userId: string;
  userLabel: string;
};

function startOfTodayIso() {
  return `${todayDate()}T00:00:00.000Z`;
}

function isMissingLeadViewsSchema(error: { code?: string; message?: string } | null | undefined) {
  return isMissingSupabaseSchema(error, [
    "lead_saved_views",
    "lead_view_events",
    "lead_pipeline_events",
  ]);
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

export async function getAdminLeadViews(params?: AdminSearchParams): Promise<{
  kpis: AdminLeadViewsKpis;
  result: AdminListResult<AdminLeadViewsUserRow>;
}> {
  const supabase = await createAdminDataClient();
  const { from, limit, page, to } = getPaging(params);
  const [
    pipelineTodayResult,
    savedViewsCountResult,
    pinnedViewsResult,
    pipelineRowsResult,
    savedViewRowsResult,
    viewEventRowsResult,
  ] = await Promise.all([
    supabase
      .from("lead_pipeline_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfTodayIso()),
    supabase.from("lead_saved_views").select("id", { count: "exact", head: true }),
    supabase
      .from("lead_saved_views")
      .select("id", { count: "exact", head: true })
      .eq("is_pinned", true),
    supabase.from("lead_pipeline_events").select("user_id,created_at").limit(5000),
    supabase
      .from("lead_saved_views")
      .select("user_id,is_pinned,view_type,view_key,usage_count,created_at,updated_at")
      .limit(5000),
    supabase
      .from("lead_view_events")
      .select("user_id,event_type,created_at")
      .limit(5000),
  ]);

  if (
    [
      pipelineTodayResult,
      savedViewsCountResult,
      pinnedViewsResult,
      pipelineRowsResult,
      savedViewRowsResult,
      viewEventRowsResult,
    ].some((result) => isMissingLeadViewsSchema(result.error))
  ) {
    return {
      kpis: {
        advancedFilterUsage: 0,
        mostUsedSmartView: "-",
        pinnedViews: 0,
        pipelineStatusChangesToday: 0,
        savedViewsCreated: 0,
        usersUsingPipeline: 0,
      },
      result: toListResult([], 0, page, limit),
    };
  }

  const pipelineByUser = new Map<string, number>();
  const savedViewsByUser = new Map<string, number>();
  const pinnedByUser = new Map<string, number>();
  const lastPipelineByUser = new Map<string, string | null>();
  const lastSavedViewByUser = new Map<string, string | null>();
  const usageBySmartView = new Map<string, number>();

  (pipelineRowsResult.data ?? []).forEach((row) => {
    const userId = String(row.user_id);
    inc(pipelineByUser, userId);
    lastPipelineByUser.set(userId, latest(lastPipelineByUser.get(userId) ?? null, row.created_at));
  });

  (savedViewRowsResult.data ?? []).forEach((row) => {
    const userId = String(row.user_id);
    inc(savedViewsByUser, userId);

    if (row.is_pinned) {
      inc(pinnedByUser, userId);
    }

    if (row.view_type === "smart" && row.view_key) {
      inc(usageBySmartView, String(row.view_key), Number(row.usage_count ?? 0));
    }

    lastSavedViewByUser.set(
      userId,
      latest(lastSavedViewByUser.get(userId) ?? null, row.updated_at || row.created_at),
    );
  });

  const advancedFilterUsage = (viewEventRowsResult.data ?? []).filter(
    (row) => row.event_type === "advanced_filter_applied",
  ).length;
  const userIds = Array.from(
    new Set([
      ...Array.from(pipelineByUser.keys()),
      ...Array.from(savedViewsByUser.keys()),
      ...Array.from(pinnedByUser.keys()),
    ]),
  );
  const labels = await getUserLabels(userIds);
  const rows = userIds
    .map((userId) => ({
      lastPipelineActivity: lastPipelineByUser.get(userId) ?? null,
      lastSavedViewActivity: lastSavedViewByUser.get(userId) ?? null,
      pinnedViewsCount: pinnedByUser.get(userId) ?? 0,
      pipelineEventsCount: pipelineByUser.get(userId) ?? 0,
      savedViewsCount: savedViewsByUser.get(userId) ?? 0,
      userId,
      userLabel: labels.get(userId) || userId,
    }))
    .sort((a, b) => {
      const aTime = Math.max(
        new Date(a.lastPipelineActivity || 0).getTime(),
        new Date(a.lastSavedViewActivity || 0).getTime(),
      );
      const bTime = Math.max(
        new Date(b.lastPipelineActivity || 0).getTime(),
        new Date(b.lastSavedViewActivity || 0).getTime(),
      );

      return bTime - aTime;
    });

  return {
    kpis: {
      advancedFilterUsage,
      mostUsedSmartView:
        Array.from(usageBySmartView.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-",
      pinnedViews: pinnedViewsResult.count ?? 0,
      pipelineStatusChangesToday: pipelineTodayResult.count ?? 0,
      savedViewsCreated: savedViewsCountResult.count ?? 0,
      usersUsingPipeline: pipelineByUser.size,
    },
    result: toListResult(rows.slice(from, to + 1), rows.length, page, limit),
  };
}
