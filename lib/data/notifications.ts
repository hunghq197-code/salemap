import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type NotificationRecord = {
  action_url: string | null;
  content: string | null;
  created_at: string | null;
  delivered_email: boolean | null;
  delivered_in_app: boolean | null;
  email_sent_at: string | null;
  id: string;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  related_lead_id: string | null;
  related_reminder_id: string | null;
  title: string;
  type: string;
  user_id: string;
};

export type NotificationListParams = {
  limit?: number;
  page?: number;
  unreadOnly?: boolean;
};

export type NotificationListResult = {
  items: NotificationRecord[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type CreateNotificationInput = {
  actionUrl?: string | null;
  content?: string | null;
  deliveredEmail?: boolean;
  deliveredInApp?: boolean;
  emailSentAt?: string | null;
  metadata?: Record<string, unknown>;
  relatedLeadId?: string | null;
  relatedReminderId?: string | null;
  title: string;
  type: string;
  userId: string;
};

function getPaging(params?: NotificationListParams) {
  const page = Math.max(1, Number(params?.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params?.limit) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { from, limit, page, to };
}

function toListResult(
  items: NotificationRecord[],
  total: number,
  page: number,
  limit: number,
): NotificationListResult {
  return {
    items,
    limit,
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getNotifications(params?: NotificationListParams) {
  const { from, limit, page, to } = getPaging(params);
  const { supabase, userId } = await createAuthedSupabaseServerClient();

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params?.unreadOnly) {
    query = query.is("read_at", null);
  }

  const { count, data, error } = await query;

  if (error) {
    return toListResult([], 0, page, limit);
  }

  return toListResult((data ?? []) as NotificationRecord[], count ?? 0, page, limit);
}

export async function getUnreadNotificationCount() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationAsRead(notificationId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: now,
      updated_at: now,
    })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await trackUserActivity("notification_read");
}

export async function markAllNotificationsAsRead() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: now,
      updated_at: now,
    })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }

  await trackUserActivity("notification_read");
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        action_url: input.actionUrl,
        content: input.content,
        delivered_email: input.deliveredEmail ?? false,
        delivered_in_app: input.deliveredInApp ?? true,
        email_sent_at: input.emailSentAt,
        metadata: input.metadata,
        related_lead_id: input.relatedLeadId,
        related_reminder_id: input.relatedReminderId,
        title: input.title,
        type: input.type,
        user_id: input.userId,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Create notification failed", error.message);
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    console.error("Create notification failed", error);
    return null;
  }
}
