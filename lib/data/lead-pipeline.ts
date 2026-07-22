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

export type PipelineLeadCard = {
  category: string | null;
  id: string;
  name: string;
  next_follow_up_at: string | null;
  note_summary: string | null;
  phone: string | null;
  priority: string | null;
  source: string | null;
  status: string | null;
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
  totalActiveLeads: number;
  wonCount: number;
};

function isMissingPipelineSchema(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    (error.code === "42703" &&
      /(pipeline_position|status_changed_at)/i.test(error.message ?? ""))
  );
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

async function buildBasePipelineQuery(selectFields: string, filters?: LeadFilters) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const normalized = normalizeLeadFilters(filters ?? {});

  return {
    query: buildLeadFilterQuery(
      supabase
        .from("leads")
        .select(selectFields, { count: "exact" }) as unknown as QueryLike<PipelineLeadCard[]>,
      normalized,
      userId,
    ),
    supabase,
    userId,
  };
}

export async function getPipelineColumnsWithLeads(params: {
  filters?: LeadFilters;
  limitPerColumn?: number;
} = {}) {
  const limitPerColumn = Math.min(100, Math.max(5, Number(params.limitPerColumn) || 50));
  const columns = await Promise.all(
    PIPELINE_COLUMNS.map(async (column) => {
      const { query } = await buildBasePipelineQuery(
        "id,name,phone,source,status,priority,category,note_summary,next_follow_up_at,pipeline_position,status_changed_at,updated_at",
        {
          ...params.filters,
          status: [column.key],
        },
      );
      const { count, data, error } = await query
        .order("pipeline_position", { ascending: true })
        .order("status_changed_at", { ascending: false, nullsFirst: false })
        .limit(limitPerColumn);

      if (error) {
        if (isMissingPipelineSchema(error)) {
          const fallback = await buildBasePipelineQuery(
            "id,name,phone,source,status,priority,category,note_summary,next_follow_up_at,updated_at",
            {
              ...params.filters,
              status: [column.key],
            },
          );
          const fallbackResult = await fallback.query
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
            leads: (fallbackResult.data ?? []) as PipelineLeadCard[],
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
        leads: (data ?? []) as PipelineLeadCard[],
      };
    }),
  );

  const summary = {
    followUpCount: columns.find((column) => column.key === "follow_up")?.count ?? 0,
    lostCount:
      (columns.find((column) => column.key === "lost")?.count ?? 0) +
      (columns.find((column) => column.key === "not_fit")?.count ?? 0),
    totalActiveLeads: columns
      .filter((column) => !["lost", "not_fit", "won"].includes(column.key))
      .reduce((sum, column) => sum + column.count, 0),
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
