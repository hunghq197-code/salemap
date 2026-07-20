import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import type { LeadRecord } from "@/lib/data/leads";
import type { TagRecord } from "@/lib/data/tags";
import {
  buildLeadFilterQuery,
  normalizeLeadFilters,
  type LeadFilters,
} from "@/lib/leads/lead-filters";
import { SMART_VIEW_DEFINITIONS } from "@/lib/constants/lead-pipeline";

export type FilteredLeadListParams = {
  filters?: LeadFilters;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

type RawLead = Omit<LeadRecord, "tags"> & {
  lead_tags?: Array<{
    tags?: TagRecord | TagRecord[] | null;
  }> | null;
};

const LEAD_SELECT_WITH_MAP =
  "id,name,phone,email,website,address,source,external_source,place_id,google_maps_url,latitude,longitude,rating,user_ratings_total,status,priority,category,note_summary,last_contacted_at,next_follow_up_at,is_archived,created_at,updated_at,lead_tags(tags(id,name,color))";

const LEAD_SELECT_CORE =
  "id,name,phone,email,website,address,source,latitude,longitude,status,priority,category,note_summary,last_contacted_at,next_follow_up_at,is_archived,created_at,updated_at,lead_tags(tags(id,name,color))";

function isMissingOptionalLeadColumn(error: { code?: string; message?: string }) {
  const message = error.message ?? "";

  return (
    error.code === "42703" &&
    /(external_source|place_id|google_maps_url|rating|user_ratings_total|status_changed_at|pipeline_position)/i.test(message)
  );
}

function toLeadRecord(raw: RawLead): LeadRecord {
  const { lead_tags: leadTags, ...lead } = raw;
  const tags =
    leadTags
      ?.map((item) => {
        const tag = item.tags;
        return Array.isArray(tag) ? tag[0] : tag;
      })
      .filter((tag): tag is TagRecord => Boolean(tag)) ?? [];

  return {
    ...lead,
    external_source: lead.external_source ?? null,
    google_maps_url: lead.google_maps_url ?? null,
    place_id: lead.place_id ?? null,
    rating: lead.rating ?? null,
    tags,
    user_ratings_total: lead.user_ratings_total ?? null,
  };
}

function getPaging(params: FilteredLeadListParams) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { from, limit, page, to };
}

async function getLeadIdsForTags(filters: LeadFilters, userId: string) {
  const tagIds = filters.tagIds ?? [];
  const tagNames = filters.tagNames ?? [];

  if (tagIds.length === 0 && tagNames.length === 0) {
    return null;
  }

  const { supabase } = await createAuthedSupabaseServerClient();
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
    throw new Error(error.message);
  }

  return Array.from(new Set((leadTags ?? []).map((row) => String(row.lead_id))));
}

function applySort(query: any, sortBy?: string, sortDirection?: "asc" | "desc") {
  const direction = sortDirection || "desc";
  const safeSort = [
    "created_at",
    "name",
    "next_follow_up_at",
    "priority",
    "status_changed_at",
    "updated_at",
  ].includes(sortBy || "")
    ? sortBy!
    : "updated_at";

  return query.order(safeSort, {
    ascending: direction === "asc",
    nullsFirst: false,
  });
}

async function buildFilteredQuery(selectFields: string, params: FilteredLeadListParams) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const filters = normalizeLeadFilters(params.filters ?? {});
  const leadIdsForTags = await getLeadIdsForTags(filters, userId);
  let query = buildLeadFilterQuery(
    supabase.from("leads").select(selectFields, { count: "exact" }) as any,
    filters,
    userId,
  ) as any;

  if (leadIdsForTags) {
    if (leadIdsForTags.length === 0) {
      return { query: null, supabase, userId };
    }

    query = query.in("id", leadIdsForTags);
  }

  return {
    query: applySort(query, params.sortBy, params.sortDirection),
    supabase,
    userId,
  };
}

export async function getFilteredLeads(params: FilteredLeadListParams = {}) {
  const { from, limit, page, to } = getPaging(params);
  let { query } = await buildFilteredQuery(LEAD_SELECT_WITH_MAP, params);

  if (!query) {
    return { items: [], limit, page, total: 0, totalPages: 1 };
  }

  let { count, data, error } = await query.range(from, to);

  if (error && isMissingOptionalLeadColumn(error)) {
    const fallback = await buildFilteredQuery(LEAD_SELECT_CORE, params);
    query = fallback.query;

    if (!query) {
      return { items: [], limit, page, total: 0, totalPages: 1 };
    }

    const fallbackResult = await query.range(from, to);
    count = fallbackResult.count;
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: ((data ?? []) as unknown as RawLead[]).map(toLeadRecord),
    limit,
    page,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

export async function getFilteredLeadCount(filters: LeadFilters = {}) {
  const { query } = await buildFilteredQuery("id", { filters, limit: 1 });

  if (!query) {
    return 0;
  }

  const { count, error } = await query.range(0, 0);

  if (error) {
    if (error.code === "42P01" || isMissingOptionalLeadColumn(error)) {
      return 0;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getSmartViewCounts() {
  const entries = await Promise.all(
    Object.entries(SMART_VIEW_DEFINITIONS).map(async ([key, definition]) => [
      key,
      await getFilteredLeadCount(definition.filters as LeadFilters),
    ]),
  );

  return Object.fromEntries(entries) as Record<keyof typeof SMART_VIEW_DEFINITIONS, number>;
}
