import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackSalesActivity } from "@/lib/data/sales-activity";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const ACTIVITY_ACTIONS = {
  area_search_completed: { column: "area_searches", score: 3 },
  dashboard_viewed: { column: "dashboard_views", score: 1 },
  export_completed: { column: "exports_completed", score: 3 },
  feedback_submitted: { column: "feedback_submitted", score: 5 },
  lead_created: { column: "leads_created", score: 5 },
  lead_note_created: { column: "lead_notes_created", score: 4 },
  map_place_saved: { column: "map_places_saved", score: 5 },
  near_me_search_completed: { column: "near_me_searches", score: 3 },
  notification_read: { column: "notifications_read", score: 1 },
  reminder_completed: { column: "reminders_completed", score: 5 },
  reminder_created: { column: "reminders_created", score: 4 },
  route_search_completed: { column: "route_searches", score: 5 },
  session_started: { column: "sessions_count", score: 1 },
  template_copied: { column: "templates_copied", score: 2 },
  upgrade_interest_submitted: { column: "upgrade_interest_submitted", score: 8 },
} as const;

export type ActivityActionType = keyof typeof ACTIVITY_ACTIONS;

type ActivityDailyRow = {
  active_score?: number | null;
  area_searches?: number | null;
  dashboard_views?: number | null;
  export_completed?: number | null;
  exports_completed?: number | null;
  feedback_submitted?: number | null;
  id?: string;
  lead_notes_created?: number | null;
  leads_created?: number | null;
  map_places_saved?: number | null;
  near_me_searches?: number | null;
  notifications_read?: number | null;
  reminder_completed?: number | null;
  reminder_created?: number | null;
  reminders_completed?: number | null;
  reminders_created?: number | null;
  route_searches?: number | null;
  sessions_count?: number | null;
  templates_copied?: number | null;
  upgrade_interest_submitted?: number | null;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isActivityAction(value: string): value is ActivityActionType {
  return value in ACTIVITY_ACTIONS;
}

export async function trackUserActivity(actionType: string, incrementBy = 1) {
  if (incrementBy <= 0) {
    return;
  }

  await trackSalesActivity(actionType, incrementBy);

  if (!isActivityAction(actionType)) {
    return;
  }

  try {
    const { userId } = await createAuthedSupabaseServerClient();
    await trackUserActivityForUser(userId, actionType, incrementBy);
  } catch {
    // Retention tracking must never break product workflows.
  }
}

export async function trackUserActivityForUser(
  userId: string,
  actionType: string,
  incrementBy = 1,
) {
  if (incrementBy <= 0 || !isActivityAction(actionType)) {
    return;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const activityDate = todayDate();
    const action = ACTIVITY_ACTIONS[actionType];
    const { data } = await supabase
      .from("user_activity_daily")
      .select("*")
      .eq("user_id", userId)
      .eq("activity_date", activityDate)
      .maybeSingle();
    const current = (data ?? {}) as ActivityDailyRow;
    const currentValue = Number(current[action.column as keyof ActivityDailyRow] ?? 0);
    const payload = {
      [action.column]: currentValue + incrementBy,
      active_score: Number(current.active_score ?? 0) + action.score * incrementBy,
      activity_date: activityDate,
      updated_at: new Date().toISOString(),
      user_id: userId,
    };

    await supabase
      .from("user_activity_daily")
      .upsert(payload, { onConflict: "user_id,activity_date" });
  } catch {
    // Retention tracking must never break product workflows.
  }
}

export async function getTodayActivityForCurrentUser() {
  try {
    const { userId } = await createAuthedSupabaseServerClient();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("user_activity_daily")
      .select("*")
      .eq("user_id", userId)
      .eq("activity_date", todayDate())
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
