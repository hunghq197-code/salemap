"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveLead,
  createLead,
  softDeleteLead,
  updateLead,
} from "@/lib/data/leads";
import { safeMarkChecklistItemCompleted } from "@/lib/data/beta-checklist";
import { createLeadNote } from "@/lib/data/lead-notes";
import { createReminder } from "@/lib/data/reminders";
import { parseLeadFormData } from "@/lib/validators/lead";
import { parseLeadNoteFormData } from "@/lib/validators/lead-note";
import { parseReminderFormData } from "@/lib/validators/reminder";

export async function createLeadAction(formData: FormData) {
  const parsed = parseLeadFormData(formData);

  if (!parsed.success) {
    redirect("/app/leads?create=1&toast=lead_invalid");
  }

  let leadId: string;

  try {
    leadId = await createLead(parsed.data);
    await safeMarkChecklistItemCompleted("create_first_lead");
    revalidatePath("/app/leads");
    revalidatePath("/app/dashboard");
  } catch {
    redirect("/app/leads?create=1&toast=error");
  }

  redirect(`/app/leads/${leadId}?toast=lead_created`);
}

export async function updateLeadAction(leadId: string, formData: FormData) {
  const parsed = parseLeadFormData(formData);

  if (!parsed.success) {
    redirect(`/app/leads/${leadId}?edit=1&toast=lead_invalid`);
  }

  try {
    await updateLead(leadId, parsed.data);
    revalidatePath("/app/leads");
    revalidatePath(`/app/leads/${leadId}`);
    revalidatePath("/app/dashboard");
  } catch {
    redirect(`/app/leads/${leadId}?edit=1&toast=error`);
  }

  redirect(`/app/leads/${leadId}?toast=lead_updated`);
}

export async function archiveLeadAction(leadId: string) {
  try {
    await archiveLead(leadId);
    revalidatePath("/app/leads");
    revalidatePath("/app/dashboard");
  } catch {
    redirect(`/app/leads/${leadId}?toast=error`);
  }

  redirect("/app/leads?toast=lead_archived");
}

export async function softDeleteLeadAction(leadId: string) {
  try {
    await softDeleteLead(leadId);
    revalidatePath("/app/leads");
    revalidatePath("/app/dashboard");
  } catch {
    redirect(`/app/leads/${leadId}?toast=error`);
  }

  redirect("/app/leads?toast=lead_deleted");
}

export async function createLeadNoteAction(formData: FormData) {
  const parsed = parseLeadNoteFormData(formData);
  const leadId = String(formData.get("leadId") || "");

  if (!parsed.success) {
    redirect(`/app/leads/${leadId}?toast=error`);
  }

  try {
    await createLeadNote(parsed.data);
    await safeMarkChecklistItemCompleted("add_first_note");

    if (parsed.data.createReminder) {
      await safeMarkChecklistItemCompleted("create_first_reminder");
    }

    revalidatePath(`/app/leads/${parsed.data.leadId}`);
    revalidatePath("/app/leads");
    revalidatePath("/app/reminders");
    revalidatePath("/app/dashboard");
  } catch {
    redirect(`/app/leads/${parsed.data.leadId}?toast=error`);
  }

  const toast = parsed.data.createReminder
    ? "lead_note_with_reminder_created"
    : "lead_note_created";

  redirect(`/app/leads/${parsed.data.leadId}?toast=${toast}`);
}

export async function createLeadReminderAction(formData: FormData) {
  const parsed = parseReminderFormData(formData);
  const leadId = String(formData.get("leadId") || "");

  if (!parsed.success) {
    redirect(`/app/leads/${leadId}?toast=error`);
  }

  try {
    await createReminder(parsed.data);
    await safeMarkChecklistItemCompleted("create_first_reminder");
    revalidatePath(`/app/leads/${leadId}`);
    revalidatePath("/app/reminders");
    revalidatePath("/app/dashboard");
  } catch {
    redirect(`/app/leads/${leadId}?toast=error`);
  }

  redirect(`/app/leads/${leadId}?toast=reminder_created`);
}
