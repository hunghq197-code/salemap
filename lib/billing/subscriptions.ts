import "server-only";

import { writeAdminAuditLog } from "@/lib/admin/audit-log";
import type { AdminContext } from "@/lib/admin/auth";
import { BillingError } from "@/lib/billing/billing-errors";
import { getPlanById, normalizePlanId, toSubscriptionPlanKey } from "@/lib/billing/plans";
import type {
  BillingPaymentRecord,
  BillingPeriod,
  PlanId,
  SubscriptionStatus,
} from "@/lib/billing/types";
import { createNotification } from "@/lib/data/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type BillingSubscriptionRecord = {
  billing_period?: BillingPeriod | string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  created_at?: string | null;
  current_period_end?: string | null;
  current_period_start?: string | null;
  grace_ends_at?: string | null;
  grace_period_end?: string | null;
  id: string;
  latest_payment_request_id?: string | null;
  payment_method?: string | null;
  plan_id?: PlanId | string | null;
  plan_key?: string | null;
  plan_name?: string | null;
  provider?: string | null;
  provider_subscription_id?: string | null;
  started_at?: string | null;
  status: SubscriptionStatus | "active" | "pending";
  trial_ends_at?: string | null;
  updated_at?: string | null;
  user_id: string;
};

const PAID_EVENT_TYPES = [
  "subscription_activated",
  "subscription_extended",
  "subscription_plan_changed",
  "subscription_renewed",
] as const;

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}

function getActivePlanId(row?: Partial<BillingSubscriptionRecord> | null) {
  const planId =
    row?.plan_key === "pro" || row?.plan_key === "pro_plus"
      ? row.plan_key
      : normalizePlanId(row?.plan_id || row?.plan_key);

  if (!row) {
    return "free" satisfies PlanId;
  }

  if (!["active", "trialing", "grace"].includes(String(row.status))) {
    return "free" satisfies PlanId;
  }

  if (
    row.current_period_end &&
    new Date(row.current_period_end).getTime() <= Date.now() &&
    row.status !== "grace"
  ) {
    return "free" satisfies PlanId;
  }

  return planId;
}

function normalizeSubscription(row: BillingSubscriptionRecord | null, userId: string) {
  if (!row) {
    const plan = getPlanById("free");

    return {
      billing_period: "monthly",
      current_period_end: null,
      current_period_start: null,
      id: "",
      plan_id: plan.id,
      plan_key: "free_beta",
      plan_name: plan.name,
      status: "free",
      user_id: userId,
    } satisfies Partial<BillingSubscriptionRecord>;
  }

  const planId = getActivePlanId(row);
  const plan = getPlanById(planId);

  return {
    ...row,
    plan_id: planId,
    plan_key: toSubscriptionPlanKey(planId),
    plan_name: plan.name,
    status: planId === "free" && row.status === "active" ? "free" : row.status,
  };
}

async function insertSubscriptionEvent(input: {
  amount?: number | null;
  createdBy?: string | null;
  eventType: string;
  fromPlanId?: string | null;
  fromStatus?: string | null;
  metadata?: Record<string, unknown>;
  months?: number;
  newPeriodEnd?: string | null;
  newPeriodStart?: string | null;
  paymentId?: string | null;
  previousPeriodEnd?: string | null;
  subscriptionId?: string | null;
  toPlanId?: string | null;
  toStatus?: string | null;
  userId: string;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("subscription_events").insert({
    amount_vnd: input.amount ?? null,
    created_by: input.createdBy ?? null,
    event_type: input.eventType,
    from_plan_id: input.fromPlanId ?? null,
    from_plan_key: input.fromPlanId ? toSubscriptionPlanKey(input.fromPlanId) : null,
    from_status: input.fromStatus ?? null,
    metadata: input.metadata ?? {},
    months: input.months ?? 1,
    new_period_end: input.newPeriodEnd ?? null,
    new_period_start: input.newPeriodStart ?? null,
    note: input.eventType,
    payment_id: input.paymentId ?? null,
    previous_period_end: input.previousPeriodEnd ?? null,
    subscription_id: input.subscriptionId ?? null,
    to_plan_id: input.toPlanId ?? null,
    to_plan_key: input.toPlanId ? toSubscriptionPlanKey(input.toPlanId) : null,
    to_status: input.toStatus ?? null,
    user_id: input.userId,
  });
}

export async function getCurrentSubscription(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return normalizeSubscription(null, userId);
  }

  return normalizeSubscription(data as BillingSubscriptionRecord | null, userId);
}

export async function ensureFreeSubscription(userId: string) {
  const current = await getCurrentSubscription(userId);

  if (current.id) {
    return current;
  }

  const supabase = createSupabaseAdminClient();
  const plan = getPlanById("free");
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        activated_at: now,
        billing_period: "monthly",
        current_period_start: now,
        latest_payment_request_id: null,
        payment_method: "free",
        plan_id: plan.id,
        plan_key: "free_beta",
        plan_name: plan.name,
        provider: "manual",
        started_at: now,
        status: "active",
        updated_at: now,
        user_id: userId,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new BillingError("BILLING_NOT_CONFIGURED", 503);
  }

  return normalizeSubscription(data as BillingSubscriptionRecord, userId);
}

export async function activateSubscriptionFromPayment(
  paymentId: string,
  input?: {
    adminUser?: AdminContext | null;
    source?: string;
  },
) {
  const supabase = createSupabaseAdminClient();
  const { data: paymentRow, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !paymentRow) {
    throw new BillingError("NOT_FOUND", 404);
  }

  const payment = paymentRow as BillingPaymentRecord;
  const { data: processedEvents } = await supabase
    .from("subscription_events")
    .select("id")
    .eq("payment_id", payment.id)
    .in("event_type", [...PAID_EVENT_TYPES])
    .limit(1);

  if (processedEvents?.length) {
    return getCurrentSubscription(payment.user_id);
  }

  const current = (await getCurrentSubscription(
    payment.user_id,
  )) as BillingSubscriptionRecord;
  const now = new Date();
  const planId = normalizePlanId(payment.plan_id);
  const plan = getPlanById(planId);
  const currentPlanId = normalizePlanId(current.plan_id || current.plan_key);
  const previousPeriodEnd = current.current_period_end ?? null;
  const currentPeriodEndDate = previousPeriodEnd ? new Date(previousPeriodEnd) : null;
  const isSameActivePlan =
    current.id &&
    currentPlanId === planId &&
    current.status === "active" &&
    currentPeriodEndDate &&
    currentPeriodEndDate.getTime() > now.getTime();
  const periodStart = isSameActivePlan
    ? current.current_period_start || now.toISOString()
    : now.toISOString();
  const baseDate = isSameActivePlan ? currentPeriodEndDate : now;
  const periodEnd = addDays(baseDate, 30);
  const eventType = isSameActivePlan
    ? "subscription_extended"
    : currentPlanId !== planId && currentPlanId !== "free"
      ? "subscription_plan_changed"
      : "subscription_activated";

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        activated_at: current.started_at || current.current_period_start || now.toISOString(),
        billing_period: payment.billing_period || "monthly",
        cancel_reason: null,
        cancelled_at: null,
        cancelled_by_user_at: null,
        current_period_end: periodEnd.toISOString(),
        current_period_start: periodStart,
        expired_processed_at: null,
        grace_ends_at: null,
        grace_period_end: null,
        latest_payment_request_id: payment.id,
        payment_method: payment.provider,
        plan_id: plan.id,
        plan_key: toSubscriptionPlanKey(plan.id),
        plan_name: plan.name,
        provider: payment.provider,
        started_at: current.started_at || now.toISOString(),
        status: "active",
        updated_at: now.toISOString(),
        user_id: payment.user_id,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const subscription = data as BillingSubscriptionRecord;

  await supabase
    .from("payments")
    .update({
      subscription_id: subscription.id,
      updated_at: now.toISOString(),
    })
    .eq("id", payment.id);

  await insertSubscriptionEvent({
    amount: payment.amount,
    createdBy: input?.adminUser?.userId ?? null,
    eventType,
    fromPlanId: currentPlanId,
    fromStatus: String(current.status || "free"),
    metadata: {
      provider: payment.provider,
      source: input?.source || "payment",
    },
    newPeriodEnd: subscription.current_period_end ?? null,
    newPeriodStart: subscription.current_period_start ?? null,
    paymentId: payment.id,
    previousPeriodEnd,
    subscriptionId: subscription.id,
    toPlanId: plan.id,
    toStatus: "active",
    userId: payment.user_id,
  });

  await createNotification({
    actionUrl: "/app/billing",
    content: `Gói ${plan.name} của bạn đã được kích hoạt.`,
    metadata: {
      planId: plan.id,
      provider: payment.provider,
      source: input?.source || "payment",
      status: "active",
    },
    title: `Gói ${plan.name} đã được kích hoạt`,
    type: "subscription_activated",
    userId: payment.user_id,
  });

  return normalizeSubscription(subscription, payment.user_id);
}

export async function extendSubscription(input: {
  adminUser?: AdminContext | null;
  days?: number;
  note?: string;
  subscriptionId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", input.subscriptionId)
    .maybeSingle();

  if (error || !data) {
    throw new BillingError("NOT_FOUND", 404);
  }

  const subscription = data as BillingSubscriptionRecord;
  const now = new Date();
  const base =
    subscription.current_period_end &&
    new Date(subscription.current_period_end).getTime() > now.getTime()
      ? new Date(subscription.current_period_end)
      : now;
  const nextEnd = addDays(base, Math.max(1, input.days ?? 30));
  const { data: updated, error: updateError } = await supabase
    .from("subscriptions")
    .update({
      current_period_end: nextEnd.toISOString(),
      status: "active",
      updated_at: now.toISOString(),
    })
    .eq("id", input.subscriptionId)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  await insertSubscriptionEvent({
    createdBy: input.adminUser?.userId ?? null,
    eventType: "subscription_extended",
    fromPlanId: normalizePlanId(subscription.plan_id || subscription.plan_key),
    fromStatus: String(subscription.status),
    metadata: { note: input.note || null, source: "admin_manual" },
    newPeriodEnd: nextEnd.toISOString(),
    previousPeriodEnd: subscription.current_period_end ?? null,
    subscriptionId: subscription.id,
    toPlanId: normalizePlanId(subscription.plan_id || subscription.plan_key),
    toStatus: "active",
    userId: subscription.user_id,
  });

  if (input.adminUser) {
    await writeAdminAuditLog({
      action: "subscription_updated",
      actorRole: input.adminUser.role,
      actorUserId: input.adminUser.userId,
      metadata: {
        days: input.days ?? 30,
        source: "billing_core",
        status: "extended",
      },
      severity: "warning",
      targetId: input.subscriptionId,
      targetType: "subscription",
    });
  }

  return normalizeSubscription(updated as BillingSubscriptionRecord, subscription.user_id);
}

export async function changePlan(input: {
  adminUser?: AdminContext | null;
  note?: string;
  planId: string;
  subscriptionId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", input.subscriptionId)
    .maybeSingle();

  if (error || !data) {
    throw new BillingError("NOT_FOUND", 404);
  }

  const current = data as BillingSubscriptionRecord;
  const planId = normalizePlanId(input.planId);
  const plan = getPlanById(planId);
  const now = new Date();
  const periodEnd = planId === "free" ? null : addDays(now, 30).toISOString();
  const status = planId === "free" ? "active" : "active";

  const { data: updated, error: updateError } = await supabase
    .from("subscriptions")
    .update({
      cancel_reason: planId === "free" ? input.note || "Admin changed plan to free" : null,
      cancelled_at: planId === "free" ? now.toISOString() : null,
      current_period_end: periodEnd,
      current_period_start: planId === "free" ? null : now.toISOString(),
      payment_method: "admin_manual",
      plan_id: plan.id,
      plan_key: toSubscriptionPlanKey(plan.id),
      plan_name: plan.name,
      provider: "admin_manual",
      status,
      updated_at: now.toISOString(),
    })
    .eq("id", input.subscriptionId)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  await insertSubscriptionEvent({
    createdBy: input.adminUser?.userId ?? null,
    eventType: "subscription_plan_changed",
    fromPlanId: normalizePlanId(current.plan_id || current.plan_key),
    fromStatus: String(current.status),
    metadata: { note: input.note || null, source: "admin_manual" },
    newPeriodEnd: periodEnd,
    newPeriodStart: planId === "free" ? null : now.toISOString(),
    previousPeriodEnd: current.current_period_end ?? null,
    subscriptionId: current.id,
    toPlanId: plan.id,
    toStatus: planId === "free" ? "free" : "active",
    userId: current.user_id,
  });

  return normalizeSubscription(updated as BillingSubscriptionRecord, current.user_id);
}

export async function cancelSubscription(input: {
  adminUser?: AdminContext | null;
  reason?: string;
  subscriptionId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      cancel_reason: input.reason || null,
      cancelled_at: now,
      status: "cancelled",
      updated_at: now,
    })
    .eq("id", input.subscriptionId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new BillingError("NOT_FOUND", 404);
  }

  const subscription = data as BillingSubscriptionRecord;

  await insertSubscriptionEvent({
    createdBy: input.adminUser?.userId ?? null,
    eventType: "subscription_cancelled",
    fromPlanId: normalizePlanId(subscription.plan_id || subscription.plan_key),
    fromStatus: "active",
    metadata: { reason: input.reason || null, source: "admin_manual" },
    previousPeriodEnd: subscription.current_period_end ?? null,
    subscriptionId: subscription.id,
    toPlanId: normalizePlanId(subscription.plan_id || subscription.plan_key),
    toStatus: "cancelled",
    userId: subscription.user_id,
  });

  return normalizeSubscription(subscription, subscription.user_id);
}

export async function grantTrial(input: {
  adminUser?: AdminContext | null;
  days?: number;
  note?: string;
  planId?: string;
  subscriptionId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: current, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", input.subscriptionId)
    .maybeSingle();

  if (error || !current) {
    throw new BillingError("NOT_FOUND", 404);
  }

  const subscription = current as BillingSubscriptionRecord;
  const planId = normalizePlanId(input.planId || "pro");
  const plan = getPlanById(planId === "free" ? "pro" : planId);
  const now = new Date();
  const trialEnd = addDays(now, Math.max(1, input.days ?? 14));
  const { data, error: updateError } = await supabase
    .from("subscriptions")
    .update({
      current_period_end: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      payment_method: "admin_trial",
      plan_id: plan.id,
      plan_key: toSubscriptionPlanKey(plan.id),
      plan_name: plan.name,
      provider: "admin_trial",
      status: "trialing",
      trial_ends_at: trialEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", input.subscriptionId)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  await insertSubscriptionEvent({
    createdBy: input.adminUser?.userId ?? null,
    eventType: "subscription_trial_granted",
    fromPlanId: normalizePlanId(subscription.plan_id || subscription.plan_key),
    fromStatus: String(subscription.status),
    metadata: {
      days: input.days ?? 14,
      note: input.note || null,
      source: "admin_manual",
    },
    newPeriodEnd: trialEnd.toISOString(),
    newPeriodStart: now.toISOString(),
    previousPeriodEnd: subscription.current_period_end ?? null,
    subscriptionId: subscription.id,
    toPlanId: plan.id,
    toStatus: "trialing",
    userId: subscription.user_id,
  });

  return normalizeSubscription(data as BillingSubscriptionRecord, subscription.user_id);
}

export async function expireSubscriptions() {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .in("status", ["active", "trialing"])
    .not("current_period_end", "is", null)
    .lt("current_period_end", now.toISOString())
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as BillingSubscriptionRecord[];
  const graceEnd = addDays(now, 3).toISOString();
  let movedToGrace = 0;

  for (const row of rows) {
    await supabase
      .from("subscriptions")
      .update({
        grace_ends_at: graceEnd,
        grace_period_end: graceEnd,
        status: "grace",
        updated_at: now.toISOString(),
      })
      .eq("id", row.id);
    await insertSubscriptionEvent({
      eventType: "subscription_grace_started",
      fromPlanId: normalizePlanId(row.plan_id || row.plan_key),
      fromStatus: String(row.status),
      newPeriodEnd: row.current_period_end ?? null,
      previousPeriodEnd: row.current_period_end ?? null,
      subscriptionId: row.id,
      toPlanId: normalizePlanId(row.plan_id || row.plan_key),
      toStatus: "grace",
      userId: row.user_id,
    });
    movedToGrace += 1;
  }

  return movedToGrace;
}

export async function downgradeExpiredSubscriptions() {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "grace")
    .or(`grace_ends_at.lt.${now.toISOString()},grace_period_end.lt.${now.toISOString()}`)
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  let expired = 0;

  for (const row of (data ?? []) as BillingSubscriptionRecord[]) {
    await supabase
      .from("subscriptions")
      .update({
        expired_processed_at: now.toISOString(),
        status: "expired",
        updated_at: now.toISOString(),
      })
      .eq("id", row.id);
    await insertSubscriptionEvent({
      eventType: "subscription_expired",
      fromPlanId: normalizePlanId(row.plan_id || row.plan_key),
      fromStatus: "grace",
      previousPeriodEnd: row.current_period_end ?? null,
      subscriptionId: row.id,
      toPlanId: "free",
      toStatus: "expired",
      userId: row.user_id,
    });
    expired += 1;
  }

  return expired;
}

export async function getSubscriptionStatus(userId: string) {
  const subscription = await getCurrentSubscription(userId);
  const planId = getActivePlanId(subscription);

  return {
    plan: getPlanById(planId),
    planId,
    subscription,
  };
}
