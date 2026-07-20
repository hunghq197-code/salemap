import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import type { BulkActionInput } from "@/lib/validators/lead-cleanup";

export type BulkActionJobRecord = {
  action_type: string;
  completed_at: string | null;
  created_at: string | null;
  error_summary: Record<string, unknown> | null;
  failed_count: number | null;
  id: string;
  status: string;
  success_count: number | null;
  total_count: number | null;
};

type BulkActionJobDetail = BulkActionJobRecord & {
  payload: Record<string, unknown> | null;
  target_lead_ids: string[];
};

function cleanTextArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  ).slice(0, 50);
}

async function verifyOwnedLeadIds(leadIds: string[], includeDeleted = false) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  let query = supabase
    .from("leads")
    .select("id")
    .eq("user_id", userId)
    .in("id", leadIds);

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const ownedLeadIds = (data ?? []).map((lead) => String(lead.id));

  if (ownedLeadIds.length !== leadIds.length) {
    throw new Error("Chi duoc thao tac voi lead cua tai khoan hien tai.");
  }

  return { supabase, userId };
}

async function resolveTagIds(payload: Record<string, unknown>) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const tagIds = cleanTextArray(payload.tagIds);
  const tagNames = cleanTextArray(payload.tagNames)
    .flatMap((name) => name.split(","))
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 20);
  const resolvedIds = new Set<string>();

  if (tagIds.length > 0) {
    const { data, error } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", userId)
      .in("id", tagIds);

    if (error) {
      throw new Error(error.message);
    }

    (data ?? []).forEach((tag) => resolvedIds.add(String(tag.id)));
  }

  for (const tagName of Array.from(new Set(tagNames))) {
    const { data, error } = await supabase
      .from("tags")
      .upsert(
        {
          color: "#0f5f8f",
          name: tagName,
          user_id: userId,
        },
        { onConflict: "user_id,name" },
      )
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    resolvedIds.add(String(data.id));
  }

  return Array.from(resolvedIds);
}

async function addTagsToLeads(leadIds: string[], payload: Record<string, unknown>) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const tagIds = await resolveTagIds(payload);

  if (tagIds.length === 0) {
    throw new Error("Can chon hoac nhap tag.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("lead_tags")
    .select("lead_id,tag_id")
    .in("lead_id", leadIds)
    .in("tag_id", tagIds);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingKeys = new Set(
    (existing ?? []).map((row) => `${String(row.lead_id)}|${String(row.tag_id)}`),
  );
  const rowsToInsert = leadIds.flatMap((leadId) =>
    tagIds
      .filter((tagId) => !existingKeys.has(`${leadId}|${tagId}`))
      .map((tagId) => ({
        lead_id: leadId,
        tag_id: tagId,
      })),
  );

  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from("lead_tags").insert(rowsToInsert);

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function removeTagsFromLeads(leadIds: string[], payload: Record<string, unknown>) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const tagIds = await resolveTagIds(payload);

  if (tagIds.length === 0) {
    throw new Error("Can chon tag de go.");
  }

  const { error } = await supabase
    .from("lead_tags")
    .delete()
    .in("lead_id", leadIds)
    .in("tag_id", tagIds);

  if (error) {
    throw new Error(error.message);
  }
}

async function updateJob(
  jobId: string,
  payload: Partial<{
    completed_at: string;
    error_summary: Record<string, unknown>;
    failed_at: string;
    failed_count: number;
    status: string;
    success_count: number;
    updated_at: string;
  }>,
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { error } = await supabase
    .from("bulk_action_jobs")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createBulkActionJob(input: BulkActionInput) {
  const leadIds = Array.from(new Set(input.leadIds));

  if (leadIds.length === 0 || leadIds.length > 500) {
    throw new Error("Moi lan chi thao tac toi da 500 lead.");
  }

  const { supabase, userId } = await verifyOwnedLeadIds(
    leadIds,
    input.actionType === "restore",
  );
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("bulk_action_jobs")
    .insert({
      action_type: input.actionType,
      payload: input.payload,
      started_at: now,
      status: "running",
      target_lead_ids: leadIds,
      total_count: leadIds.length,
      user_id: userId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

export async function executeBulkActionJob(jobId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data: job, error } = await supabase
    .from("bulk_action_jobs")
    .select("id,action_type,target_lead_ids,payload,total_count")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!job) {
    throw new Error("Khong tim thay bulk action job.");
  }

  const leadIds = ((job.target_lead_ids ?? []) as string[]).slice(0, 500);
  const payload = ((job.payload ?? {}) as Record<string, unknown>) || {};
  const now = new Date().toISOString();

  try {
    if (job.action_type === "update_status") {
      const { error: updateError } = await supabase
        .from("leads")
        .update({ status: String(payload.status), updated_at: now })
        .eq("user_id", userId)
        .in("id", leadIds);

      if (updateError) throw updateError;
    } else if (job.action_type === "set_priority") {
      const { error: updateError } = await supabase
        .from("leads")
        .update({ priority: String(payload.priority), updated_at: now })
        .eq("user_id", userId)
        .in("id", leadIds);

      if (updateError) throw updateError;
    } else if (job.action_type === "add_tags") {
      await addTagsToLeads(leadIds, payload);
    } else if (job.action_type === "remove_tags") {
      await removeTagsFromLeads(leadIds, payload);
    } else if (job.action_type === "archive") {
      const { error: updateError } = await supabase
        .from("leads")
        .update({ archived_at: now, is_archived: true, updated_at: now })
        .eq("user_id", userId)
        .in("id", leadIds);

      if (updateError) throw updateError;
    } else if (job.action_type === "soft_delete") {
      const { error: updateError } = await supabase
        .from("leads")
        .update({ archived_at: now, deleted_at: now, is_archived: true, updated_at: now })
        .eq("user_id", userId)
        .in("id", leadIds);

      if (updateError) throw updateError;
    } else if (job.action_type === "restore") {
      const { error: updateError } = await supabase
        .from("leads")
        .update({ archived_at: null, deleted_at: null, is_archived: false, updated_at: now })
        .eq("user_id", userId)
        .in("id", leadIds);

      if (updateError) throw updateError;
    } else {
      throw new Error("Loai thao tac chua duoc ho tro.");
    }

    await updateJob(jobId, {
      completed_at: now,
      failed_count: 0,
      status: "completed",
      success_count: leadIds.length,
    });

    return {
      actionType: String(job.action_type),
      failedCount: 0,
      jobId,
      status: "completed",
      successCount: leadIds.length,
      totalCount: leadIds.length,
    };
  } catch (actionError) {
    await updateJob(jobId, {
      error_summary: {
        message: actionError instanceof Error ? actionError.message : "Bulk action failed",
      },
      failed_at: now,
      failed_count: leadIds.length,
      status: "failed",
      success_count: 0,
    });

    throw actionError;
  }
}

export async function runBulkAction(input: BulkActionInput) {
  const jobId = await createBulkActionJob(input);

  return executeBulkActionJob(jobId);
}

export async function getBulkActionJobs(params: { page?: number } = {}) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { count, data, error } = await supabase
    .from("bulk_action_jobs")
    .select(
      "id,action_type,status,total_count,success_count,failed_count,error_summary,completed_at,created_at",
      { count: "exact" },
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    if (error.code === "42P01") {
      return { items: [] as BulkActionJobRecord[], limit, page, total: 0, totalPages: 1 };
    }

    throw new Error(error.message);
  }

  return {
    items: (data ?? []) as BulkActionJobRecord[],
    limit,
    page,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

export async function getBulkActionJobById(jobId: string): Promise<BulkActionJobDetail | null> {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("bulk_action_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as BulkActionJobDetail | null;
}
