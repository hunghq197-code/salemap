import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import type { QueryLike } from "@/lib/leads/lead-filters";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isMissingSupabaseSchema } from "@/lib/supabase/schema-error";

const SALES_ACTIVITY_ACTIONS = {
  ai_generate_completed: { column: "ai_requests", score: 2 },
  area_search_completed: { column: "area_searches", score: 3 },
  export_completed: { column: "exports_completed", score: 3 },
  followup_completed: { column: "followups_completed", score: 5 },
  followup_created: { column: "followups_created", score: 3 },
  import_rows_completed: { column: "import_rows_completed", score: 1 },
  lead_contacted: { column: "leads_contacted", score: 3 },
  lead_created: { column: "leads_created", score: 4 },
  lead_lost: { column: "leads_lost", score: 2 },
  lead_not_fit: { column: "leads_not_fit", score: 1 },
  lead_note_created: { column: "lead_notes_created", score: 3 },
  lead_won: { column: "leads_won", score: 8 },
  map_place_saved: { column: "map_leads_saved", score: 4 },
  near_me_search_completed: { column: "near_me_searches", score: 3 },
  pipeline_status_changed: { column: "pipeline_status_changes", score: 3 },
  reminder_completed: { column: "followups_completed", score: 5 },
  reminder_created: { column: "followups_created", score: 3 },
  route_search_completed: { column: "route_searches", score: 4 },
  template_copied: { column: "templates_copied", score: 2 },
} as const;

type SalesActivityActionType = keyof typeof SALES_ACTIVITY_ACTIONS;

type SalesActivityPatch = Partial<Record<(typeof SALES_ACTIVITY_ACTIONS)[SalesActivityActionType]["column"] | "active_score" | "overdue_followups" | "import_jobs_completed", number>>;

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function isSalesActivityAction(value: string): value is SalesActivityActionType {
  return value in SALES_ACTIVITY_ACTIONS;
}

function isMissingSchemaError(error: { code?: string; message?: string } | null | undefined) {
  return isMissingSupabaseSchema(error, ["sales_activity_daily"]);
}

function safeNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

async function countRows(
  table: string,
  userId: string,
  date: string,
  build?: (query: QueryLike) => QueryLike,
  dateColumn = "created_at",
) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte(dateColumn, `${date}T00:00:00.000Z`)
    .lt(dateColumn, `${addDays(date, 1)}T00:00:00.000Z`) as unknown as QueryLike;

  if (build) {
    query = build(query);
  }

  const { count, error } = await query;

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function sumColumn(
  table: string,
  userId: string,
  date: string,
  column: string,
  build?: (query: QueryLike<Record<string, unknown>[]>) => QueryLike<Record<string, unknown>[]>,
  dateColumn = "created_at",
) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from(table)
    .select(column)
    .eq("user_id", userId)
    .gte(dateColumn, `${date}T00:00:00.000Z`)
    .lt(dateColumn, `${addDays(date, 1)}T00:00:00.000Z`)
    .limit(5000) as unknown as QueryLike<Record<string, unknown>[]>;

  if (build) {
    query = build(query);
  }

  const { data, error } = await query;

  if (error) {
    return 0;
  }

  return (data ?? []).reduce((sum: number, row: Record<string, unknown>) => {
    return sum + safeNumber(row[column]);
  }, 0);
}

export async function upsertSalesActivityDaily(
  userId: string,
  activityDate: string,
  patch: SalesActivityPatch,
) {
  const supabase = createSupabaseAdminClient();
  const payload = {
    ...patch,
    activity_date: activityDate,
    updated_at: new Date().toISOString(),
    user_id: userId,
  };
  const { error } = await supabase
    .from("sales_activity_daily")
    .upsert(payload, { onConflict: "user_id,activity_date" });

  if (error && !isMissingSchemaError(error)) {
    throw new Error(error.message);
  }
}

export async function trackSalesActivity(actionType: string, incrementBy = 1) {
  if (!isSalesActivityAction(actionType) || incrementBy <= 0) {
    return;
  }

  try {
    const { userId } = await createAuthedSupabaseServerClient();
    const supabase = createSupabaseAdminClient();
    const activityDate = todayDate();
    const action = SALES_ACTIVITY_ACTIONS[actionType];
    const { data, error } = await supabase
      .from("sales_activity_daily")
      .select("*")
      .eq("user_id", userId)
      .eq("activity_date", activityDate)
      .maybeSingle();

    if (error && !isMissingSchemaError(error)) {
      return;
    }

    const current = (data ?? {}) as Record<string, unknown>;
    await upsertSalesActivityDaily(userId, activityDate, {
      [action.column]: safeNumber(current[action.column]) + incrementBy,
      active_score: safeNumber(current.active_score) + action.score * incrementBy,
    });
  } catch {
    // Sales analytics tracking must never break core workflows.
  }
}

export async function rebuildSalesActivityForDate(userId: string, date: string) {
  const [
    leadsCreated,
    leadNotesCreated,
    followupsCreated,
    followupsCompleted,
    pipelineStatusChanges,
    leadsWon,
    leadsLost,
    leadsNotFit,
    nearMeSearches,
    areaSearches,
    routeSearches,
    mapLeadsSaved,
    aiRequests,
    exportsCompleted,
    importJobsCompleted,
    importRowsCompleted,
    overdueFollowups,
  ] = await Promise.all([
    countRows("leads", userId, date, (query) => query.is("deleted_at", null)),
    countRows("lead_notes", userId, date, (query) => query.is("deleted_at", null)),
    countRows("reminders", userId, date, (query) => query.is("deleted_at", null)),
    countRows(
      "reminders",
      userId,
      date,
      (query) => query.eq("status", "done").is("deleted_at", null),
      "completed_at",
    ),
    countRows("lead_pipeline_events", userId, date),
    countRows("lead_pipeline_events", userId, date, (query) => query.eq("to_status", "won")),
    countRows("lead_pipeline_events", userId, date, (query) => query.eq("to_status", "lost")),
    countRows("lead_pipeline_events", userId, date, (query) => query.eq("to_status", "not_fit")),
    countRows("map_searches", userId, date, (query) => query.eq("search_type", "near_me_search")),
    countRows("map_searches", userId, date, (query) => query.eq("search_type", "area_search")),
    countRows("routes", userId, date, (query) => query.is("deleted_at", null)),
    countRows(
      "leads",
      userId,
      date,
      (query) => query.in("source", ["map_near_me", "map_area", "near_me", "route_search"]).is("deleted_at", null),
    ),
    countRows("ai_requests", userId, date, (query) => query.eq("status", "completed")),
    countRows("export_jobs", userId, date, (query) => query.eq("status", "completed")),
    countRows("import_jobs", userId, date, (query) => query.eq("status", "completed"), "completed_at"),
    sumColumn("import_jobs", userId, date, "imported_rows", (query) => query.eq("status", "completed"), "completed_at"),
    countRows(
      "reminders",
      userId,
      "2000-01-01",
      (query) =>
        query
          .eq("status", "pending")
          .is("deleted_at", null)
          .lt("remind_at", `${addDays(date, 1)}T00:00:00.000Z`),
      "remind_at",
    ),
  ]);

  const activeScore =
    leadsCreated * 4 +
    leadNotesCreated * 3 +
    followupsCreated * 3 +
    followupsCompleted * 5 +
    pipelineStatusChanges * 3 +
    leadsWon * 8 +
    routeSearches * 4 +
    mapLeadsSaved * 4 +
    aiRequests * 2;

  await upsertSalesActivityDaily(userId, date, {
    active_score: activeScore,
    ai_requests: aiRequests,
    area_searches: areaSearches,
    exports_completed: exportsCompleted,
    followups_completed: followupsCompleted,
    followups_created: followupsCreated,
    import_jobs_completed: importJobsCompleted,
    import_rows_completed: importRowsCompleted,
    lead_notes_created: leadNotesCreated,
    leads_contacted: 0,
    leads_created: leadsCreated,
    leads_lost: leadsLost,
    leads_not_fit: leadsNotFit,
    leads_won: leadsWon,
    map_leads_saved: mapLeadsSaved,
    near_me_searches: nearMeSearches,
    overdue_followups: overdueFollowups,
    pipeline_status_changes: pipelineStatusChanges,
    route_searches: routeSearches,
  });
}

export async function rebuildSalesActivityForUser(userId: string, fromDate: string, toDate: string) {
  let current = fromDate;
  let processed = 0;

  while (current <= toDate) {
    await rebuildSalesActivityForDate(userId, current);
    processed += 1;
    current = addDays(current, 1);
  }

  return processed;
}
