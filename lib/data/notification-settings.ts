import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const REMINDER_EMAIL_MINUTES_BEFORE_OPTIONS = [0, 15, 30, 60] as const;
export const DAILY_DIGEST_TIME_OPTIONS = ["08:00", "09:00"] as const;

export type ReminderEmailMinutesBefore =
  (typeof REMINDER_EMAIL_MINUTES_BEFORE_OPTIONS)[number];

export type NotificationSettings = {
  daily_digest_enabled: boolean;
  daily_digest_time: string;
  email_reminder_enabled: boolean;
  in_app_notification_enabled: boolean;
  reminder_email_minutes_before: number;
  timezone: string;
  user_id: string;
};

export type NotificationSettingsInput = {
  dailyDigestEnabled?: boolean;
  dailyDigestTime?: string;
  emailReminderEnabled?: boolean;
  inAppNotificationEnabled?: boolean;
  reminderEmailMinutesBefore?: number;
};

export function getDefaultNotificationSettings(userId: string): NotificationSettings {
  return {
    daily_digest_enabled: true,
    daily_digest_time: "08:00",
    email_reminder_enabled: true,
    in_app_notification_enabled: true,
    reminder_email_minutes_before: 0,
    timezone: "Asia/Ho_Chi_Minh",
    user_id: userId,
  };
}

function normalizeReminderMinutes(value?: number) {
  const cleanValue = Number(value);

  return REMINDER_EMAIL_MINUTES_BEFORE_OPTIONS.includes(
    cleanValue as ReminderEmailMinutesBefore,
  )
    ? cleanValue
    : 0;
}

function normalizeDigestTime(value?: string) {
  return DAILY_DIGEST_TIME_OPTIONS.includes(
    value as (typeof DAILY_DIGEST_TIME_OPTIONS)[number],
  )
    ? String(value)
    : "08:00";
}

function normalizeSettings(
  userId: string,
  data?: Partial<NotificationSettings> | null,
): NotificationSettings {
  const defaults = getDefaultNotificationSettings(userId);

  return {
    daily_digest_enabled: data?.daily_digest_enabled ?? defaults.daily_digest_enabled,
    daily_digest_time: normalizeDigestTime(data?.daily_digest_time),
    email_reminder_enabled:
      data?.email_reminder_enabled ?? defaults.email_reminder_enabled,
    in_app_notification_enabled:
      data?.in_app_notification_enabled ?? defaults.in_app_notification_enabled,
    reminder_email_minutes_before: normalizeReminderMinutes(
      data?.reminder_email_minutes_before,
    ),
    timezone: data?.timezone || defaults.timezone,
    user_id: data?.user_id || userId,
  };
}

export async function getNotificationSettings() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select(
      "user_id,email_reminder_enabled,daily_digest_enabled,in_app_notification_enabled,reminder_email_minutes_before,daily_digest_time,timezone",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return getDefaultNotificationSettings(userId);
  }

  if (!data) {
    const defaults = getDefaultNotificationSettings(userId);
    const { data: inserted } = await supabase
      .from("user_settings")
      .insert(defaults)
      .select(
        "user_id,email_reminder_enabled,daily_digest_enabled,in_app_notification_enabled,reminder_email_minutes_before,daily_digest_time,timezone",
      )
      .maybeSingle();

    return normalizeSettings(userId, inserted as Partial<NotificationSettings> | null);
  }

  return normalizeSettings(userId, data as Partial<NotificationSettings>);
}

export async function updateNotificationSettings(input: NotificationSettingsInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const payload = {
    daily_digest_enabled: Boolean(input.dailyDigestEnabled),
    daily_digest_time: normalizeDigestTime(input.dailyDigestTime),
    email_reminder_enabled: Boolean(input.emailReminderEnabled),
    in_app_notification_enabled: Boolean(input.inAppNotificationEnabled),
    reminder_email_minutes_before: normalizeReminderMinutes(
      input.reminderEmailMinutesBefore,
    ),
    timezone: "Asia/Ho_Chi_Minh",
    updated_at: new Date().toISOString(),
    user_id: userId,
  };

  const { error } = await supabase
    .from("user_settings")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeSettings(userId, payload);
}

export async function ensureNotificationSettingsForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select(
      "user_id,email_reminder_enabled,daily_digest_enabled,in_app_notification_enabled,reminder_email_minutes_before,daily_digest_time,timezone",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return getDefaultNotificationSettings(userId);
  }

  if (data) {
    return normalizeSettings(userId, data as Partial<NotificationSettings>);
  }

  const defaults = getDefaultNotificationSettings(userId);
  const { data: inserted } = await supabase
    .from("user_settings")
    .insert(defaults)
    .select(
      "user_id,email_reminder_enabled,daily_digest_enabled,in_app_notification_enabled,reminder_email_minutes_before,daily_digest_time,timezone",
    )
    .maybeSingle();

  return normalizeSettings(userId, inserted as Partial<NotificationSettings> | null);
}
