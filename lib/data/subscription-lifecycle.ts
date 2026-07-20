import { buildSubscriptionExpiredEmail } from "@/lib/email/templates/subscription-expired";
import { buildSubscriptionRenewalReminderEmail } from "@/lib/email/templates/subscription-renewal-reminder";
import { RENEWAL_REMINDER_DAYS_BEFORE } from "@/lib/constants/subscription-lifecycle";
import { SUBSCRIPTION_PLANS } from "@/lib/constants/subscription-plans";
import { createNotification } from "@/lib/data/notifications";
import {
  expireSubscription,
  findExpiredSubscriptions,
  findSubscriptionsExpiringSoon,
  type SubscriptionRecord,
} from "@/lib/data/subscriptions";
import { getEmailProvider } from "@/lib/providers/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type AuthUser = {
  email?: string;
  id: string;
};

type UserProfile = {
  full_name?: string | null;
  user_id: string;
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "chưa có ngày";
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
    email: user.email,
    id: user.id,
  }));
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

function getPeriodBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    end: end.toISOString(),
    snapshotDate: start.toISOString().slice(0, 10),
    start: start.toISOString(),
  };
}

async function sendRenewalReminder(
  subscription: SubscriptionRecord,
  email?: string,
  fullName?: string | null,
) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const content = `Gói của bạn sẽ hết hạn vào ${formatDate(subscription.current_period_end)}. Gia hạn để tiếp tục sử dụng quota hiện tại.`;
  const notificationId = await createNotification({
    actionUrl: "/app/billing",
    content,
    metadata: {
      daysBefore: RENEWAL_REMINDER_DAYS_BEFORE,
      planKey: subscription.plan_key,
      status: subscription.status,
    },
    title: `Gói ${subscription.plan_name} của bạn sắp hết hạn`,
    type: "subscription_renewal_reminder",
    userId: subscription.user_id,
  });
  let emailStatus = "disabled";
  let emailSentAt: string | null = null;

  if (email && subscription.current_period_end) {
    const template = buildSubscriptionRenewalReminderEmail({
      fullName,
      periodEnd: subscription.current_period_end,
      planName: subscription.plan_name,
    });
    const result = await getEmailProvider().sendEmail({
      html: template.html,
      subject: template.subject,
      text: template.text,
      to: email,
    });
    emailStatus = result.success ? "sent" : result.skipped ? "skipped" : "failed";
    emailSentAt = result.success ? now : null;
  }

  await supabase
    .from("subscriptions")
    .update({
      renewal_reminder_sent_at: now,
      updated_at: now,
    })
    .eq("id", subscription.id);

  if (notificationId) {
    await supabase
      .from("notifications")
      .update({
        delivered_email: emailStatus === "sent",
        email_sent_at: emailSentAt,
        metadata: {
          emailStatus,
          planKey: subscription.plan_key,
        },
        updated_at: now,
      })
      .eq("id", notificationId);
  }

  return emailStatus;
}

async function sendExpiredNotice(
  subscription: SubscriptionRecord,
  email?: string,
  fullName?: string | null,
) {
  const notificationId = await createNotification({
    actionUrl: "/app/billing",
    content: "Tài khoản của bạn đã quay về quota Free. Bạn có thể gia hạn bất cứ lúc nào.",
    metadata: {
      planKey: subscription.plan_key,
      status: "expired",
    },
    title: "Gói trả phí của bạn đã hết hạn",
    type: "subscription_expired",
    userId: subscription.user_id,
  });
  let emailStatus = "disabled";

  if (email) {
    const template = buildSubscriptionExpiredEmail({
      fullName,
      planName: subscription.plan_name,
    });
    const result = await getEmailProvider().sendEmail({
      html: template.html,
      subject: template.subject,
      text: template.text,
      to: email,
    });
    emailStatus = result.success ? "sent" : result.skipped ? "skipped" : "failed";
  }

  return {
    emailStatus,
    notificationId,
  };
}

export async function processSubscriptionLifecycle() {
  const [expiringSoon, expired, users, profiles] = await Promise.all([
    findSubscriptionsExpiringSoon(RENEWAL_REMINDER_DAYS_BEFORE),
    findExpiredSubscriptions(),
    listAuthUsers(),
    listProfiles(),
  ]);
  const emailMap = new Map(users.map((user) => [user.id, user.email ?? ""]));
  const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]));
  let renewalRemindersCreated = 0;
  let expiredProcessed = 0;
  let emailSent = 0;
  let emailFailed = 0;

  for (const subscription of expiringSoon) {
    const emailStatus = await sendRenewalReminder(
      subscription,
      emailMap.get(subscription.user_id),
      profileMap.get(subscription.user_id)?.full_name,
    );

    renewalRemindersCreated += 1;
    emailSent += emailStatus === "sent" ? 1 : 0;
    emailFailed += emailStatus === "failed" ? 1 : 0;
  }

  for (const subscription of expired) {
    const updated = subscription.id ? await expireSubscription(subscription.id) : null;

    if (!updated) {
      continue;
    }

    const result = await sendExpiredNotice(
      subscription,
      emailMap.get(subscription.user_id),
      profileMap.get(subscription.user_id)?.full_name,
    );

    expiredProcessed += 1;
    emailSent += result.emailStatus === "sent" ? 1 : 0;
    emailFailed += result.emailStatus === "failed" ? 1 : 0;
  }

  return {
    emailFailed,
    emailSent,
    expiredProcessed,
    renewalRemindersCreated,
  };
}

export async function createRevenueSnapshot(date = new Date()) {
  const supabase = createSupabaseAdminClient();
  const { end, snapshotDate, start } = getPeriodBounds(date);
  const [subscriptionsResult, paymentsResult, cancellationsResult] = await Promise.all([
    supabase.from("subscriptions").select("*").limit(1000),
    supabase.from("payment_requests").select("*").eq("status", "paid").limit(1000),
    supabase.from("cancellation_requests").select("*").limit(1000),
  ]);

  if (subscriptionsResult.error || paymentsResult.error || cancellationsResult.error) {
    throw new Error("REVENUE_SNAPSHOT_SCHEMA_NOT_READY");
  }

  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRecord[];
  const payments = (paymentsResult.data ?? []) as Array<{
    amount_vnd: number;
    created_at?: string | null;
    request_type?: string | null;
    reviewed_at?: string | null;
    updated_at?: string | null;
  }>;
  const cancellations = (cancellationsResult.data ?? []) as Array<{
    created_at?: string | null;
  }>;
  const activePaid = subscriptions.filter((subscription) => {
    if (
      subscription.status !== "active" ||
      !["pro", "pro_plus"].includes(subscription.plan_key)
    ) {
      return false;
    }

    return !subscription.current_period_end ||
      new Date(subscription.current_period_end).getTime() > Date.now();
  });
  const activeProUsers = activePaid.filter((item) => item.plan_key === "pro").length;
  const activeProPlusUsers = activePaid.filter((item) => item.plan_key === "pro_plus").length;
  const paymentsToday = payments.filter((payment) => {
    const value = payment.reviewed_at || payment.updated_at || payment.created_at || "";

    return value >= start && value < end;
  });
  const expiredToday = subscriptions.filter((subscription) => {
    const value = subscription.expired_processed_at || "";

    return value >= start && value < end;
  }).length;
  const cancellationsToday = cancellations.filter((item) => {
    const value = item.created_at || "";

    return value >= start && value < end;
  }).length;
  const payload = {
    active_paid_users: activePaid.length,
    active_pro_plus_users: activeProPlusUsers,
    active_pro_users: activeProUsers,
    cancellation_requests: cancellationsToday,
    expired_users: expiredToday,
    manual_revenue_vnd: paymentsToday.reduce(
      (sum, payment) => sum + Number(payment.amount_vnd || 0),
      0,
    ),
    mrr_vnd:
      activeProUsers * SUBSCRIPTION_PLANS.pro.priceVnd +
      activeProPlusUsers * SUBSCRIPTION_PLANS.pro_plus.priceVnd,
    new_paid_users: paymentsToday.filter(
      (payment) => (payment.request_type || "new_subscription") === "new_subscription",
    ).length,
    renewed_users: paymentsToday.filter(
      (payment) => payment.request_type === "renewal",
    ).length,
    snapshot_date: snapshotDate,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("revenue_snapshots_daily")
    .upsert(payload, { onConflict: "snapshot_date" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
