import type { DailyQuotaAction } from "@/lib/constants/quota";
import { SUBSCRIPTION_EVENT_TYPES } from "@/lib/constants/subscription-lifecycle";
import {
  getPlanQuotaLimit,
  getSubscriptionPlan,
  isPaidSubscriptionPlanKey,
  type PaidSubscriptionPlanKey,
  type SubscriptionPlan,
  type SubscriptionPlanKey,
} from "@/lib/constants/subscription-plans";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { createPaymentRequestForUser } from "@/lib/data/payment-requests";
import { createSubscriptionEvent } from "@/lib/data/subscription-events";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "past_due"
  | "pending";

export type SubscriptionRecord = {
  activated_at?: string | null;
  auto_renew?: boolean | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by_user_at?: string | null;
  created_at?: string | null;
  current_period_end?: string | null;
  current_period_start?: string | null;
  expired_processed_at?: string | null;
  grace_period_end?: string | null;
  id?: string;
  latest_payment_request_id?: string | null;
  payment_method?: string | null;
  plan_key: SubscriptionPlanKey;
  plan_name: string;
  renewal_reminder_sent_at?: string | null;
  status: SubscriptionStatus;
  updated_at?: string | null;
  user_id: string;
};

export type CurrentSubscriptionResult = {
  plan: SubscriptionPlan;
  schemaReady: boolean;
  subscription: SubscriptionRecord;
};

function getFreeSubscription(userId: string): SubscriptionRecord {
  const plan = getSubscriptionPlan("free_beta");

  return {
    plan_key: plan.key,
    plan_name: plan.name,
    status: "active",
    user_id: userId,
  };
}

function isActiveSubscription(row?: Partial<SubscriptionRecord> | null) {
  if (!row || row.status !== "active") {
    return false;
  }

  if (!row.current_period_end) {
    return true;
  }

  return new Date(row.current_period_end).getTime() > Date.now();
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + Math.max(1, Number(months) || 1));

  return result;
}

function normalizeSubscription(
  row: Partial<SubscriptionRecord> | null | undefined,
  userId: string,
): SubscriptionRecord {
  if (!row) {
    return getFreeSubscription(userId);
  }

  const plan = getSubscriptionPlan(row.plan_key);

  return {
    activated_at: row.activated_at ?? null,
    auto_renew: row.auto_renew ?? false,
    cancel_reason: row.cancel_reason ?? null,
    cancelled_at: row.cancelled_at ?? null,
    cancelled_by_user_at: row.cancelled_by_user_at ?? null,
    created_at: row.created_at ?? null,
    current_period_end: row.current_period_end ?? null,
    current_period_start: row.current_period_start ?? null,
    expired_processed_at: row.expired_processed_at ?? null,
    grace_period_end: row.grace_period_end ?? null,
    id: row.id,
    latest_payment_request_id: row.latest_payment_request_id ?? null,
    payment_method: row.payment_method ?? "manual",
    plan_key: plan.key,
    plan_name: plan.name,
    renewal_reminder_sent_at: row.renewal_reminder_sent_at ?? null,
    status: row.status || "active",
    updated_at: row.updated_at ?? null,
    user_id: row.user_id || userId,
  };
}

export async function ensureFreeSubscriptionForCurrentUser(): Promise<CurrentSubscriptionResult> {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const plan = getSubscriptionPlan("free_beta");
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      plan,
      schemaReady: false,
      subscription: getFreeSubscription(userId),
    };
  }

  if (data) {
    const subscription = normalizeSubscription(data as SubscriptionRecord, userId);

    return {
      plan: getSubscriptionPlan(
        isActiveSubscription(subscription) ? subscription.plan_key : "free_beta",
      ),
      schemaReady: true,
      subscription,
    };
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: inserted, error: insertError } = await adminSupabase
    .from("subscriptions")
    .insert({
      activated_at: new Date().toISOString(),
      payment_method: "manual",
      plan_key: plan.key,
      plan_name: plan.name,
      status: "active",
      user_id: userId,
    })
    .select("*")
    .maybeSingle();

  if (insertError) {
    return {
      plan,
      schemaReady: false,
      subscription: getFreeSubscription(userId),
    };
  }

  return {
    plan,
    schemaReady: true,
    subscription: normalizeSubscription(inserted as SubscriptionRecord, userId),
  };
}

export async function getCurrentSubscription(): Promise<CurrentSubscriptionResult> {
  return ensureFreeSubscriptionForCurrentUser();
}

export async function getPlanForCurrentUser() {
  const result = await getCurrentSubscription();

  return result.plan;
}

export async function getSubscriptionStatusForCurrentUser() {
  const result = await getCurrentSubscription();
  const subscription = result.subscription;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const now = new Date();
  const daysRemaining = periodEnd
    ? Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  return {
    ...result,
    daysRemaining,
    expired: Boolean(periodEnd && periodEnd.getTime() <= now.getTime()),
    expiringSoon: Boolean(
      periodEnd &&
        periodEnd.getTime() > now.getTime() &&
        daysRemaining !== null &&
        daysRemaining <= 5,
    ),
  };
}

export async function createRenewalPaymentRequest(
  planKey?: string,
  months = 1,
) {
  const { userId } = await createAuthedSupabaseServerClient();
  const result = await getCurrentSubscription();
  const activePlanKey = result.subscription.plan_key;
  const renewalPlanKey = isPaidSubscriptionPlanKey(planKey || "")
    ? (planKey as PaidSubscriptionPlanKey)
    : isPaidSubscriptionPlanKey(activePlanKey)
      ? activePlanKey
      : null;

  if (!renewalPlanKey) {
    throw new Error("RENEWAL_REQUIRES_PAID_PLAN");
  }

  return createPaymentRequestForUser(userId, {
    months,
    planKey: renewalPlanKey,
    requestType: "renewal",
  });
}

export async function activateSubscriptionForUser(input: {
  adminUserId?: string;
  amountVnd?: number;
  months?: number;
  note?: string;
  paymentMethod?: string;
  paymentRequestId?: string;
  planKey: SubscriptionPlanKey;
  userId: string;
}) {
  const plan = getSubscriptionPlan(input.planKey);
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + Math.max(1, Number(input.months ?? 1)));

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        activated_at: now.toISOString(),
        cancelled_at: null,
        cancelled_by_user_at: null,
        cancel_reason: null,
        current_period_end: periodEnd.toISOString(),
        current_period_start: now.toISOString(),
        expired_processed_at: null,
        latest_payment_request_id: input.paymentRequestId || null,
        payment_method: input.paymentMethod || "manual",
        plan_key: plan.key,
        plan_name: plan.name,
        renewal_reminder_sent_at: null,
        status: "active",
        updated_at: now.toISOString(),
        user_id: input.userId,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const subscription = normalizeSubscription(data as SubscriptionRecord, input.userId);

  await createSubscriptionEvent({
    amountVnd: input.amountVnd ?? null,
    createdBy: input.adminUserId ?? null,
    eventType: SUBSCRIPTION_EVENT_TYPES.ACTIVATED,
    months: input.months ?? 1,
    newPeriodEnd: subscription.current_period_end ?? null,
    newPeriodStart: subscription.current_period_start ?? null,
    note: input.note ?? null,
    paymentRequestId: input.paymentRequestId ?? null,
    subscriptionId: subscription.id ?? null,
    toPlanKey: subscription.plan_key,
    userId: input.userId,
  });

  return subscription;
}

export async function renewSubscriptionForUser(input: {
  adminUserId?: string;
  amountVnd?: number;
  months: number;
  note?: string;
  paymentMethod?: string;
  paymentRequestId?: string;
  planKey: PaidSubscriptionPlanKey;
  userId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const plan = getSubscriptionPlan(input.planKey);
  const months = Math.max(1, Math.min(12, Number(input.months) || 1));
  const now = new Date();
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", input.userId)
    .maybeSingle();
  const current = normalizeSubscription(existing as SubscriptionRecord | null, input.userId);
  const previousPeriodEnd = current.current_period_end ?? null;
  const previousPeriodEndDate = previousPeriodEnd ? new Date(previousPeriodEnd) : null;
  const baseDate =
    previousPeriodEndDate && previousPeriodEndDate.getTime() > now.getTime()
      ? previousPeriodEndDate
      : now;
  const periodStart =
    previousPeriodEndDate && previousPeriodEndDate.getTime() > now.getTime()
      ? current.current_period_start || now.toISOString()
      : now.toISOString();
  const periodEnd = addMonths(baseDate, months);
  const eventType =
    isPaidSubscriptionPlanKey(current.plan_key) && current.plan_key !== plan.key
      ? SUBSCRIPTION_EVENT_TYPES.PLAN_CHANGED
      : SUBSCRIPTION_EVENT_TYPES.RENEWED;

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        activated_at: current.activated_at || now.toISOString(),
        cancelled_at: null,
        cancelled_by_user_at: null,
        cancel_reason: null,
        current_period_end: periodEnd.toISOString(),
        current_period_start: periodStart,
        expired_processed_at: null,
        latest_payment_request_id: input.paymentRequestId || null,
        payment_method: input.paymentMethod || "manual",
        plan_key: plan.key,
        plan_name: plan.name,
        renewal_reminder_sent_at: null,
        status: "active",
        updated_at: now.toISOString(),
        user_id: input.userId,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const subscription = normalizeSubscription(data as SubscriptionRecord, input.userId);

  await createSubscriptionEvent({
    amountVnd: input.amountVnd ?? null,
    createdBy: input.adminUserId ?? null,
    eventType,
    fromPlanKey: current.plan_key,
    months,
    newPeriodEnd: subscription.current_period_end ?? null,
    newPeriodStart: subscription.current_period_start ?? null,
    note: input.note ?? null,
    paymentRequestId: input.paymentRequestId ?? null,
    previousPeriodEnd,
    subscriptionId: subscription.id ?? null,
    toPlanKey: subscription.plan_key,
    userId: input.userId,
  });

  return subscription;
}

export async function expireSubscription(subscriptionId: string) {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const { data: existing, error: fetchError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (fetchError || !existing) {
    return null;
  }

  const subscription = normalizeSubscription(
    existing as SubscriptionRecord,
    String(existing.user_id),
  );

  if (
    subscription.status !== "active" ||
    !subscription.current_period_end ||
    new Date(subscription.current_period_end).getTime() > now.getTime()
  ) {
    return subscription;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      expired_processed_at: now.toISOString(),
      status: "expired",
      updated_at: now.toISOString(),
    })
    .eq("id", subscriptionId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const expired = normalizeSubscription(data as SubscriptionRecord, subscription.user_id);

  await createSubscriptionEvent({
    eventType: SUBSCRIPTION_EVENT_TYPES.EXPIRED,
    fromPlanKey: subscription.plan_key,
    newPeriodEnd: expired.current_period_end ?? null,
    previousPeriodEnd: subscription.current_period_end ?? null,
    subscriptionId: expired.id ?? null,
    toPlanKey: "free_beta",
    userId: subscription.user_id,
  });

  return expired;
}

export async function downgradeUserToFree(input: {
  adminUserId?: string;
  reason?: string;
  userId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const freePlan = getSubscriptionPlan("free_beta");
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", input.userId)
    .maybeSingle();
  const current = normalizeSubscription(existing as SubscriptionRecord | null, input.userId);
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        cancelled_at: now,
        cancel_reason: input.reason || current.cancel_reason || null,
        current_period_end: null,
        current_period_start: null,
        expired_processed_at: null,
        latest_payment_request_id: null,
        payment_method: "manual",
        plan_key: freePlan.key,
        plan_name: freePlan.name,
        renewal_reminder_sent_at: null,
        status: "active",
        updated_at: now,
        user_id: input.userId,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const subscription = normalizeSubscription(data as SubscriptionRecord, input.userId);

  await createSubscriptionEvent({
    createdBy: input.adminUserId ?? null,
    eventType: SUBSCRIPTION_EVENT_TYPES.DOWNGRADED_TO_FREE,
    fromPlanKey: current.plan_key,
    note: input.reason ?? null,
    previousPeriodEnd: current.current_period_end ?? null,
    subscriptionId: subscription.id ?? null,
    toPlanKey: "free_beta",
    userId: input.userId,
  });

  return subscription;
}

export async function requestSubscriptionCancellation(input: {
  reasonDetail?: string;
  reasonType: string;
  wouldReturnIf?: string;
}) {
  const { userId } = await createAuthedSupabaseServerClient();
  const current = await getCurrentSubscription();
  const subscription = current.subscription;
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("cancellation_requests")
    .insert({
      reason_detail: input.reasonDetail || null,
      reason_type: input.reasonType,
      status: "new",
      subscription_id: subscription.id || null,
      user_id: userId,
      would_return_if: input.wouldReturnIf || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (subscription.id) {
    await supabase
      .from("subscriptions")
      .update({
        cancel_reason: input.reasonType,
        cancelled_by_user_at: now,
        updated_at: now,
      })
      .eq("id", subscription.id);
  }

  await createSubscriptionEvent({
    eventType: SUBSCRIPTION_EVENT_TYPES.CANCEL_REQUESTED,
    fromPlanKey: subscription.plan_key,
    note: input.reasonType,
    previousPeriodEnd: subscription.current_period_end ?? null,
    subscriptionId: subscription.id ?? null,
    toPlanKey: subscription.plan_key,
    userId,
  });

  return data;
}

export async function findSubscriptionsExpiringSoon(daysBefore: number) {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const until = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .in("plan_key", ["pro", "pro_plus"])
    .not("current_period_end", "is", null)
    .gt("current_period_end", now.toISOString())
    .lte("current_period_end", until.toISOString())
    .is("renewal_reminder_sent_at", null)
    .order("current_period_end", { ascending: true })
    .limit(500);

  if (error) {
    return [] as SubscriptionRecord[];
  }

  return ((data ?? []) as SubscriptionRecord[]).map((row) =>
    normalizeSubscription(row, row.user_id),
  );
}

export async function findExpiredSubscriptions() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .in("plan_key", ["pro", "pro_plus"])
    .not("current_period_end", "is", null)
    .lt("current_period_end", new Date().toISOString())
    .is("expired_processed_at", null)
    .order("current_period_end", { ascending: true })
    .limit(500);

  if (error) {
    return [] as SubscriptionRecord[];
  }

  return ((data ?? []) as SubscriptionRecord[]).map((row) =>
    normalizeSubscription(row, row.user_id),
  );
}

export async function expireOldSubscriptionsIfNeeded() {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "active")
    .not("current_period_end", "is", null)
    .lt("current_period_end", new Date().toISOString());

  if (error) {
    return false;
  }

  return true;
}

export async function getDailyQuotaLimitForUser(
  actionType: DailyQuotaAction,
  userId?: string,
): Promise<number> {
  let safeUserId = userId;

  if (!safeUserId) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    safeUserId = user?.id;
  }

  if (!safeUserId) {
    return getPlanQuotaLimit("free_beta", actionType);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan_key,status,current_period_end")
    .eq("user_id", safeUserId)
    .maybeSingle();

  if (error || !isActiveSubscription(data as Partial<SubscriptionRecord> | null)) {
    return getPlanQuotaLimit("free_beta", actionType);
  }

  return getPlanQuotaLimit(String(data?.plan_key || "free_beta"), actionType);
}
