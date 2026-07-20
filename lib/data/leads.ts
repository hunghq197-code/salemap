import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { assignTagsToLead, createTag } from "@/lib/data/tags";
import type { TagRecord } from "@/lib/data/tags";
import type { LeadFormInput } from "@/lib/validators/lead";

export type LeadRecord = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  external_source: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string | null;
  place_id: string | null;
  status: string | null;
  priority: string | null;
  category: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  note_summary: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  is_archived: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  tags: TagRecord[];
};

export type LeadListParams = {
  archived?: string;
  deleted?: string;
  limit?: number;
  page?: number;
  q?: string;
  sort?: "newest" | "oldest" | "next_follow_up" | string;
  status?: string;
  tagId?: string;
};

export type LeadListResult = {
  items: LeadRecord[];
  limit: number;
  page: number;
  total: number;
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

function isMissingMapLeadColumn(error: { code?: string; message?: string }) {
  const message = error.message ?? "";

  return (
    error.code === "42703" &&
    /(external_source|place_id|google_maps_url|rating|user_ratings_total)/i.test(message)
  );
}

function normalizeWebsite(website?: string) {
  if (!website) {
    return undefined;
  }

  if (/^https?:\/\//i.test(website)) {
    return website;
  }

  return `https://${website}`;
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

async function assertOwnLead(leadId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id,name,status")
    .eq("id", leadId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Không tìm thấy lead.");
  }

  return { lead: data as { id: string; name: string; status: string | null }, supabase, userId };
}

async function resolveTagIds(input: LeadFormInput) {
  const createdTagIds: string[] = [];
  const tagNames =
    input.newTags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 6) ?? [];

  for (const tagName of Array.from(new Set(tagNames))) {
    const tag = await createTag(tagName);

    if (tag) {
      createdTagIds.push(tag.id);
    }
  }

  return Array.from(new Set([...input.tagIds, ...createdTagIds]));
}

function buildLeadPayload(input: LeadFormInput) {
  return {
    address: input.address,
    category: input.category,
    email: input.email,
    name: input.name,
    note_summary: input.noteSummary,
    phone: input.phone,
    priority: input.priority || "medium",
    source: input.source || "manual",
    status: input.status || "new",
    updated_at: new Date().toISOString(),
    website: normalizeWebsite(input.website),
  };
}

function getPaging(params: LeadListParams) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { from, limit, page, to };
}

export async function getLeads(params: LeadListParams = {}): Promise<LeadListResult> {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { from, limit, page, to } = getPaging(params);
  const cleanQuery = params.q?.replace(/[%_,]/g, " ").trim();

  let leadIdsForTag: string[] | null = null;

  if (params.tagId) {
    const { data, error } = await supabase
      .from("lead_tags")
      .select("lead_id,tags!inner(user_id)")
      .eq("tag_id", params.tagId)
      .eq("tags.user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    leadIdsForTag = (data ?? []).map((item) => item.lead_id as string);

    if (leadIdsForTag.length === 0) {
      return { items: [], limit, page, total: 0 };
    }
  }

  function buildQuery(selectFields: string) {
    let query = supabase
      .from("leads")
      .select(selectFields, { count: "exact" })
      .eq("user_id", userId);

    if (params.deleted === "1") {
      query = query.not("deleted_at", "is", null);
    } else {
      query = query.is("deleted_at", null);

      if (params.archived === "1") {
        query = query.eq("is_archived", true);
      } else {
        query = query.eq("is_archived", false);
      }
    }

    if (cleanQuery) {
      query = query.or(
        `name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%,address.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%`,
      );
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (leadIdsForTag) {
      query = query.in("id", leadIdsForTag);
    }

    if (params.sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (params.sort === "next_follow_up") {
      query = query.order("next_follow_up_at", {
        ascending: true,
        nullsFirst: false,
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    return query.range(from, to);
  }

  let { count, data, error } = await buildQuery(LEAD_SELECT_WITH_MAP);

  if (error && isMissingMapLeadColumn(error)) {
    const fallbackResult = await buildQuery(LEAD_SELECT_CORE);
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
  };
}

export async function getLeadById(leadId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const buildQuery = (selectFields: string) =>
    supabase
      .from("leads")
      .select(selectFields)
      .eq("id", leadId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();

  let { data, error } = await buildQuery(LEAD_SELECT_WITH_MAP);

  if (error && isMissingMapLeadColumn(error)) {
    const fallbackResult = await buildQuery(LEAD_SELECT_CORE);
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return data ? toLeadRecord(data as unknown as RawLead) : null;
}

export async function createLead(input: LeadFormInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      ...buildLeadPayload(input),
      user_id: userId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await assignTagsToLead(data.id as string, await resolveTagIds(input));
  await trackUserActivity("lead_created");

  return data.id as string;
}

export async function updateLead(leadId: string, input: LeadFormInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  await assertOwnLead(leadId);

  const { error } = await supabase
    .from("leads")
    .update(buildLeadPayload(input))
    .eq("id", leadId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await assignTagsToLead(leadId, await resolveTagIds(input));
}

export async function archiveLead(leadId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  await assertOwnLead(leadId);

  const { error } = await supabase
    .from("leads")
    .update({
      is_archived: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteLeadSoft(leadId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  await assertOwnLead(leadId);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("leads")
    .update({
      deleted_at: now,
      is_archived: true,
      updated_at: now,
    })
    .eq("id", leadId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export const softDeleteLead = deleteLeadSoft;
