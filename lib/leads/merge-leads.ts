import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import {
  MERGE_FIELD_OPTIONS,
  type MergeFieldOption,
} from "@/lib/constants/lead-cleanup";
import type { MergeLeadsInput } from "@/lib/validators/lead-cleanup";

type MergeLeadRecord = {
  address: string | null;
  category: string | null;
  created_at: string | null;
  deleted_at?: string | null;
  email: string | null;
  id: string;
  merged_at?: string | null;
  name: string;
  next_follow_up_at: string | null;
  note_summary: string | null;
  phone: string | null;
  priority: string | null;
  source: string | null;
  status: string | null;
  updated_at: string | null;
  user_id?: string;
  website: string | null;
};

export type MergeGroupDetail = {
  confidence_score: number | null;
  created_at: string | null;
  duplicate_reason: string | null;
  id: string;
  lead_ids: string[];
  leads: MergeLeadRecord[];
  notesCountByLeadId: Record<string, number>;
  primary_lead_id: string | null;
  remindersCountByLeadId: Record<string, number>;
  status: string;
  suggestedPrimaryLeadId: string | null;
  tagsByLeadId: Record<string, Array<{ color: string | null; id: string; name: string }>>;
};

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

function getValue(lead: MergeLeadRecord, field: MergeFieldOption) {
  return lead[field] ?? null;
}

function fieldHasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function completenessScore(lead: MergeLeadRecord) {
  return MERGE_FIELD_OPTIONS.reduce(
    (score, field) => score + (fieldHasValue(getValue(lead, field)) ? 1 : 0),
    0,
  );
}

function pickSuggestedPrimary(leads: MergeLeadRecord[]) {
  return [...leads].sort((a, b) => {
    const scoreDiff = completenessScore(b) - completenessScore(a);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const updatedDiff =
      new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();

    if (updatedDiff !== 0) {
      return updatedDiff;
    }

    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
  })[0]?.id ?? null;
}

async function fetchMergeLeads(leadIds: string[], userId: string) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id,user_id,name,phone,email,website,address,category,status,priority,source,note_summary,next_follow_up_at,created_at,updated_at,deleted_at,merged_at",
    )
    .eq("user_id", userId)
    .in("id", leadIds);

  if (error) {
    if (error.code === "42703") {
      throw new Error("Chưa chạy SQL lead-cleanup-bulk-actions-schema.sql.");
    }

    throw new Error(error.message);
  }

  return (data ?? []) as MergeLeadRecord[];
}

async function getCounts(table: "lead_notes" | "reminders", leadIds: string[]) {
  if (leadIds.length === 0) {
    return {};
  }

  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .select("lead_id")
    .eq("user_id", userId)
    .in("lead_id", leadIds)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const leadId = String(row.lead_id || "");

    if (leadId) {
      acc[leadId] = (acc[leadId] ?? 0) + 1;
    }

    return acc;
  }, {});
}

async function getTagsByLeadId(leadIds: string[]) {
  if (leadIds.length === 0) {
    return {};
  }

  const { supabase } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_tags")
    .select("lead_id,tags(id,name,color)")
    .in("lead_id", leadIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<
    Record<string, Array<{ color: string | null; id: string; name: string }>>
  >((acc, row) => {
    const leadId = String(row.lead_id || "");
    const tagValue = row.tags;
    const tag = Array.isArray(tagValue) ? tagValue[0] : tagValue;

    if (leadId && tag) {
      acc[leadId] = [...(acc[leadId] ?? []), tag as { color: string | null; id: string; name: string }];
    }

    return acc;
  }, {});
}

export async function getMergeGroupById(groupId: string): Promise<MergeGroupDetail | null> {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data: group, error } = await supabase
    .from("lead_merge_groups")
    .select("id,status,duplicate_reason,confidence_score,lead_ids,primary_lead_id,created_at")
    .eq("id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      return null;
    }

    throw new Error(error.message);
  }

  if (!group) {
    return null;
  }

  const leadIds = (group.lead_ids ?? []) as string[];
  const [leads, notesCountByLeadId, remindersCountByLeadId, tagsByLeadId] = await Promise.all([
    fetchMergeLeads(leadIds, userId),
    getCounts("lead_notes", leadIds),
    getCounts("reminders", leadIds),
    getTagsByLeadId(leadIds),
  ]);

  return {
    confidence_score: group.confidence_score as number | null,
    created_at: group.created_at as string | null,
    duplicate_reason: group.duplicate_reason as string | null,
    id: group.id as string,
    lead_ids: leadIds,
    leads,
    notesCountByLeadId,
    primary_lead_id: group.primary_lead_id as string | null,
    remindersCountByLeadId,
    status: group.status as string,
    suggestedPrimaryLeadId: pickSuggestedPrimary(leads),
    tagsByLeadId,
  };
}

function buildMergedPayload(leads: MergeLeadRecord[], input: MergeLeadsInput) {
  const byId = new Map(leads.map((lead) => [lead.id, lead]));
  const primary = byId.get(input.primaryLeadId);

  if (!primary) {
    throw new Error("Lead chính không hợp lệ.");
  }

  return MERGE_FIELD_OPTIONS.reduce<Record<string, string | null>>((payload, field) => {
    const selectedLeadId = input.fieldStrategy?.[field];
    const selectedLead = selectedLeadId ? byId.get(selectedLeadId) : null;
    let value = selectedLead ? getValue(selectedLead, field) : getValue(primary, field);

    if (!fieldHasValue(value)) {
      value = leads.map((lead) => getValue(lead, field)).find(fieldHasValue) ?? null;
    }

    payload[field] = value ? String(value) : null;

    return payload;
  }, {});
}

async function moveTagsToPrimary(primaryLeadId: string, mergedLeadIds: string[]) {
  if (mergedLeadIds.length === 0) {
    return;
  }

  const { supabase } = await createAuthedSupabaseServerClient();
  const { data: currentTags, error: currentError } = await supabase
    .from("lead_tags")
    .select("tag_id")
    .eq("lead_id", primaryLeadId);

  if (currentError) {
    throw new Error(currentError.message);
  }

  const existingTagIds = new Set((currentTags ?? []).map((row) => String(row.tag_id)));
  const { data: mergedTags, error: mergedError } = await supabase
    .from("lead_tags")
    .select("tag_id")
    .in("lead_id", mergedLeadIds);

  if (mergedError) {
    throw new Error(mergedError.message);
  }

  const tagIdsToAdd = uniqueIds(
    (mergedTags ?? [])
      .map((row) => String(row.tag_id))
      .filter((tagId) => !existingTagIds.has(tagId)),
  );

  if (tagIdsToAdd.length > 0) {
    const { error: insertError } = await supabase.from("lead_tags").insert(
      tagIdsToAdd.map((tagId) => ({
        lead_id: primaryLeadId,
        tag_id: tagId,
      })),
    );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const { error: deleteError } = await supabase
    .from("lead_tags")
    .delete()
    .in("lead_id", mergedLeadIds);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

async function safeMoveAttachments(primaryLeadId: string, mergedLeadIds: string[]) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();

  for (const tableName of ["lead_attachments", "attachments"]) {
    const { error } = await supabase
      .from(tableName)
      .update({ lead_id: primaryLeadId, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .in("lead_id", mergedLeadIds);

    if (error && error.code !== "42P01" && error.code !== "42703") {
      throw new Error(error.message);
    }
  }
}

export async function previewLeadMerge(input: MergeLeadsInput) {
  const { userId } = await createAuthedSupabaseServerClient();
  const leadIds = uniqueIds([input.primaryLeadId, ...input.mergedLeadIds]);
  const leads = await fetchMergeLeads(leadIds, userId);

  if (leads.length !== leadIds.length) {
    throw new Error("Chỉ được gộp lead của tài khoản hiện tại.");
  }

  return buildMergedPayload(leads, input);
}

export async function mergeLeads(input: MergeLeadsInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const mergedLeadIds = uniqueIds(input.mergedLeadIds.filter((leadId) => leadId !== input.primaryLeadId));
  const allLeadIds = uniqueIds([input.primaryLeadId, ...mergedLeadIds]);

  if (mergedLeadIds.length === 0) {
    throw new Error("Cần chọn ít nhất một lead để gộp.");
  }

  const leads = await fetchMergeLeads(allLeadIds, userId);

  if (leads.length !== allLeadIds.length) {
    throw new Error("Chỉ được gộp lead của tài khoản hiện tại.");
  }

  if (leads.some((lead) => lead.deleted_at || lead.merged_at)) {
    throw new Error("Không thể gộp lead đã xóa hoặc đã được gộp.");
  }

  if (input.mergeGroupId) {
    const group = await getMergeGroupById(input.mergeGroupId);
    const groupIds = new Set(group?.lead_ids ?? []);

    if (!group || allLeadIds.some((leadId) => !groupIds.has(leadId))) {
      throw new Error("Nhóm lead trùng không hợp lệ.");
    }
  }

  const beforeSnapshot = leads.map((lead) => ({ ...lead }));
  const mergedPayload = {
    ...buildMergedPayload(leads, input),
    updated_at: new Date().toISOString(),
  };

  const { data: mergedLead, error: updatePrimaryError } = await supabase
    .from("leads")
    .update(mergedPayload)
    .eq("id", input.primaryLeadId)
    .eq("user_id", userId)
    .select("id,name,phone,email,website,address,status,priority,source,note_summary,next_follow_up_at,updated_at")
    .single();

  if (updatePrimaryError) {
    throw new Error(updatePrimaryError.message);
  }

  const now = new Date().toISOString();
  const { error: notesError } = await supabase
    .from("lead_notes")
    .update({ lead_id: input.primaryLeadId, updated_at: now })
    .eq("user_id", userId)
    .in("lead_id", mergedLeadIds);

  if (notesError) {
    throw new Error(notesError.message);
  }

  const { error: remindersError } = await supabase
    .from("reminders")
    .update({ lead_id: input.primaryLeadId, updated_at: now })
    .eq("user_id", userId)
    .in("lead_id", mergedLeadIds);

  if (remindersError) {
    throw new Error(remindersError.message);
  }

  await moveTagsToPrimary(input.primaryLeadId, mergedLeadIds);
  await safeMoveAttachments(input.primaryLeadId, mergedLeadIds);

  const { error: archiveError } = await supabase
    .from("leads")
    .update({
      archived_at: now,
      is_archived: true,
      merged_at: now,
      merged_into_lead_id: input.primaryLeadId,
      updated_at: now,
    })
    .eq("user_id", userId)
    .in("id", mergedLeadIds);

  if (archiveError) {
    throw new Error(archiveError.message);
  }

  const { error: eventError } = await supabase.from("lead_merge_events").insert({
    after_snapshot: mergedLead,
    before_snapshot: beforeSnapshot,
    merge_group_id: input.mergeGroupId ?? null,
    merge_strategy: input.fieldStrategy ?? {},
    merged_lead_ids: mergedLeadIds,
    primary_lead_id: input.primaryLeadId,
    user_id: userId,
  });

  if (eventError) {
    throw new Error(eventError.message);
  }

  if (input.mergeGroupId) {
    const { error: groupError } = await supabase
      .from("lead_merge_groups")
      .update({
        merged_at: now,
        primary_lead_id: input.primaryLeadId,
        status: "merged",
        updated_at: now,
      })
      .eq("id", input.mergeGroupId)
      .eq("user_id", userId);

    if (groupError) {
      throw new Error(groupError.message);
    }
  }

  return {
    mergedLead,
    summary: {
      mergedLeadCount: mergedLeadIds.length,
      movedNotes: true,
      movedReminders: true,
      movedTags: true,
    },
  };
}

export async function dismissMergeGroup(groupId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("lead_merge_groups")
    .update({
      dismissed_at: now,
      status: "dismissed",
      updated_at: now,
    })
    .eq("id", groupId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Không tìm thấy nhóm lead trùng.");
  }
}

export async function getLeadMergeMetadata(leadId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .select("merged_into_lead_id,merged_at")
    .eq("id", leadId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "42703") {
      return {
        mergedIntoLeadId: null,
        mergedLeadCount: 0,
      };
    }

    throw new Error(error.message);
  }

  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("merged_into_lead_id", leadId);

  return {
    mergedIntoLeadId: (lead?.merged_into_lead_id as string | null | undefined) ?? null,
    mergedLeadCount: count ?? 0,
  };
}
