import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { SMART_VIEW_DEFINITIONS, type SmartViewKey } from "@/lib/constants/lead-pipeline";
import { getFilteredLeadCount, getFilteredLeads } from "@/lib/data/lead-filtered-list";
import {
  getLeadFilterSummary,
  normalizeLeadFilters,
  type LeadFilters,
} from "@/lib/leads/lead-filters";
import { isMissingSupabaseSchema } from "@/lib/supabase/schema-error";
import type {
  CreateSavedViewInput,
  UpdateSavedViewInput,
} from "@/lib/validators/lead-views";

export type LeadSavedViewRecord = {
  color: string | null;
  created_at: string | null;
  description: string | null;
  filters: LeadFilters;
  icon: string | null;
  id: string;
  is_default: boolean | null;
  is_pinned: boolean | null;
  is_system: boolean | null;
  last_used_at: string | null;
  name: string;
  sort_by: string | null;
  sort_direction: "asc" | "desc" | null;
  usage_count: number | null;
  view_key: string | null;
  view_type: "custom" | "smart" | "system";
};

function isMissingSavedViewsSchema(error: { code?: string; message?: string }) {
  return isMissingSupabaseSchema(error, [
    "lead_saved_views",
    "lead_view_events",
    "lead_pipeline_events",
  ]);
}

async function insertViewEvent(
  eventType: string,
  savedViewId: string | null,
  metadata?: Record<string, unknown>,
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { error } = await supabase.from("lead_view_events").insert({
    event_type: eventType,
    metadata: metadata ?? {},
    saved_view_id: savedViewId,
    user_id: userId,
  });

  if (error && !isMissingSavedViewsSchema(error)) {
    throw new Error(error.message);
  }
}

export async function ensureSystemSmartViewsForUser(userId: string) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const keys = Object.keys(SMART_VIEW_DEFINITIONS);
  const { data: existing, error } = await supabase
    .from("lead_saved_views")
    .select("view_key")
    .eq("user_id", userId)
    .in("view_key", keys);

  if (error) {
    if (isMissingSavedViewsSchema(error)) {
      return false;
    }

    throw new Error(error.message);
  }

  const existingKeys = new Set((existing ?? []).map((row) => String(row.view_key)));
  const rowsToInsert = Object.entries(SMART_VIEW_DEFINITIONS)
    .filter(([key]) => !existingKeys.has(key))
    .map(([key, definition]) => ({
      color: definition.color,
      description: definition.description,
      filters: definition.filters,
      icon: definition.icon,
      is_default: key === "today_followups",
      is_pinned: ["today_followups", "new_leads", "interested_leads"].includes(key),
      is_system: true,
      name: definition.name,
      sort_by: "updated_at",
      sort_direction: "desc",
      user_id: userId,
      view_key: key,
      view_type: "smart",
    }));

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("lead_saved_views").insert(rowsToInsert);

    if (insertError) {
      if (isMissingSavedViewsSchema(insertError)) {
        return false;
      }

      throw new Error(insertError.message);
    }
  }

  return true;
}

async function withSystemViewsReady() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  await ensureSystemSmartViewsForUser(userId);

  return { supabase, userId };
}

export async function getSavedViews(params: { pinned?: boolean; type?: string } = {}) {
  const { supabase, userId } = await withSystemViewsReady();
  let query = supabase
    .from("lead_saved_views")
    .select("*")
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("view_type", { ascending: false })
    .order("created_at", { ascending: true });

  if (params.pinned) {
    query = query.eq("is_pinned", true);
  }

  if (params.type) {
    query = query.eq("view_type", params.type);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingSavedViewsSchema(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data ?? []) as unknown as LeadSavedViewRecord[];
}

export async function getPinnedSavedViews() {
  return getSavedViews({ pinned: true });
}

export async function getSavedViewById(viewId: string) {
  const { supabase, userId } = await withSystemViewsReady();
  const { data, error } = await supabase
    .from("lead_saved_views")
    .select("*")
    .eq("id", viewId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingSavedViewsSchema(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data as unknown as LeadSavedViewRecord | null;
}

export async function getSavedViewByKey(viewKey: SmartViewKey | string) {
  const { supabase, userId } = await withSystemViewsReady();
  const { data, error } = await supabase
    .from("lead_saved_views")
    .select("*")
    .eq("view_key", viewKey)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingSavedViewsSchema(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data as unknown as LeadSavedViewRecord | null;
}

export async function createSavedView(input: CreateSavedViewInput) {
  const { supabase, userId } = await withSystemViewsReady();
  const { data, error } = await supabase
    .from("lead_saved_views")
    .insert({
      color: input.color ?? null,
      description: input.description ?? null,
      filters: normalizeLeadFilters(input.filters),
      icon: input.icon ?? null,
      is_pinned: input.isPinned ?? false,
      is_system: false,
      name: input.name,
      sort_by: input.sortBy ?? "updated_at",
      sort_direction: input.sortDirection ?? "desc",
      user_id: userId,
      view_type: "custom",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await insertViewEvent("view_created", data.id as string, {
    filterCount: getLeadFilterSummary(input.filters).length,
    viewType: "custom",
  });
  await trackUserActivity("saved_view_created");

  return data as unknown as LeadSavedViewRecord;
}

export async function updateSavedView(viewId: string, input: UpdateSavedViewInput) {
  const { supabase, userId } = await withSystemViewsReady();
  const current = await getSavedViewById(viewId);

  if (!current) {
    throw new Error("Không tìm thấy góc nhìn lead.");
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.isPinned !== undefined) payload.is_pinned = input.isPinned;
  if (!current.is_system) {
    if (input.color !== undefined) payload.color = input.color;
    if (input.description !== undefined) payload.description = input.description;
    if (input.filters !== undefined) payload.filters = normalizeLeadFilters(input.filters);
    if (input.icon !== undefined) payload.icon = input.icon;
    if (input.name !== undefined) payload.name = input.name;
    if (input.sortBy !== undefined) payload.sort_by = input.sortBy;
    if (input.sortDirection !== undefined) payload.sort_direction = input.sortDirection;
  }

  const { data, error } = await supabase
    .from("lead_saved_views")
    .update(payload)
    .eq("id", viewId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await insertViewEvent("view_updated", viewId, {
    viewType: current.view_type,
  });

  return data as unknown as LeadSavedViewRecord;
}

export async function deleteSavedView(viewId: string) {
  const { supabase, userId } = await withSystemViewsReady();
  const current = await getSavedViewById(viewId);

  if (!current) {
    throw new Error("Không tìm thấy góc nhìn lead.");
  }

  if (current.is_system) {
    throw new Error("Không thể xóa góc nhìn thông minh mặc định.");
  }

  const { error } = await supabase
    .from("lead_saved_views")
    .delete()
    .eq("id", viewId)
    .eq("user_id", userId)
    .eq("is_system", false);

  if (error) {
    throw new Error(error.message);
  }

  await insertViewEvent("view_deleted", null, { viewType: current.view_type });
}

export async function pinSavedView(viewId: string) {
  await updateSavedView(viewId, { isPinned: true });
  await insertViewEvent("view_pinned", viewId);
}

export async function unpinSavedView(viewId: string) {
  await updateSavedView(viewId, { isPinned: false });
  await insertViewEvent("view_unpinned", viewId);
}

export async function incrementSavedViewUsage(viewId: string) {
  const { supabase, userId } = await withSystemViewsReady();
  const view = await getSavedViewById(viewId);

  if (!view) {
    return;
  }

  const { error } = await supabase
    .from("lead_saved_views")
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: Number(view.usage_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", viewId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await insertViewEvent("view_opened", viewId, {
    viewKey: view.view_key,
    viewType: view.view_type,
  });
  await trackUserActivity("saved_view_opened");
}

export async function getLeadsForSavedView(
  viewId: string,
  params: { limit?: number; page?: number } = {},
) {
  const view = await getSavedViewById(viewId);

  if (!view) {
    return null;
  }

  await incrementSavedViewUsage(viewId);
  const result = await getFilteredLeads({
    filters: view.filters,
    limit: params.limit,
    page: params.page,
    sortBy: view.sort_by ?? "updated_at",
    sortDirection: view.sort_direction ?? "desc",
  });

  return { result, view };
}

export async function getSavedViewsWithCounts() {
  const views = await getSavedViews();
  const counts = await Promise.all(
    views.map((view) => getFilteredLeadCount(view.filters).catch(() => 0)),
  );

  return views.map((view, index) => ({
    ...view,
    count: counts[index] ?? 0,
    filterSummary: getLeadFilterSummary(view.filters),
  }));
}
