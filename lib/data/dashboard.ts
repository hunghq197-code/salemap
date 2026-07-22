import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { ACTIVE_TASK_STATUSES } from "@/lib/constants/tasks";
import type { ReminderRecord } from "@/lib/data/reminders";

type DashboardRecentLead = {
  address: string | null;
  category: string | null;
  id: string;
  name: string;
  status: string | null;
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

function startOfWeek() {
  const date = startOfToday();
  const day = date.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

export async function getDashboardData() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  await trackUserActivity("dashboard_viewed");

  const todayStart = startOfToday().toISOString();
  const tomorrowStart = startOfTomorrow().toISOString();
  const weekStart = startOfWeek().toISOString();

  const [
    profileResult,
    leadsResult,
    todayResult,
    overdueResult,
    newLeadsThisWeekResult,
    recentLeadsResult,
    todayListResult,
    notesCountResult,
    remindersCreatedResult,
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false)
      .is("deleted_at", null),
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", [...ACTIVE_TASK_STATUSES])
      .gte("remind_at", todayStart)
      .lt("remind_at", tomorrowStart)
      .is("deleted_at", null),
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", [...ACTIVE_TASK_STATUSES])
      .lt("remind_at", todayStart)
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false)
      .gte("created_at", weekStart)
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select("id,name,status,category,address")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("reminders")
      .select("id,lead_id,title,description,remind_at,status,completed_at,created_at,leads(id,name,phone,status)")
      .eq("user_id", userId)
      .in("status", [...ACTIVE_TASK_STATUSES])
      .gte("remind_at", todayStart)
      .lt("remind_at", tomorrowStart)
      .is("deleted_at", null)
      .order("remind_at", { ascending: true })
      .limit(4),
    supabase
      .from("lead_notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
  ]);

  for (const result of [
    profileResult,
    leadsResult,
    todayResult,
    overdueResult,
    newLeadsThisWeekResult,
    recentLeadsResult,
    todayListResult,
    notesCountResult,
    remindersCreatedResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    fullName: profileResult.data?.full_name as string | undefined,
    newLeadsThisWeek: newLeadsThisWeekResult.count ?? 0,
    overdueReminders: overdueResult.count ?? 0,
    recentLeads: (recentLeadsResult.data ?? []) as DashboardRecentLead[],
    todayReminderItems: (todayListResult.data ?? []) as ReminderRecord[],
    todayReminders: todayResult.count ?? 0,
    totalLeads: leadsResult.count ?? 0,
    totalNotes: notesCountResult.count ?? 0,
    totalRemindersCreated: remindersCreatedResult.count ?? 0,
  };
}
