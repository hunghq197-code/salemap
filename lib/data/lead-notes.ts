import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { createReminder } from "@/lib/data/reminders";
import type { LeadNoteFormInput } from "@/lib/validators/lead-note";

export type LeadNoteRecord = {
  id: string;
  lead_id: string;
  interaction_type: string | null;
  outcome: string | null;
  content: string;
  status_before: string | null;
  status_after: string | null;
  contacted_at: string | null;
  created_at: string | null;
};

async function getOwnLead(leadId: string) {
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

  return {
    lead: data as { id: string; name: string; status: string | null },
    supabase,
    userId,
  };
}

export async function getLeadNotes(leadId: string) {
  const { supabase, userId } = await getOwnLead(leadId);
  const { data, error } = await supabase
    .from("lead_notes")
    .select("id,lead_id,interaction_type,outcome,content,status_before,status_after,contacted_at,created_at")
    .eq("lead_id", leadId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("contacted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as LeadNoteRecord[];
}

export async function createLeadNote(input: LeadNoteFormInput) {
  const { lead, supabase, userId } = await getOwnLead(input.leadId);
  const statusAfter = input.statusAfter || lead.status || "new";
  const now = new Date().toISOString();

  const { error } = await supabase.from("lead_notes").insert({
    content: input.content,
    contacted_at: now,
    interaction_type: input.interactionType,
    lead_id: input.leadId,
    outcome: input.outcome || "other",
    status_after: statusAfter,
    status_before: lead.status,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  await trackUserActivity("lead_note_created");

  const updatePayload: Record<string, string | null> = {
    last_contacted_at: now,
    note_summary: input.content.slice(0, 200),
    updated_at: now,
  };

  if (input.statusAfter) {
    updatePayload.status = input.statusAfter;
  }

  if (input.createReminder && input.remindAt) {
    updatePayload.next_follow_up_at = new Date(input.remindAt).toISOString();
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update(updatePayload)
    .eq("id", input.leadId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (input.createReminder && input.remindAt && input.reminderTitle) {
    await createReminder({
      description: input.reminderDescription || input.content.slice(0, 500),
      leadId: input.leadId,
      remindAt: input.remindAt,
      title: input.reminderTitle,
    });
  }
}

export async function deleteLeadNote(noteId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_notes")
    .select("id")
    .eq("id", noteId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Không tìm thấy ghi chú.");
  }

  const { error: updateError } = await supabase
    .from("lead_notes")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
