import { ACTIVE_TASK_STATUSES } from "@/lib/constants/tasks";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { PIPELINE_COLUMNS } from "@/lib/constants/lead-pipeline";
import {
  buildLeadFilterQuery,
  normalizeLeadFilters,
  type LeadFilters,
  type QueryLike,
} from "@/lib/leads/lead-filters";
import type { UpdatePipelineStatusInput } from "@/lib/validators/lead-views";

type SupabaseClient = Awaited<ReturnType<typeof createAuthedSupabaseServerClient>>["supabase"];

export type PipelineCadenceFilter = "active" | "none" | "paused";
export type PipelineSort = "follow_up" | "name" | "position" | "updated";

export type PipelineTag = {
  color?: string | null;
  id: string;
  name: string;
};

export type PipelineActiveCadence = {
  completedSteps: number;
  id: string;
  status: string;
  templateName: string;
  totalSteps: number;
};

export type PipelineLeadCard = {
  activeCadence: PipelineActiveCadence | null;
  category: string | null;
  id: string;
  name: string;
  next_follow_up_at: string | null;
  nextTaskAt: string | null;
  nextTaskType: string | null;
  openTasksCount: number;
  overdueTasksCount: number;
  priority: string | null;
  source: string | null;
  status: string | null;
  tags: PipelineTag[];
};

export type PipelineColumn = {
  count: number;
  description: string;
  emptyText: string;
  key: string;
  label: string;
  leads: PipelineLeadCard[];
};

export type PipelineSummary = {
  followUpCount: number;
  lostCount: number;
  overdueFollowUpCount: number;
  totalActiveLeads: number;
  visibleLeadCount: number;
  wonCount: number;
};

type RawPipelineLeadCard = Omit<
  PipelineLeadCard,
  | "activeCadence"
  | "nextTaskAt"
  | "nextTaskType"
  | "openTasksCount"
  | "overdueTasksCount"
  | "tags"
> & {
  lead_tags?: Array<{
    tags?: PipelineTag | PipelineTag[] | null;
  }> | null;
};

type LeadIdRestriction = {
  excludeIds?: string[];
  forceEmpty?: boolean;
  includeIds?: string[];
};

type TaskSignal = {
  nextTaskAt: string | null;
  nextTaskType: string | null;
  openTasksCount: number;
  overdueTasksCount: number;
};

const PIPELINE_SELECT_WITH_META =
  "id,name,source,status,priority,category,next_follow_up_at,pipeline_position,status_changed_at,updated_at,lead_tags(tags(id,name,color))";

const PIPELINE_SELECT_FALLBACK =
  "id,name,source,status,priority,category,next_follow_up_at,updated_at,lead_tags(tags(id,name,color))";

function isMissingPipelineSchema(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    (error.code === "42703" &&
      /(pipeline_position|status_changed_at)/i.test(error.message ?? ""))
  );
}

function isMissingOptionalPipelineRelation(error?: { code?: string; message?: string } | null) {
  const message = error?.message ?? "";

  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    /lead_tags|tags|lead_cadences|cadence_templates|reminders/i.test(message)
  );
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizePipelineTags(raw: RawPipelineLeadCard["lead_tags"]) {
  return (
    raw
      ?.map((item) => normalizeRelation(item.tags))
      .filter((tag): tag is PipelineTag => Boolean(tag))
      .slice(0, 3) ?? []
  );
}

function toPipelineLeadCard(row: RawPipelineLeadCard): PipelineLeadCard {
  const { lead_tags: leadTags, ...lead } = row;

  return {
    ...lead,
    activeCadence: null,
    nextTaskAt: null,
    nextTaskType: null,
    openTasksCount: 0,
    overdueTasksCount: 0,
    tags: normalizePipelineTags(leadTags),
  };
}

async function trackPipelineStatusAnalytics(toStatus: string) {
  await trackUserActivity("pipeline_status_changed");

  if (["contacted", "interested", "follow_up", "won", "lost", "not_fit"].includes(toStatus)) {
    await trackUserActivity("lead_contacted");
  }

  if (toStatus === "won") {
    await trackUserActivity("lead_won");
  } else if (toStatus === "lost") {
    await trackUserActivity("lead_lost");
  } else if (toStatus === "not_fit") {
    await trackUserActivity("lead_not_fit");
  }
}

function intersectIds(left: string[] | null, right: string[] | null) {
  if (left === null) return right;
  if (right === null) return left;

  const rightSet = new Set(right);
  return left.filter((id) => rightSet.has(id));
}

async function getLeadIdsForTags(
  supabase: SupabaseClient,
  userId: string,
  filters: LeadFilters,
) {
  const tagIds = filters.tagIds ?? [];
  const tagNames = filters.tagNames ?? [];

  if (tagIds.length === 0 && tagNames.length === 0) {
    return null;
  }

  let tagQuery = supabase.from("tags").select("id").eq("user_id", userId);

  if (tagIds.length > 0 && tagNames.length > 0) {
    tagQuery = tagQuery.or(`id.in.(${tagIds.join(",")}),name.in.(${tagNames.join(",")})`);
  } else if (tagIds.length > 0) {
    tagQuery = tagQuery.in("id", tagIds);
  } else {
    tagQuery = tagQuery.in("name", tagNames);
  }

  const { data: tags, error: tagError } = await tagQuery;

  if (tagError) {
    if (isMissingOptionalPipelineRelation(tagError)) {
      return [];
    }

    throw new Error(tagError.message);
  }

  const ownedTagIds = (tags ?? []).map((tag) => String(tag.id));

  if (ownedTagIds.length === 0) {
    return [];
  }

  const { data: leadTags, error } = await supabase
    .from("lead_tags")
    .select("lead_id")
    .in("tag_id", ownedTagIds);

  if (error) {
    if (isMissingOptionalPipelineRelation(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return Array.from(new Set((leadTags ?? []).map((row) => String(row.lead_id))));
}

async function getLeadIdsForCadenceFilter(
  supabase: SupabaseClient,
  userId: string,
  cadenceFilter?: PipelineCadenceFilter,
): Promise<LeadIdRestriction> {
  if (!cadenceFilter) {
    return {};
  }

  const statuses =
    cadenceFilter === "none"
      ? ["active", "paused"]
      : [cadenceFilter];
  const { data, error } = await supabase
    .from("lead_cadences")
    .select("lead_id")
    .eq("user_id", userId)
    .in("status", statuses)
    .limit(2000);

  if (error) {
    if (isMissingOptionalPipelineRelation(error)) {
      return cadenceFilter === "none" ? {} : { forceEmpty: true };
    }

    throw new Error(error.message);
  }

  const leadIds = Array.from(
    new Set((data ?? []).map((row) => String(row.lead_id || "")).filter(Boolean)),
  );

  if (cadenceFilter === "none") {
    return { excludeIds: leadIds };
  }

  return leadIds.length > 0 ? { includeIds: leadIds } : { forceEmpty: true };
}

async function getPipelineLeadRestriction(
  supabase: SupabaseClient,
  userId: string,
  filters: LeadFilters,
  cadenceFilter?: PipelineCadenceFilter,
): Promise<LeadIdRestriction> {
  const [tagLeadIds, cadenceRestriction] = await Promise.all([
    getLeadIdsForTags(supabase, userId, filters),
    getLeadIdsForCadenceFilter(supabase, userId, cadenceFilter),
  ]);

  if (tagLeadIds?.length === 0 || cadenceRestriction.forceEmpty) {
    return { forceEmpty: true };
  }

  return {
    excludeIds: cadenceRestriction.excludeIds,
    includeIds: intersectIds(tagLeadIds, cadenceRestriction.includeIds ?? null) ?? undefined,
  };
}

function applyLeadIdRestriction<TData extends unknown[]>(
  query: QueryLike<TData>,
  restriction: LeadIdRestriction,
) {
  if (restriction.forceEmpty) {
    return null;
  }

  let nextQuery = query;

  if (restriction.includeIds) {
    if (restriction.includeIds.length === 0) {
      return null;
    }

    nextQuery = nextQuery.in("id", restriction.includeIds);
  }

  if (restriction.excludeIds?.length) {
    nextQuery = nextQuery.not("id", "in", `(${restriction.excludeIds.join(",")})`);
  }

  return nextQuery;
}

function buildBasePipelineQuery<TData extends unknown[]>(
  supabase: SupabaseClient,
  userId: string,
  selectFields: string,
  filters: LeadFilters,
  restriction: LeadIdRestriction,
) {
  const normalized = normalizeLeadFilters(filters);

  return applyLeadIdRestriction(
    buildLeadFilterQuery(
      supabase
        .from("leads")
        .select(selectFields, { count: "exact" }) as unknown as QueryLike<TData>,
      normalized,
      userId,
    ),
    restriction,
  );
}

function applyPipelineSort<TData extends unknown[]>(
  query: QueryLike<TData>,
  sort: PipelineSort = "position",
) {
  if (sort === "follow_up") {
    return query.order("next_follow_up_at", { ascending: true, nullsFirst: false });
  }

  if (sort === "name") {
    return query.order("name", { ascending: true });
  }

  if (sort === "updated") {
    return query.order("updated_at", { ascending: false });
  }

  return query
    .order("pipeline_position", { ascending: true })
    .order("status_changed_at", { ascending: false, nullsFirst: false });
}

async function getPipelineFilteredCount(
  supabase: SupabaseClient,
  userId: string,
  filters: LeadFilters,
  restriction: LeadIdRestriction,
) {
  const query = buildBasePipelineQuery<{ id: string }[]>(
    supabase,
    userId,
    "id",
    filters,
    restriction,
  );

  if (!query) {
    return 0;
  }

  const { count, error } = await query.range(0, 0);

  if (error) {
    if (isMissingPipelineSchema(error)) {
      return 0;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}

async function getTaskSignalsForLeads(
  supabase: SupabaseClient,
  userId: string,
  leadIds: string[],
) {
  const signals = new Map<string, TaskSignal>();

  if (leadIds.length === 0) {
    return signals;
  }

  const todayStart = startOfToday().toISOString();
  const { data, error } = await supabase
    .from("reminders")
    .select("lead_id,remind_at,task_type,status")
    .eq("user_id", userId)
    .in("lead_id", leadIds)
    .in("status", [...ACTIVE_TASK_STATUSES])
    .is("deleted_at", null)
    .order("remind_at", { ascending: true })
    .limit(Math.min(1500, Math.max(100, leadIds.length * 6)));

  if (error) {
    if (isMissingOptionalPipelineRelation(error)) {
      return signals;
    }

    throw new Error(error.message);
  }

  (data ?? []).forEach((task) => {
    const leadId = String(task.lead_id || "");

    if (!leadId) {
      return;
    }

    const current = signals.get(leadId) ?? {
      nextTaskAt: null,
      nextTaskType: null,
      openTasksCount: 0,
      overdueTasksCount: 0,
    };
    const remindAt = task.remind_at ? String(task.remind_at) : null;

    current.openTasksCount += 1;
    if (remindAt && remindAt < todayStart) {
      current.overdueTasksCount += 1;
    }

    if (remindAt && (!current.nextTaskAt || remindAt < current.nextTaskAt)) {
      current.nextTaskAt = remindAt;
      current.nextTaskType = task.task_type ? String(task.task_type) : null;
    }

    signals.set(leadId, current);
  });

  return signals;
}

async function getActiveCadenceSignalsForLeads(
  supabase: SupabaseClient,
  userId: string,
  leadIds: string[],
) {
  const signals = new Map<string, PipelineActiveCadence>();

  if (leadIds.length === 0) {
    return signals;
  }

  const { data, error } = await supabase
    .from("lead_cadences")
    .select("id,lead_id,status,completed_steps,total_steps,cadence_templates(name)")
    .eq("user_id", userId)
    .in("lead_id", leadIds)
    .in("status", ["active", "paused"])
    .order("updated_at", { ascending: false })
    .limit(Math.min(1000, Math.max(100, leadIds.length * 2)));

  if (error) {
    if (isMissingOptionalPipelineRelation(error)) {
      return signals;
    }

    throw new Error(error.message);
  }

  (data ?? []).forEach((item) => {
    const row = item as {
      cadence_templates?: { name?: string | null } | Array<{ name?: string | null }> | null;
      completed_steps?: number | null;
      id?: string | null;
      lead_id?: string | null;
      status?: string | null;
      total_steps?: number | null;
    };
    const leadId = String(row.lead_id || "");

    if (!leadId || signals.has(leadId)) {
      return;
    }

    const template = normalizeRelation(row.cadence_templates);

    signals.set(leadId, {
      completedSteps: Number(row.completed_steps ?? 0),
      id: String(row.id || ""),
      status: row.status || "active",
      templateName: template?.name || "Quy trình chăm sóc",
      totalSteps: Number(row.total_steps ?? 0),
    });
  });

  return signals;
}

export async function getPipelineColumnsWithLeads(params: {
  cadenceFilter?: PipelineCadenceFilter;
  filters?: LeadFilters;
  limitPerColumn?: number;
  sort?: PipelineSort;
} = {}) {
  const limitPerColumn = Math.min(100, Math.max(5, Number(params.limitPerColumn) || 50));
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const filters = normalizeLeadFilters(params.filters ?? {});
  const restriction = await getPipelineLeadRestriction(
    supabase,
    userId,
    filters,
    params.cadenceFilter,
  );
  const baseColumns = await Promise.all(
    PIPELINE_COLUMNS.map(async (column) => {
      const query = buildBasePipelineQuery<RawPipelineLeadCard[]>(
        supabase,
        userId,
        PIPELINE_SELECT_WITH_META,
        {
          ...filters,
          status: [column.key],
        },
        restriction,
      );

      if (!query) {
        return {
          count: 0,
          description: column.description,
          emptyText: column.emptyText,
          key: column.key,
          label: column.label,
          leads: [],
        };
      }

      const sortedQuery = applyPipelineSort(query, params.sort);
      const { count, data, error } = await sortedQuery.limit(limitPerColumn);

      if (error) {
        if (isMissingPipelineSchema(error)) {
          const fallback = buildBasePipelineQuery<RawPipelineLeadCard[]>(
            supabase,
            userId,
            PIPELINE_SELECT_FALLBACK,
            {
              ...filters,
              status: [column.key],
            },
            restriction,
          );

          if (!fallback) {
            return {
              count: 0,
              description: column.description,
              emptyText: column.emptyText,
              key: column.key,
              label: column.label,
              leads: [],
            };
          }

          const fallbackResult = await fallback
            .order("updated_at", { ascending: false })
            .limit(limitPerColumn);

          if (fallbackResult.error) {
            throw new Error(fallbackResult.error.message);
          }

          return {
            count: fallbackResult.count ?? fallbackResult.data?.length ?? 0,
            description: column.description,
            emptyText: column.emptyText,
            key: column.key,
            label: column.label,
            leads: ((fallbackResult.data ?? []) as RawPipelineLeadCard[]).map(
              toPipelineLeadCard,
            ),
          };
        }

        throw new Error(error.message);
      }

      return {
        count: count ?? 0,
        description: column.description,
        emptyText: column.emptyText,
        key: column.key,
        label: column.label,
        leads: ((data ?? []) as RawPipelineLeadCard[]).map(toPipelineLeadCard),
      };
    }),
  );
  const leadIds = Array.from(
    new Set(baseColumns.flatMap((column) => column.leads.map((lead) => lead.id))),
  );
  const [taskSignals, cadenceSignals] = await Promise.all([
    getTaskSignalsForLeads(supabase, userId, leadIds),
    getActiveCadenceSignalsForLeads(supabase, userId, leadIds),
  ]);
  const columns = baseColumns.map((column) => ({
    ...column,
    leads: column.leads.map((lead) => {
      const taskSignal = taskSignals.get(lead.id);

      return {
        ...lead,
        activeCadence: cadenceSignals.get(lead.id) ?? null,
        nextTaskAt: taskSignal?.nextTaskAt ?? null,
        nextTaskType: taskSignal?.nextTaskType ?? null,
        openTasksCount: taskSignal?.openTasksCount ?? 0,
        overdueTasksCount: taskSignal?.overdueTasksCount ?? 0,
      };
    }),
  }));
  const activeStatusKeys = PIPELINE_COLUMNS
    .filter((column) => !["lost", "not_fit", "won"].includes(column.key))
    .map((column) => column.key);
  const overdueFollowUpCount = await getPipelineFilteredCount(
    supabase,
    userId,
    {
      ...filters,
      followUp: "overdue",
      status: activeStatusKeys,
    },
    restriction,
  );

  const summary = {
    followUpCount: columns.find((column) => column.key === "follow_up")?.count ?? 0,
    lostCount:
      (columns.find((column) => column.key === "lost")?.count ?? 0) +
      (columns.find((column) => column.key === "not_fit")?.count ?? 0),
    totalActiveLeads: columns
      .filter((column) => !["lost", "not_fit", "won"].includes(column.key))
      .reduce((sum, column) => sum + column.count, 0),
    overdueFollowUpCount,
    visibleLeadCount: columns.reduce((sum, column) => sum + column.count, 0),
    wonCount: columns.find((column) => column.key === "won")?.count ?? 0,
  };

  return { columns, summary };
}

export async function getPipelineSummary(): Promise<PipelineSummary> {
  const data = await getPipelineColumnsWithLeads({ limitPerColumn: 5 });

  return data.summary;
}

export async function updateLeadStatusFromPipeline(input: UpdatePipelineStatusInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id,status")
    .eq("id", input.leadId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (leadError) {
    throw new Error(leadError.message);
  }

  if (!lead) {
    throw new Error("Không tìm thấy lead.");
  }

  const fromStatus = input.fromStatus || (lead.status as string | null) || null;
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status: input.toStatus,
    status_changed_at: now,
    updated_at: now,
  };

  if (input.position !== undefined) {
    payload.pipeline_position = input.position;
  }

  const { data: updatedLead, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", input.leadId)
    .eq("user_id", userId)
    .select("id,name,status,next_follow_up_at")
    .single();

  if (error) {
    if (isMissingPipelineSchema(error)) {
      const fallback = await supabase
        .from("leads")
        .update({
          status: input.toStatus,
          updated_at: now,
        })
        .eq("id", input.leadId)
        .eq("user_id", userId)
        .select("id,name,status,next_follow_up_at")
        .single();

      if (fallback.error) {
        throw new Error(fallback.error.message);
      }

      await trackPipelineStatusAnalytics(input.toStatus);
      return fallback.data;
    }

    throw new Error(error.message);
  }

  const { error: eventError } = await supabase.from("lead_pipeline_events").insert({
    changed_from: "pipeline",
    from_status: fromStatus,
    lead_id: input.leadId,
    to_status: input.toStatus,
    user_id: userId,
  });

  if (eventError && !isMissingPipelineSchema(eventError)) {
    throw new Error(eventError.message);
  }

  await trackPipelineStatusAnalytics(input.toStatus);

  return updatedLead;
}

export async function getPipelineEvents(params: { page?: number } = {}) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 30;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { count, data, error } = await supabase
    .from("lead_pipeline_events")
    .select("id,lead_id,from_status,to_status,changed_from,created_at", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    if (isMissingPipelineSchema(error)) {
      return { items: [], limit, page, total: 0, totalPages: 1 };
    }

    throw new Error(error.message);
  }

  return {
    items: data ?? [],
    limit,
    page,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}
