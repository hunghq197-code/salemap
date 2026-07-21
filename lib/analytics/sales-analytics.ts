import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  FUNNEL_STAGES,
  FUNNEL_STAGE_LABELS,
  getSourceLabel,
  type AnalyticsPeriodKey,
  type SalesMetricKey,
} from "@/lib/constants/sales-analytics";
import type { QueryLike } from "@/lib/leads/lead-filters";
import { isMissingSupabaseSchema } from "@/lib/supabase/schema-error";

export type AnalyticsPeriodSelection = {
  customFrom?: string;
  customTo?: string;
  period?: AnalyticsPeriodKey | string;
};

export type DateRange = {
  end: Date;
  endIso: string;
  label: string;
  period: AnalyticsPeriodKey;
  start: Date;
  startIso: string;
};

export type SalesMetrics = Record<SalesMetricKey, number> & {
  active_days_30d: number;
  active_days_7d: number;
  overdue_followups: number;
};

export type SalesMetricRates = {
  activityConsistency30d: number;
  activityConsistency7d: number;
  contactRate: number;
  followUpRate: number;
  interestRate: number;
  winRate: number;
};

export type SalesAnalyticsSummary = {
  metrics: SalesMetrics;
  rates: SalesMetricRates;
};

export type PipelineFunnel = {
  conversionRates: {
    contactedToInterested: number;
    followUpToWon: number;
    interestedToFollowUp: number;
    newToContacted: number;
    overallWinRate: number;
  };
  stages: Array<{
    count: number;
    key: (typeof FUNNEL_STAGES)[number];
    label: string;
  }>;
};

export type SourceBreakdownItem = {
  followUpLeads: number;
  interestedLeads: number;
  label: string;
  source: string;
  totalLeads: number;
  winRate: number;
  wonLeads: number;
};

export type TagBreakdownItem = {
  interestedLeads: number;
  tagId: string;
  tagName: string;
  totalLeads: number;
  wonLeads: number;
};

export type CategoryBreakdownItem = {
  category: string;
  interestedLeads: number;
  totalLeads: number;
  wonLeads: number;
};

export type DailyTrendItem = {
  activeScore: number;
  date: string;
  followupsCompleted: number;
  leadsCreated: number;
  leadsWon: number;
  notesCreated: number;
};

export type GoalProgressInput = {
  id: string;
  metric_key: string;
  period_end: string | null;
  period_start: string | null;
  period_type: string;
  status: string;
  target_value: number;
};

export type GoalProgress = {
  currentValue: number;
  progressPercent: number;
  remainingValue: number;
  status: string;
};

const CONTACTED_STATUSES = ["contacted", "interested", "follow_up", "won", "lost", "not_fit"];
const VALID_PERIODS = new Set([
  "custom",
  "last_30_days",
  "last_7_days",
  "this_month",
  "this_week",
  "today",
  "yesterday",
]);

function cloneDate(date: Date) {
  return new Date(date.getTime());
}

function startOfDay(date: Date) {
  const next = cloneDate(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = cloneDate(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - (day === 0 ? 6 : day - 1));
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonthExclusive(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isMissingSchemaError(error: { code?: string; message?: string } | null | undefined) {
  return isMissingSupabaseSchema(error, ["sales_activity_daily", "sales_goals"]);
}

function safeNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
}

export function getDateRangeForPeriod(input: AnalyticsPeriodSelection | string = "last_7_days"): DateRange {
  const selection = typeof input === "string" ? { period: input } : input;
  const period = (VALID_PERIODS.has(String(selection.period)) ? selection.period : "last_7_days") as AnalyticsPeriodKey;
  const now = new Date();
  const today = startOfDay(now);
  let start = addDays(today, -6);
  let end = addDays(today, 1);
  let label = "7 ngay qua";

  if (period === "today") {
    start = today;
    end = addDays(today, 1);
    label = "Hom nay";
  } else if (period === "yesterday") {
    start = addDays(today, -1);
    end = today;
    label = "Hom qua";
  } else if (period === "last_30_days") {
    start = addDays(today, -29);
    end = addDays(today, 1);
    label = "30 ngay qua";
  } else if (period === "this_week") {
    start = startOfWeek(now);
    end = addDays(start, 7);
    label = "Tuan nay";
  } else if (period === "this_month") {
    start = startOfMonth(now);
    end = endOfMonthExclusive(now);
    label = "Thang nay";
  } else if (period === "custom" && selection.customFrom && selection.customTo) {
    start = startOfDay(new Date(`${selection.customFrom}T00:00:00`));
    end = addDays(startOfDay(new Date(`${selection.customTo}T00:00:00`)), 1);
    label = "Tuy chon";
  }

  return {
    end,
    endIso: end.toISOString(),
    label,
    period,
    start,
    startIso: start.toISOString(),
  };
}

export function getPreviousDateRange(range: DateRange): DateRange {
  const lengthMs = range.end.getTime() - range.start.getTime();
  const end = cloneDate(range.start);
  const start = new Date(end.getTime() - lengthMs);

  return {
    end,
    endIso: end.toISOString(),
    label: "Ky truoc",
    period: range.period,
    start,
    startIso: start.toISOString(),
  };
}

async function countRows(
  table: string,
  userId: string,
  range: DateRange,
  build?: (query: QueryLike) => QueryLike,
  dateColumn = "created_at",
) {
  const supabase = createSupabaseAdminClient();
  const startValue = dateColumn === "activity_date" ? toDateOnly(range.start) : range.startIso;
  const endValue = dateColumn === "activity_date" ? toDateOnly(range.end) : range.endIso;
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte(dateColumn, startValue)
    .lt(dateColumn, endValue) as unknown as QueryLike;

  if (build) {
    query = build(query);
  }

  const { count, error } = await query;

  if (error) {
    if (isMissingSchemaError(error)) {
      return 0;
    }

    return 0;
  }

  return count ?? 0;
}

async function sumColumn(
  table: string,
  userId: string,
  range: DateRange,
  column: string,
  build?: (query: QueryLike<Record<string, unknown>[]>) => QueryLike<Record<string, unknown>[]>,
  dateColumn = "created_at",
) {
  const supabase = createSupabaseAdminClient();
  const startValue = dateColumn === "activity_date" ? toDateOnly(range.start) : range.startIso;
  const endValue = dateColumn === "activity_date" ? toDateOnly(range.end) : range.endIso;
  let query = supabase
    .from(table)
    .select(column)
    .eq("user_id", userId)
    .gte(dateColumn, startValue)
    .lt(dateColumn, endValue)
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

async function countLeadsByCurrentStatusDate(
  userId: string,
  range: DateRange,
  statuses: string[],
) {
  const statusChangedCount = await countRows(
    "leads",
    userId,
    range,
    (query) => query.in("status", statuses).is("deleted_at", null),
    "status_changed_at",
  );

  if (statusChangedCount > 0) {
    return statusChangedCount;
  }

  return countRows(
    "leads",
    userId,
    range,
    (query) => query.in("status", statuses).is("deleted_at", null),
    "updated_at",
  );
}

async function countPipelineToStatus(userId: string, range: DateRange, statuses: string[]) {
  return countRows(
    "lead_pipeline_events",
    userId,
    range,
    (query) => query.in("to_status", statuses),
  );
}

async function countStatusReached(userId: string, range: DateRange, status: string) {
  const eventCount = await countPipelineToStatus(userId, range, [status]);

  if (eventCount > 0) {
    return eventCount;
  }

  return countLeadsByCurrentStatusDate(userId, range, [status]);
}

async function countActivityDays(userId: string, days: number) {
  const supabase = createSupabaseAdminClient();
  const end = addDays(startOfDay(new Date()), 1);
  const start = addDays(end, -days);
  const { data, error } = await supabase
    .from("sales_activity_daily")
    .select("activity_date,active_score")
    .eq("user_id", userId)
    .gte("activity_date", toDateOnly(start))
    .lt("activity_date", toDateOnly(end));

  if (error) {
    const fallback = await supabase
      .from("user_activity_daily")
      .select("activity_date,active_score")
      .eq("user_id", userId)
      .gte("activity_date", toDateOnly(start))
      .lt("activity_date", toDateOnly(end));

    if (fallback.error) {
      return 0;
    }

    return (fallback.data ?? []).filter((row) => safeNumber(row.active_score) > 0).length;
  }

  return (data ?? []).filter((row) => safeNumber(row.active_score) > 0).length;
}

export async function calculateSalesMetricsForUser(
  userId: string,
  period: AnalyticsPeriodSelection | string = "last_7_days",
): Promise<SalesAnalyticsSummary> {
  const range = getDateRangeForPeriod(period);
  const [
    leadsCreated,
    pipelineContacted,
    notesCreated,
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
    templatesCopied,
    aiRequests,
    exportsCompleted,
    importRowsCompleted,
    overdueFollowups,
    activeDays7d,
    activeDays30d,
  ] = await Promise.all([
    countRows("leads", userId, range, (query) => query.is("deleted_at", null)),
    countPipelineToStatus(userId, range, ["contacted"]),
    countRows("lead_notes", userId, range, (query) => query.is("deleted_at", null)),
    countRows("reminders", userId, range, (query) => query.is("deleted_at", null)),
    countRows(
      "reminders",
      userId,
      range,
      (query) => query.eq("status", "done").is("deleted_at", null),
      "completed_at",
    ),
    countRows("lead_pipeline_events", userId, range),
    countStatusReached(userId, range, "won"),
    countStatusReached(userId, range, "lost"),
    countStatusReached(userId, range, "not_fit"),
    countRows("map_searches", userId, range, (query) => query.eq("search_type", "near_me_search")),
    countRows("map_searches", userId, range, (query) => query.eq("search_type", "area_search")),
    countRows("routes", userId, range, (query) => query.is("deleted_at", null)),
    countRows(
      "leads",
      userId,
      range,
      (query) => query.in("source", ["map_near_me", "map_area", "near_me", "route_search"]).is("deleted_at", null),
    ),
    sumColumn("sales_activity_daily", userId, range, "templates_copied", undefined, "activity_date"),
    countRows("ai_requests", userId, range, (query) => query.eq("status", "completed")),
    countRows("export_jobs", userId, range, (query) => query.eq("status", "completed")),
    sumColumn("import_jobs", userId, range, "imported_rows", (query) => query.eq("status", "completed"), "completed_at"),
    countRows(
      "reminders",
      userId,
      {
        ...range,
        end: new Date(),
        endIso: new Date().toISOString(),
        start: new Date("2000-01-01T00:00:00.000Z"),
        startIso: "2000-01-01T00:00:00.000Z",
      },
      (query) => query.eq("status", "pending").is("deleted_at", null),
      "remind_at",
    ),
    countActivityDays(userId, 7),
    countActivityDays(userId, 30),
  ]);

  const contactedFallback = await countLeadsByCurrentStatusDate(userId, range, CONTACTED_STATUSES);
  const leadsContacted = pipelineContacted > 0 ? pipelineContacted : contactedFallback;
  const interestedLeads = await countLeadsByCurrentStatusDate(userId, range, ["interested", "follow_up", "won"]);
  const followUpLeads = await countLeadsByCurrentStatusDate(userId, range, ["follow_up", "won"]);
  const totalClosed = leadsWon + leadsLost + leadsNotFit;

  const metrics: SalesMetrics = {
    active_days_30d: activeDays30d,
    active_days_7d: activeDays7d,
    ai_requests: aiRequests,
    area_searches: areaSearches,
    exports_completed: exportsCompleted,
    followups_completed: followupsCompleted,
    followups_created: followupsCreated,
    import_rows_completed: importRowsCompleted,
    lead_notes_created: notesCreated,
    leads_contacted: leadsContacted,
    leads_created: leadsCreated,
    leads_lost: leadsLost,
    leads_not_fit: leadsNotFit,
    leads_won: leadsWon,
    map_leads_saved: mapLeadsSaved,
    near_me_searches: nearMeSearches,
    overdue_followups: overdueFollowups,
    pipeline_status_changes: pipelineStatusChanges,
    route_searches: routeSearches,
    templates_copied: templatesCopied,
  };

  return {
    metrics,
    rates: {
      activityConsistency30d: percent(activeDays30d, 30),
      activityConsistency7d: percent(activeDays7d, 7),
      contactRate: percent(leadsContacted, leadsCreated),
      followUpRate: percent(followUpLeads, Math.max(1, leadsContacted + interestedLeads)),
      interestRate: percent(interestedLeads, leadsContacted),
      winRate: percent(leadsWon, totalClosed),
    },
  };
}

export async function calculateMetricValueForUser(
  userId: string,
  metricKey: string,
  period: AnalyticsPeriodSelection | string,
) {
  const summary = await calculateSalesMetricsForUser(userId, period);

  return safeNumber(summary.metrics[metricKey as SalesMetricKey]);
}

export async function calculatePipelineFunnelForUser(
  userId: string,
  period: AnalyticsPeriodSelection | string = "last_7_days",
): Promise<PipelineFunnel> {
  const range = getDateRangeForPeriod(period);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("status")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("created_at", range.startIso)
    .lt("created_at", range.endIso)
    .limit(10000);

  const counts = new Map<string, number>();

  if (!error) {
    (data ?? []).forEach((row) => {
      const status = String(row.status || "new");
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });
  }

  const stageCounts = {
    contacted: safeNumber(counts.get("contacted")) + safeNumber(counts.get("interested")) + safeNumber(counts.get("follow_up")) + safeNumber(counts.get("won")),
    follow_up: safeNumber(counts.get("follow_up")) + safeNumber(counts.get("won")),
    interested: safeNumber(counts.get("interested")) + safeNumber(counts.get("follow_up")) + safeNumber(counts.get("won")),
    new: Array.from(counts.values()).reduce((sum, value) => sum + value, 0),
    won: safeNumber(counts.get("won")),
  };

  return {
    conversionRates: {
      contactedToInterested: percent(stageCounts.interested, stageCounts.contacted),
      followUpToWon: percent(stageCounts.won, stageCounts.follow_up),
      interestedToFollowUp: percent(stageCounts.follow_up, stageCounts.interested),
      newToContacted: percent(stageCounts.contacted, stageCounts.new),
      overallWinRate: percent(stageCounts.won, stageCounts.new),
    },
    stages: FUNNEL_STAGES.map((key) => ({
      count: stageCounts[key],
      key,
      label: FUNNEL_STAGE_LABELS[key],
    })),
  };
}

export async function calculateSourceBreakdownForUser(
  userId: string,
  period: AnalyticsPeriodSelection | string = "last_7_days",
): Promise<SourceBreakdownItem[]> {
  const range = getDateRangeForPeriod(period);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("source,status")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("created_at", range.startIso)
    .lt("created_at", range.endIso)
    .limit(10000);

  if (error) {
    return [];
  }

  const map = new Map<string, SourceBreakdownItem>();
  (data ?? []).forEach((row) => {
    const source = String(row.source || "other");
    const status = String(row.status || "new");
    const current = map.get(source) ?? {
      followUpLeads: 0,
      interestedLeads: 0,
      label: getSourceLabel(source),
      source,
      totalLeads: 0,
      winRate: 0,
      wonLeads: 0,
    };

    current.totalLeads += 1;
    if (["interested", "follow_up", "won"].includes(status)) current.interestedLeads += 1;
    if (["follow_up", "won"].includes(status)) current.followUpLeads += 1;
    if (status === "won") current.wonLeads += 1;
    current.winRate = percent(current.wonLeads, current.totalLeads);
    map.set(source, current);
  });

  return Array.from(map.values()).sort((a, b) => b.totalLeads - a.totalLeads);
}

export async function calculateTagBreakdownForUser(
  userId: string,
  period: AnalyticsPeriodSelection | string = "last_7_days",
): Promise<TagBreakdownItem[]> {
  const range = getDateRangeForPeriod(period);
  const supabase = createSupabaseAdminClient();
  const leadsResult = await supabase
    .from("leads")
    .select("id,status")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("created_at", range.startIso)
    .lt("created_at", range.endIso)
    .limit(5000);

  if (leadsResult.error || !leadsResult.data?.length) {
    return [];
  }

  const leads = new Map(
    leadsResult.data.map((lead) => [String(lead.id), String(lead.status || "new")]),
  );
  const leadIds = Array.from(leads.keys());
  const tagRowsResult = await supabase
    .from("lead_tags")
    .select("lead_id,tag_id")
    .in("lead_id", leadIds)
    .limit(10000);

  if (tagRowsResult.error || !tagRowsResult.data?.length) {
    return [];
  }

  const tagIds = Array.from(new Set(tagRowsResult.data.map((row) => String(row.tag_id))));
  const tagsResult = await supabase.from("tags").select("id,name").in("id", tagIds);
  const tagNames = new Map((tagsResult.data ?? []).map((tag) => [String(tag.id), String(tag.name)]));
  const map = new Map<string, TagBreakdownItem>();

  tagRowsResult.data.forEach((row) => {
    const tagId = String(row.tag_id);
    const status = leads.get(String(row.lead_id)) ?? "new";
    const current = map.get(tagId) ?? {
      interestedLeads: 0,
      tagId,
      tagName: tagNames.get(tagId) ?? "Tag",
      totalLeads: 0,
      wonLeads: 0,
    };

    current.totalLeads += 1;
    if (["interested", "follow_up", "won"].includes(status)) current.interestedLeads += 1;
    if (status === "won") current.wonLeads += 1;
    map.set(tagId, current);
  });

  return Array.from(map.values())
    .sort((a, b) => b.totalLeads - a.totalLeads)
    .slice(0, 10);
}

export async function calculateCategoryBreakdownForUser(
  userId: string,
  period: AnalyticsPeriodSelection | string = "last_7_days",
): Promise<CategoryBreakdownItem[]> {
  const range = getDateRangeForPeriod(period);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("category,status")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .not("category", "is", null)
    .gte("created_at", range.startIso)
    .lt("created_at", range.endIso)
    .limit(10000);

  if (error) {
    return [];
  }

  const map = new Map<string, CategoryBreakdownItem>();
  (data ?? []).forEach((row) => {
    const category = String(row.category || "Khac");
    const status = String(row.status || "new");
    const current = map.get(category) ?? {
      category,
      interestedLeads: 0,
      totalLeads: 0,
      wonLeads: 0,
    };

    current.totalLeads += 1;
    if (["interested", "follow_up", "won"].includes(status)) current.interestedLeads += 1;
    if (status === "won") current.wonLeads += 1;
    map.set(category, current);
  });

  return Array.from(map.values())
    .sort((a, b) => b.totalLeads - a.totalLeads)
    .slice(0, 10);
}

function incrementDaily(map: Map<string, DailyTrendItem>, date: string, key: keyof Omit<DailyTrendItem, "date">, amount = 1) {
  const current = map.get(date);

  if (!current) {
    return;
  }

  current[key] = safeNumber(current[key]) + amount;
}

export async function calculateDailyTrendForUser(
  userId: string,
  period: AnalyticsPeriodSelection | string = "last_30_days",
): Promise<DailyTrendItem[]> {
  const range = getDateRangeForPeriod(period);
  const dates = new Map<string, DailyTrendItem>();
  let cursor = startOfDay(range.start);

  while (cursor < range.end) {
    const date = toDateOnly(cursor);
    dates.set(date, {
      activeScore: 0,
      date,
      followupsCompleted: 0,
      leadsCreated: 0,
      leadsWon: 0,
      notesCreated: 0,
    });
    cursor = addDays(cursor, 1);
  }

  const supabase = createSupabaseAdminClient();
  const [leadsResult, notesResult, completedResult, activityResult] = await Promise.all([
    supabase
      .from("leads")
      .select("created_at,status")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .gte("created_at", range.startIso)
      .lt("created_at", range.endIso)
      .limit(10000),
    supabase
      .from("lead_notes")
      .select("created_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .gte("created_at", range.startIso)
      .lt("created_at", range.endIso)
      .limit(10000),
    supabase
      .from("reminders")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("status", "done")
      .is("deleted_at", null)
      .gte("completed_at", range.startIso)
      .lt("completed_at", range.endIso)
      .limit(10000),
    supabase
      .from("sales_activity_daily")
      .select("activity_date,active_score")
      .eq("user_id", userId)
      .gte("activity_date", toDateOnly(range.start))
      .lt("activity_date", toDateOnly(range.end)),
  ]);

  if (!leadsResult.error) {
    (leadsResult.data ?? []).forEach((row) => {
      const date = String(row.created_at).slice(0, 10);
      incrementDaily(dates, date, "leadsCreated");
      if (row.status === "won") incrementDaily(dates, date, "leadsWon");
    });
  }

  if (!notesResult.error) {
    (notesResult.data ?? []).forEach((row) => {
      incrementDaily(dates, String(row.created_at).slice(0, 10), "notesCreated");
    });
  }

  if (!completedResult.error) {
    (completedResult.data ?? []).forEach((row) => {
      if (row.completed_at) {
        incrementDaily(dates, String(row.completed_at).slice(0, 10), "followupsCompleted");
      }
    });
  }

  if (!activityResult.error) {
    (activityResult.data ?? []).forEach((row) => {
      const current = dates.get(String(row.activity_date));
      if (current) current.activeScore = safeNumber(row.active_score);
    });
  }

  return Array.from(dates.values());
}

export function periodForGoal(goal: GoalProgressInput): AnalyticsPeriodSelection {
  if (goal.period_type === "custom" && goal.period_start && goal.period_end) {
    return {
      customFrom: goal.period_start,
      customTo: goal.period_end,
      period: "custom",
    };
  }

  if (goal.period_type === "daily") return { period: "today" };
  if (goal.period_type === "monthly") return { period: "this_month" };

  return { period: "this_week" };
}

export async function calculateGoalProgressForRecord(
  userId: string,
  goal: GoalProgressInput,
): Promise<GoalProgress> {
  const currentValue = await calculateMetricValueForUser(userId, goal.metric_key, periodForGoal(goal));
  const target = Math.max(1, Number(goal.target_value) || 1);
  const progressPercent = Math.min(100, Math.round((currentValue / target) * 100));
  const completed = currentValue >= target;

  return {
    currentValue,
    progressPercent,
    remainingValue: Math.max(0, target - currentValue),
    status: completed && goal.status === "active" ? "completed" : goal.status,
  };
}

export async function calculateGoalProgress(userId: string, goalId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sales_goals")
    .select("id,metric_key,period_end,period_start,period_type,status,target_value")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return calculateGoalProgressForRecord(userId, data as GoalProgressInput);
}

export async function calculateAllActiveGoalProgress(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sales_goals")
    .select("id,metric_key,period_end,period_start,period_type,status,target_value")
    .eq("user_id", userId)
    .in("status", ["active", "completed"])
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return Promise.all(
    (data ?? []).map(async (goal) => ({
      goalId: String(goal.id),
      progress: await calculateGoalProgressForRecord(userId, goal as GoalProgressInput),
    })),
  );
}

export async function createSalesAnalyticsSnapshot(userId: string, periodType: string) {
  const period =
    periodType === "daily"
      ? "today"
      : periodType === "monthly"
        ? "this_month"
        : periodType === "rolling_30d"
          ? "last_30_days"
          : "last_7_days";
  const [summary, funnel, sources, tags, categories] = await Promise.all([
    calculateSalesMetricsForUser(userId, period),
    calculatePipelineFunnelForUser(userId, period),
    calculateSourceBreakdownForUser(userId, period),
    calculateTagBreakdownForUser(userId, period),
    calculateCategoryBreakdownForUser(userId, period),
  ]);
  const supabase = createSupabaseAdminClient();
  const snapshotDate = toDateOnly(new Date());

  const { error } = await supabase.from("sales_analytics_snapshots").upsert(
    {
      category_breakdown: categories,
      funnel,
      metrics: summary,
      period_type: periodType,
      snapshot_date: snapshotDate,
      source_breakdown: sources,
      tag_breakdown: tags,
      updated_at: new Date().toISOString(),
      user_id: userId,
    },
    { onConflict: "user_id,snapshot_date,period_type" },
  );

  if (error && !isMissingSchemaError(error)) {
    throw new Error(error.message);
  }
}
