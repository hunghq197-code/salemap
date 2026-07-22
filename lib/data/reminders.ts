import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { createNotification } from "@/lib/data/notifications";
import { safeMarkActivationStepForUser } from "@/lib/data/onboarding";
import { ACTIVE_TASK_STATUSES, COMPLETED_TASK_STATUSES } from "@/lib/constants/tasks";
import type { ReminderFormInput, ReminderTab } from "@/lib/validators/reminder";

export type ReminderRecord = {
  id: string;
  lead_id: string | null;
  title: string;
  description: string | null;
  remind_at: string;
  status: string | null;
  completed_at: string | null;
  created_at: string | null;
  email_sent_at?: string | null;
  last_notified_at?: string | null;
  notification_sent_at?: string | null;
  leads?:
    | {
        id: string;
        name: string;
        phone: string | null;
        status: string | null;
      }
    | Array<{
        id: string;
        name: string;
        phone: string | null;
        status: string | null;
      }>
    | null;
};

type ReminderListParams = {
  tab?: ReminderTab;
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfTomorrow() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

async function assertOwnReminder(reminderId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("id,lead_id,status,remind_at")
    .eq("id", reminderId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Không tìm thấy nhắc việc.");
  }

  return {
    reminder: data as {
      id: string;
      lead_id: string | null;
      remind_at: string | null;
      status: string | null;
    },
    supabase,
    userId,
  };
}

async function assertOwnLeadId(leadId?: string | null) {
  if (!leadId) {
    return;
  }

  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Lead không hợp lệ.");
  }
}

async function syncLeadNextFollowUp(leadId?: string | null) {
  if (!leadId) {
    return;
  }

  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("remind_at")
    .eq("lead_id", leadId)
    .eq("user_id", userId)
    .in("status", [...ACTIVE_TASK_STATUSES])
    .is("deleted_at", null)
    .order("remind_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      next_follow_up_at: data?.[0]?.remind_at ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

function resolveReminderTab(params?: ReminderTab | ReminderListParams) {
  if (!params) {
    return "today";
  }

  return typeof params === "string" ? params : params.tab || "today";
}

export async function getReminders(params?: ReminderTab | ReminderListParams) {
  const tab = resolveReminderTab(params);
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const todayStart = startOfToday().toISOString();
  const tomorrowStart = startOfTomorrow().toISOString();

  let query = supabase
    .from("reminders")
    .select("id,lead_id,title,description,remind_at,status,completed_at,created_at,notification_sent_at,email_sent_at,last_notified_at,leads(id,name,phone,status)")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (tab === "done") {
    query = query.in("status", [...COMPLETED_TASK_STATUSES]).order("completed_at", { ascending: false });
  } else {
    query = query.in("status", [...ACTIVE_TASK_STATUSES]);

    if (tab === "overdue") {
      query = query.lt("remind_at", todayStart).order("remind_at", { ascending: true });
    } else if (tab === "upcoming") {
      query = query.gte("remind_at", tomorrowStart).order("remind_at", { ascending: true });
    } else {
      query = query
        .gte("remind_at", todayStart)
        .lt("remind_at", tomorrowStart)
        .order("remind_at", { ascending: true });
    }
  }

  const { data, error } = await query.limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReminderRecord[];
}

export async function createReminder(input: ReminderFormInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  await assertOwnLeadId(input.leadId);

  const remindAt = new Date(input.remindAt).toISOString();
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      description: input.description,
      lead_id: input.leadId,
      priority: "medium",
      remind_at: remindAt,
      status: "pending",
      task_type: "follow_up",
      title: input.title,
      user_id: userId,
    })
    .select("id,lead_id,leads(id,name)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncLeadNextFollowUp(data.lead_id as string | null);
  const lead = Array.isArray(data.leads) ? data.leads[0] : data.leads;

  await createNotification({
    actionUrl: data.lead_id ? `/app/leads/${data.lead_id}` : "/app/tasks",
    content: lead?.name
      ? `Đã tạo lịch follow-up cho ${lead.name}.`
      : "Đã tạo lịch follow-up mới.",
    relatedLeadId: data.lead_id as string | null,
    relatedReminderId: data.id as string,
    title: "Đã tạo lịch follow-up",
    type: "reminder_created",
    userId,
  });
  await trackUserActivity("reminder_created");
  void safeMarkActivationStepForUser(supabase, userId, "created_first_task");

  return data.id as string;
}

export async function completeReminder(reminderId: string) {
  const { reminder, supabase, userId } = await assertOwnReminder(reminderId);
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("reminders")
    .update({
      completed_at: now,
      status: "completed",
      updated_at: now,
    })
    .eq("id", reminderId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await syncLeadNextFollowUp(reminder.lead_id);
  await trackUserActivity("reminder_completed");
  void safeMarkActivationStepForUser(supabase, userId, "completed_first_task");
}

export async function snoozeReminder(reminderId: string, newRemindAt?: string) {
  const { reminder, supabase, userId } = await assertOwnReminder(reminderId);
  const next = newRemindAt ? new Date(newRemindAt) : new Date();

  if (!newRemindAt) {
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
  }

  if (Number.isNaN(next.getTime())) {
    throw new Error("Thời gian nhắc việc chưa hợp lệ.");
  }

  const { error } = await supabase
    .from("reminders")
    .update({
      remind_at: next.toISOString(),
      snoozed_from: reminder.remind_at,
      snooze_count: 1,
      status: "snoozed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reminderId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await syncLeadNextFollowUp(reminder.lead_id);
}

export async function deleteReminder(reminderId: string) {
  const { reminder, supabase, userId } = await assertOwnReminder(reminderId);
  const { error } = await supabase
    .from("reminders")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reminderId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await syncLeadNextFollowUp(reminder.lead_id);
}
