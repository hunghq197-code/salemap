import { buildDailyDigestEmail } from "@/lib/email/templates/daily-digest";
import { buildReminderDueEmail } from "@/lib/email/templates/reminder-due";
import {
  ensureNotificationSettingsForUser,
  getDefaultNotificationSettings,
  type NotificationSettings,
} from "@/lib/data/notification-settings";
import { createNotification } from "@/lib/data/notifications";
import { getEmailProvider } from "@/lib/providers/email";
import { getSiteUrl } from "@/lib/site-url";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type DeliveryReminder = {
  description?: string | null;
  email_sent_at?: string | null;
  id: string;
  last_notified_at?: string | null;
  lead_id?: string | null;
  leads?:
    | {
        id: string;
        name: string;
        phone: string | null;
      }
    | Array<{
        id: string;
        name: string;
        phone: string | null;
      }>
    | null;
  notification_sent_at?: string | null;
  remind_at: string;
  status?: string | null;
  title: string;
  user_id: string;
};

type AuthUser = {
  created_at?: string;
  email?: string;
  id: string;
};

type UserProfile = {
  full_name?: string | null;
  user_id: string;
};

function getLead(reminder: DeliveryReminder) {
  return Array.isArray(reminder.leads) ? reminder.leads[0] : reminder.leads;
}

function getReminderActionUrl(reminder: DeliveryReminder) {
  const siteUrl = getSiteUrl();
  const lead = getLead(reminder);

  if (lead?.id || reminder.lead_id) {
    return `${siteUrl}/app/leads/${lead?.id || reminder.lead_id}`;
  }

  return `${siteUrl}/app/reminders`;
}

function getInAppActionUrl(reminder: DeliveryReminder) {
  const lead = getLead(reminder);

  if (lead?.id || reminder.lead_id) {
    return `/app/leads/${lead?.id || reminder.lead_id}`;
  }

  return "/app/reminders";
}

function getVietnamDayBounds(date = new Date()) {
  const vietnamNow = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const year = vietnamNow.getUTCFullYear();
  const month = vietnamNow.getUTCMonth();
  const day = vietnamNow.getUTCDate();

  return {
    end: new Date(Date.UTC(year, month, day + 1, -7, 0, 0)).toISOString(),
    start: new Date(Date.UTC(year, month, day, -7, 0, 0)).toISOString(),
  };
}

async function listAuthUsers() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return [] as AuthUser[];
  }

  return (data.users ?? []).map((user) => ({
    created_at: user.created_at,
    email: user.email,
    id: user.id,
  })) satisfies AuthUser[];
}

async function listProfiles() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id,full_name")
    .limit(10000);

  if (error) {
    return [] as UserProfile[];
  }

  return (data ?? []) as UserProfile[];
}

async function getSettingsMap(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  const entries = await Promise.all(
    uniqueUserIds.map(async (userId) => [
      userId,
      await ensureNotificationSettingsForUser(userId),
    ] as const),
  );

  return new Map(entries);
}

export async function findDueRemindersForNotification() {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const maxLeadTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("reminders")
    .select(
      "id,user_id,lead_id,title,description,remind_at,status,notification_sent_at,email_sent_at,last_notified_at,leads(id,name,phone)",
    )
    .eq("status", "pending")
    .is("deleted_at", null)
    .is("last_notified_at", null)
    .lte("remind_at", maxLeadTime)
    .order("remind_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Find due reminders failed", error.message);
    return [] as DeliveryReminder[];
  }

  const reminders = (data ?? []) as DeliveryReminder[];
  const settingsMap = await getSettingsMap(reminders.map((reminder) => reminder.user_id));
  const nowMs = now.getTime();

  return reminders.filter((reminder) => {
    const settings =
      settingsMap.get(reminder.user_id) ??
      getDefaultNotificationSettings(reminder.user_id);
    const dueAt =
      new Date(reminder.remind_at).getTime() -
      settings.reminder_email_minutes_before * 60 * 1000;

    return dueAt <= nowMs;
  });
}

export async function sendDueReminderNotifications() {
  const reminders = await findDueRemindersForNotification();
  const supabase = createSupabaseAdminClient();
  const settingsMap = await getSettingsMap(reminders.map((reminder) => reminder.user_id));
  const users = await listAuthUsers();
  const emailMap = new Map(users.map((user) => [user.id, user.email ?? ""]));
  const emailProvider = getEmailProvider();
  const now = new Date().toISOString();
  let emailSent = 0;
  let emailFailed = 0;
  let inAppCreated = 0;
  let processed = 0;

  for (const reminder of reminders) {
    const settings =
      settingsMap.get(reminder.user_id) ??
      getDefaultNotificationSettings(reminder.user_id);
    const lead = getLead(reminder);
    const email = emailMap.get(reminder.user_id);
    let notificationId: string | null = null;
    let emailSentAt: string | null = null;
    let emailStatus = "disabled";

    if (settings.in_app_notification_enabled) {
      notificationId = await createNotification({
        actionUrl: getInAppActionUrl(reminder),
        content: lead?.name
          ? `Đến giờ follow-up với ${lead.name}.`
          : "Đến giờ xử lý follow-up.",
        deliveredInApp: true,
        relatedLeadId: lead?.id || reminder.lead_id,
        relatedReminderId: reminder.id,
        title: reminder.title,
        type: "reminder_due",
        userId: reminder.user_id,
      });

      if (notificationId) {
        inAppCreated += 1;
      }
    }

    if (settings.email_reminder_enabled && email) {
      const template = buildReminderDueEmail({
        actionUrl: getReminderActionUrl(reminder),
        description: reminder.description,
        leadName: lead?.name,
        leadPhone: lead?.phone,
        remindAt: reminder.remind_at,
        reminderTitle: reminder.title,
      });
      const result = await emailProvider.sendEmail({
        html: template.html,
        subject: template.subject,
        text: template.text,
        to: email,
      });

      if (result.success) {
        emailSent += 1;
        emailSentAt = now;
        emailStatus = "sent";
      } else {
        emailFailed += result.skipped ? 0 : 1;
        emailStatus = result.skipped ? "skipped" : "failed";
      }
    }

    if (!notificationId && emailStatus === "disabled") {
      continue;
    }

    processed += 1;

    await supabase
      .from("reminders")
      .update({
        email_sent_at: emailSentAt,
        last_notified_at: now,
        notification_sent_at: notificationId ? now : null,
        updated_at: now,
      })
      .eq("id", reminder.id);

    if (notificationId && emailStatus !== "disabled") {
      await supabase
        .from("notifications")
        .update({
          delivered_email: emailStatus === "sent",
          email_sent_at: emailSentAt,
          metadata: { emailStatus },
          updated_at: now,
        })
        .eq("id", notificationId);
    }
  }

  return {
    emailFailed,
    emailSent,
    inAppCreated,
    processed,
  };
}

export async function sendDailyDigestNotifications() {
  const supabase = createSupabaseAdminClient();
  const { end, start } = getVietnamDayBounds();
  const { data, error } = await supabase
    .from("reminders")
    .select(
      "id,user_id,lead_id,title,description,remind_at,status,notification_sent_at,email_sent_at,last_notified_at,leads(id,name,phone)",
    )
    .eq("status", "pending")
    .is("deleted_at", null)
    .gte("remind_at", start)
    .lt("remind_at", end)
    .order("remind_at", { ascending: true })
    .limit(1000);

  if (error) {
    console.error("Daily digest reminders query failed", error.message);
    return {
      dailyDigestSent: 0,
      emailFailed: 0,
      emailSent: 0,
      inAppCreated: 0,
      processed: 0,
    };
  }

  const reminders = (data ?? []) as DeliveryReminder[];
  const grouped = new Map<string, DeliveryReminder[]>();

  reminders.forEach((reminder) => {
    grouped.set(reminder.user_id, [
      ...(grouped.get(reminder.user_id) ?? []),
      reminder,
    ]);
  });

  const userIds = Array.from(grouped.keys());
  const [settingsMap, users, profiles, existingDigestResult] = await Promise.all([
    getSettingsMap(userIds),
    listAuthUsers(),
    listProfiles(),
    supabase
      .from("notifications")
      .select("user_id")
      .eq("type", "daily_digest")
      .gte("created_at", start)
      .lt("created_at", end)
      .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const existingDigestUsers = new Set(
    ((existingDigestResult.data ?? []) as Array<{ user_id?: string | null }>)
      .map((row) => row.user_id)
      .filter(Boolean),
  );
  const emailMap = new Map(users.map((user) => [user.id, user.email ?? ""]));
  const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const emailProvider = getEmailProvider();
  const now = new Date().toISOString();
  let dailyDigestSent = 0;
  let emailSent = 0;
  let emailFailed = 0;
  let inAppCreated = 0;

  for (const [userId, items] of Array.from(grouped.entries())) {
    if (items.length === 0 || existingDigestUsers.has(userId)) {
      continue;
    }

    const settings = settingsMap.get(userId) ?? getDefaultNotificationSettings(userId);

    if (!settings.daily_digest_enabled) {
      continue;
    }

    const email = emailMap.get(userId);
    const template = buildDailyDigestEmail({
      fullName: profileMap.get(userId)?.full_name,
      items: items.map((item: DeliveryReminder) => {
        const lead = getLead(item);

        return {
          actionUrl: getReminderActionUrl(item),
          leadName: lead?.name,
          remindAt: item.remind_at,
          title: item.title,
        };
      }),
    });
    let emailStatus = "disabled";
    let emailSentAt: string | null = null;

    if (email) {
      const result = await emailProvider.sendEmail({
        html: template.html,
        subject: template.subject,
        text: template.text,
        to: email,
      });

      if (result.success) {
        emailSent += 1;
        emailSentAt = now;
        emailStatus = "sent";
      } else {
        emailFailed += result.skipped ? 0 : 1;
        emailStatus = result.skipped ? "skipped" : "failed";
      }
    }

    if (settings.in_app_notification_enabled) {
      const notificationId = await createNotification({
        actionUrl: "/app/reminders",
        content: `Hôm nay bạn có ${items.length} việc follow-up cần xử lý.`,
        deliveredEmail: emailStatus === "sent",
        emailSentAt,
        metadata: {
          emailStatus,
          reminderCount: items.length,
        },
        title: "Việc follow-up hôm nay",
        type: "daily_digest",
        userId,
      });

      if (notificationId) {
        inAppCreated += 1;
      }
    }

    dailyDigestSent += emailStatus === "sent" || settings.in_app_notification_enabled ? 1 : 0;
  }

  return {
    dailyDigestSent,
    emailFailed,
    emailSent,
    inAppCreated,
    processed: grouped.size,
  };
}
