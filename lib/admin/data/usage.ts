import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getUserLabel,
  listAuthUsers,
  listProfiles,
  toProfileMap,
  toUserEmailMap,
} from "@/lib/admin/data/common";
import {
  getPaging,
  getParam,
  todayDate,
  toListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";

export type AdminUsageRow = {
  area_search: number;
  date: string;
  export_leads: number;
  near_me_search: number;
  quotaReached: boolean;
  route_search: number;
  save_map_lead: number;
  task_cancelled: number;
  task_completed: number;
  task_created: number;
  task_snoozed: number;
  userLabel: string;
  user_id: string;
};

const usageActions = [
  "near_me_search",
  "area_search",
  "route_search",
  "export_leads",
  "save_map_lead",
] as const;

export async function getAdminUsage(params?: AdminSearchParams) {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_USAGE);

  const supabase = createSupabaseAdminClient();
  const { limit, page } = getPaging(params);
  const date = getParam(params, "date") || todayDate();
  const actionType = getParam(params, "actionType") || "";
  const includeTaskEvents = !actionType || actionType.startsWith("task_");
  const onlyQuotaReached = getParam(params, "quotaReached") === "true";
  const userSearch = (getParam(params, "q") || "").toLowerCase();

  let query = supabase
    .from("daily_usage_limits")
    .select("user_id,usage_date,action_type,used_count,limit_count")
    .eq("usage_date", date)
    .limit(10000);

  if (actionType) {
    query = query.eq("action_type", actionType);
  }

  const [usageResult, taskEventsResult, users, profiles] = await Promise.all([
    query,
    supabase
      .from("task_events")
      .select("user_id,event_type,created_at")
      .gte("created_at", `${date}T00:00:00.000Z`)
      .lt("created_at", `${date}T23:59:59.999Z`)
      .limit(10000),
    listAuthUsers(),
    listProfiles(),
  ]);

  const rows = (usageResult.data ?? []) as Array<{
    action_type?: string;
    limit_count?: number;
    usage_date?: string;
    used_count?: number;
    user_id?: string;
  }>;
  const profileMap = toProfileMap(profiles);
  const emailMap = toUserEmailMap(users);
  const grouped = new Map<string, AdminUsageRow>();

  rows.forEach((row) => {
    if (!row.user_id || !row.usage_date) {
      return;
    }

    const key = `${row.user_id}:${row.usage_date}`;
    const current =
      grouped.get(key) ??
      ({
        area_search: 0,
        date: row.usage_date,
        export_leads: 0,
        near_me_search: 0,
        quotaReached: false,
        route_search: 0,
        save_map_lead: 0,
        task_cancelled: 0,
        task_completed: 0,
        task_created: 0,
        task_snoozed: 0,
        userLabel: getUserLabel(row.user_id, profileMap, emailMap),
        user_id: row.user_id,
      } satisfies AdminUsageRow);

    if (usageActions.includes(row.action_type as (typeof usageActions)[number])) {
      current[row.action_type as (typeof usageActions)[number]] = row.used_count ?? 0;
    }

    if ((row.used_count ?? 0) >= (row.limit_count ?? 1)) {
      current.quotaReached = true;
    }

    grouped.set(key, current);
  });

  (includeTaskEvents ? (taskEventsResult.data ?? []) : [] as unknown[]).forEach((event) => {
    const taskEvent = event as {
      event_type?: string | null;
      user_id?: string | null;
    };

    if (!taskEvent.user_id) {
      return;
    }

    if (
      actionType === "task_created" &&
      taskEvent.event_type !== "created"
    ) {
      return;
    }

    if (
      actionType === "task_completed" &&
      taskEvent.event_type !== "completed"
    ) {
      return;
    }

    if (actionType === "task_snoozed" && taskEvent.event_type !== "snoozed") {
      return;
    }

    if (
      actionType === "task_cancelled" &&
      taskEvent.event_type !== "cancelled"
    ) {
      return;
    }

    const key = `${taskEvent.user_id}:${date}`;
    const current =
      grouped.get(key) ??
      ({
        area_search: 0,
        date,
        export_leads: 0,
        near_me_search: 0,
        quotaReached: false,
        route_search: 0,
        save_map_lead: 0,
        task_cancelled: 0,
        task_completed: 0,
        task_created: 0,
        task_snoozed: 0,
        userLabel: getUserLabel(taskEvent.user_id, profileMap, emailMap),
        user_id: taskEvent.user_id,
      } satisfies AdminUsageRow);

    if (taskEvent.event_type === "created") current.task_created += 1;
    if (taskEvent.event_type === "completed") current.task_completed += 1;
    if (taskEvent.event_type === "snoozed") current.task_snoozed += 1;
    if (taskEvent.event_type === "cancelled") current.task_cancelled += 1;

    grouped.set(key, current);
  });

  const allRows = Array.from(grouped.values()).filter((row) => {
    if (onlyQuotaReached && !row.quotaReached) {
      return false;
    }

    if (userSearch && !row.userLabel.toLowerCase().includes(userSearch)) {
      return false;
    }

    return true;
  });

  const todayRows = rows.filter((row) => row.usage_date === date);
  const getSum = (action: string) =>
    todayRows
      .filter((row) => row.action_type === action)
      .reduce((total, row) => total + (row.used_count ?? 0), 0);

  const pagedRows = allRows.slice((page - 1) * limit, page * limit);

  return {
    kpis: {
      areaSearch: getSum("area_search"),
      exportLeads: getSum("export_leads"),
      nearMeSearch: getSum("near_me_search"),
      quotaReachedUsers: allRows.filter((row) => row.quotaReached).length,
      routeSearch: getSum("route_search"),
      taskCancelled: allRows.reduce((sum, row) => sum + row.task_cancelled, 0),
      taskCompleted: allRows.reduce((sum, row) => sum + row.task_completed, 0),
      taskCreated: allRows.reduce((sum, row) => sum + row.task_created, 0),
      taskSnoozed: allRows.reduce((sum, row) => sum + row.task_snoozed, 0),
    },
    result: toListResult(pagedRows, allRows.length, page, limit),
  };
}
