import type { DuplicateStrategy } from "@/lib/constants/import";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import type { ImportJobRecord } from "@/lib/data/import-jobs";
import { updateImportJob } from "@/lib/data/import-jobs";
import { getAllImportRows, updateImportRow } from "@/lib/data/import-rows";
import type { NormalizedImportLead } from "@/lib/import/normalize-import-row";

type ExecuteSummary = {
  failedRows: number;
  importedRows: number;
  skippedRows: number;
  updatedRows: number;
};

function cleanString(value?: string) {
  const clean = value?.trim();
  return clean || null;
}

function leadPayload(row: NormalizedImportLead, userId: string, fallbackSource: string) {
  const now = new Date().toISOString();

  return {
    address: cleanString(row.address),
    category: cleanString(row.category),
    email: cleanString(row.email),
    name: row.name || row.phone || row.email || row.website || "Khách chưa đặt tên",
    next_follow_up_at: row.next_follow_up_at
      ? new Date(`${row.next_follow_up_at}T09:00:00`).toISOString()
      : null,
    note_summary: cleanString(row.initial_note),
    phone: cleanString(row.phone),
    priority: row.priority || "medium",
    source: cleanString(row.source) || fallbackSource,
    status: row.status || "new",
    updated_at: now,
    user_id: userId,
    website: cleanString(row.website),
  };
}

async function ensureTagIds(userId: string, tagNames: string[]) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const tagIds: string[] = [];

  for (const tagName of Array.from(new Set(tagNames)).slice(0, 20)) {
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

    tagIds.push(String(data.id));
  }

  return tagIds;
}

async function attachTags(leadId: string, userId: string, tagNames?: string[]) {
  if (!tagNames || tagNames.length === 0) {
    return;
  }

  const { supabase } = await createAuthedSupabaseServerClient();
  const tagIds = await ensureTagIds(userId, tagNames);

  if (tagIds.length === 0) {
    return;
  }

  const { error } = await supabase.from("lead_tags").upsert(
    tagIds.map((tagId) => ({
      lead_id: leadId,
      tag_id: tagId,
    })),
    { onConflict: "lead_id,tag_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function addInitialNote(leadId: string, userId: string, row: NormalizedImportLead) {
  if (!row.initial_note) {
    return;
  }

  const { supabase } = await createAuthedSupabaseServerClient();
  const { error } = await supabase.from("lead_notes").insert({
    content: row.initial_note,
    contacted_at: new Date().toISOString(),
    interaction_type: "other",
    lead_id: leadId,
    outcome: "imported",
    status_after: row.status || "new",
    status_before: null,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function addFollowUpReminder(leadId: string, userId: string, row: NormalizedImportLead) {
  if (!row.next_follow_up_at) {
    return;
  }

  const { supabase } = await createAuthedSupabaseServerClient();
  const remindAt = new Date(`${row.next_follow_up_at}T09:00:00`).toISOString();
  const { error } = await supabase.from("reminders").insert({
    description: row.initial_note || null,
    lead_id: leadId,
    remind_at: remindAt,
    status: "pending",
    title: `Follow-up ${row.name || "lead import"}`,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function createLeadFromRow(
  row: NormalizedImportLead,
  userId: string,
  fallbackSource: string,
) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .insert(leadPayload(row, userId, fallbackSource))
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const leadId = String(data.id);
  await addInitialNote(leadId, userId, row);
  await addFollowUpReminder(leadId, userId, row);
  await attachTags(leadId, userId, row.tags);

  return leadId;
}

async function updateLeadFromRow(
  leadId: string,
  row: NormalizedImportLead,
  userId: string,
  fallbackSource: string,
) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const payload = leadPayload(row, userId, fallbackSource);
  const { error } = await supabase
    .from("leads")
    .update({
      address: payload.address,
      category: payload.category,
      email: payload.email,
      name: payload.name,
      next_follow_up_at: payload.next_follow_up_at,
      note_summary: payload.note_summary,
      phone: payload.phone,
      priority: payload.priority,
      source: payload.source,
      status: payload.status,
      updated_at: payload.updated_at,
      website: payload.website,
    })
    .eq("id", leadId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  await addInitialNote(leadId, userId, row);
  await addFollowUpReminder(leadId, userId, row);
  await attachTags(leadId, userId, row.tags);
}

export async function executeImportJob(
  job: ImportJobRecord,
  duplicateStrategy: DuplicateStrategy,
) {
  const { userId } = await createAuthedSupabaseServerClient();
  const rows = await getAllImportRows(job.id, ["valid", "duplicate"]);
  const fallbackSource = job.file_type === "xlsx" ? "import_excel" : "import_csv";
  const summary: ExecuteSummary = {
    failedRows: 0,
    importedRows: 0,
    skippedRows: 0,
    updatedRows: 0,
  };

  await updateImportJob(job.id, {
    duplicate_strategy: duplicateStrategy,
    started_at: new Date().toISOString(),
    status: "importing",
  });

  for (const row of rows) {
    try {
      const mapped = row.mapped_data as NormalizedImportLead | null;

      if (!mapped) {
        throw new Error("Missing mapped data.");
      }

      if (row.status === "duplicate" && duplicateStrategy === "skip") {
        await updateImportRow(row.id, { status: "skipped" });
        summary.skippedRows += 1;
        continue;
      }

      if (row.status === "duplicate" && duplicateStrategy === "update_existing") {
        if (!row.duplicate_lead_id) {
          throw new Error("Missing duplicate lead id.");
        }

        await updateLeadFromRow(row.duplicate_lead_id, mapped, userId, fallbackSource);
        await updateImportRow(row.id, {
          imported_lead_id: row.duplicate_lead_id,
          status: "updated",
        });
        summary.updatedRows += 1;
        continue;
      }

      const leadId = await createLeadFromRow(mapped, userId, fallbackSource);
      await updateImportRow(row.id, {
        imported_lead_id: leadId,
        status: "imported",
      });
      summary.importedRows += 1;
    } catch {
      await updateImportRow(row.id, {
        status: "failed",
        validation_errors: [
          {
            code: "IMPORT_FAILED",
            field: "row",
            message: "Không thể import dòng này. Vui lòng kiểm tra lại dữ liệu.",
          },
        ],
      });
      summary.failedRows += 1;
    }
  }

  await updateImportJob(job.id, {
    completed_at: new Date().toISOString(),
    failed_rows: summary.failedRows,
    imported_rows: summary.importedRows,
    skipped_rows: summary.skippedRows,
    status: "completed",
    updated_rows: summary.updatedRows,
  });

  return summary;
}
