import { requireAdmin, requireAdminForApi } from "@/lib/admin/auth";
import {
  getUserLabel,
  listAuthUsers,
  listProfiles,
  toProfileMap,
  toUserEmailMap,
} from "@/lib/admin/data/common";
import type { AdminSearchParams } from "@/lib/admin/data/utils";
import { getParam } from "@/lib/admin/data/utils";
import type { CancellationRequestRecord } from "@/lib/data/cancellation-requests";
import { updateCancellationRequestReview } from "@/lib/data/cancellation-requests";
import type { PaymentRequestRecord } from "@/lib/data/payment-requests";
import type { SubscriptionRecord } from "@/lib/data/subscriptions";
import { createSubscriptionEvent } from "@/lib/data/subscription-events";
import { SUBSCRIPTION_EVENT_TYPES } from "@/lib/constants/subscription-lifecycle";
import { SUBSCRIPTION_PLANS } from "@/lib/constants/subscription-plans";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminRevenuePayment = PaymentRequestRecord & {
  reviewedByLabel?: string;
  userEmail?: string;
  userLabel?: string;
};

export type AdminRevenueCancellation = CancellationRequestRecord & {
  userEmail?: string;
  userLabel?: string;
};

export type AdminRevenueSubscription = SubscriptionRecord & {
  daysRemaining: number | null;
  userEmail?: string;
  userLabel?: string;
};

export type AdminRevenueResult = {
  cancellations: AdminRevenueCancellation[];
  expiringSubscriptions: AdminRevenueSubscription[];
  kpis: {
    activePaidUsers: number;
    activeProPlusUsers: number;
    activeProUsers: number;
    cancellationRequestsThisMonth: number;
    expiredThisMonth: number;
    manualRevenueThisMonth: number;
    mrrVnd: number;
    renewalRate: number;
    renewedThisMonth: number;
  };
  payments: AdminRevenuePayment[];
  schemaReady: boolean;
};

function dateValue(row: PaymentRequestRecord) {
  return row.reviewed_at || row.updated_at || row.created_at || "";
}

function inCurrentMonth(value?: string | null) {
  if (!value) {
    return false;
  }

  return value.slice(0, 7) === new Date().toISOString().slice(0, 7);
}

function daysRemaining(value?: string | null) {
  if (!value) {
    return null;
  }

  return Math.ceil(
    (new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
}

function isActivePaid(subscription: SubscriptionRecord) {
  if (
    subscription.status !== "active" ||
    !["pro", "pro_plus"].includes(subscription.plan_key)
  ) {
    return false;
  }

  if (!subscription.current_period_end) {
    return true;
  }

  return new Date(subscription.current_period_end).getTime() > Date.now();
}

export async function getAdminRevenue(params?: AdminSearchParams): Promise<AdminRevenueResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const [subscriptionsResult, paymentsResult, cancellationsResult, users, profiles] =
    await Promise.all([
      supabase.from("subscriptions").select("*").limit(1000),
      supabase
        .from("payment_requests")
        .select("*")
        .eq("status", "paid")
        .order("reviewed_at", { ascending: false })
        .limit(1000),
      supabase
        .from("cancellation_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      listAuthUsers(),
      listProfiles(),
    ]);

  if (subscriptionsResult.error || paymentsResult.error || cancellationsResult.error) {
    return {
      cancellations: [],
      expiringSubscriptions: [],
      kpis: {
        activePaidUsers: 0,
        activeProPlusUsers: 0,
        activeProUsers: 0,
        cancellationRequestsThisMonth: 0,
        expiredThisMonth: 0,
        manualRevenueThisMonth: 0,
        mrrVnd: 0,
        renewalRate: 0,
        renewedThisMonth: 0,
      },
      payments: [],
      schemaReady: false,
    };
  }

  const emailMap = toUserEmailMap(users);
  const profileMap = toProfileMap(profiles);
  const reviewerMap = new Map(users.map((user) => [user.id, user.email ?? user.id]));
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRecord[];
  const payments = (paymentsResult.data ?? []) as PaymentRequestRecord[];
  const cancellations = (cancellationsResult.data ?? []) as CancellationRequestRecord[];
  const activePaidSubscriptions = subscriptions.filter(isActivePaid);
  const activeProUsers = activePaidSubscriptions.filter((item) => item.plan_key === "pro").length;
  const activeProPlusUsers = activePaidSubscriptions.filter((item) => item.plan_key === "pro_plus").length;
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fromDate = getParam(params, "fromDate") || "";
  const toDate = getParam(params, "toDate") || "";
  const planKey = getParam(params, "planKey") || "";
  const requestType = getParam(params, "requestType") || "";
  const filteredPayments = payments.filter((payment) => {
    const paidDate = dateValue(payment).slice(0, 10);

    if (fromDate && paidDate < fromDate) return false;
    if (toDate && paidDate > toDate) return false;
    if (planKey && payment.plan_key !== planKey) return false;
    if (requestType && (payment.request_type || "new_subscription") !== requestType) return false;

    return true;
  });
  const renewedThisMonth = payments.filter(
    (payment) =>
      payment.request_type === "renewal" &&
      payment.status === "paid" &&
      inCurrentMonth(dateValue(payment)),
  ).length;
  const expiredThisMonth = subscriptions.filter(
    (subscription) =>
      subscription.status === "expired" &&
      inCurrentMonth(subscription.expired_processed_at || subscription.updated_at),
  ).length;
  const manualRevenueThisMonth = payments
    .filter((payment) => inCurrentMonth(dateValue(payment)))
    .reduce((sum, payment) => sum + payment.amount_vnd, 0);
  const renewalRateBase = renewedThisMonth + expiredThisMonth;

  return {
    cancellations: cancellations.map((row) => ({
      ...row,
      userEmail: emailMap.get(row.user_id) || "",
      userLabel: getUserLabel(row.user_id, profileMap, emailMap),
    })),
    expiringSubscriptions: subscriptions
      .filter(
        (subscription) =>
          isActivePaid(subscription) &&
          Boolean(subscription.current_period_end) &&
          new Date(subscription.current_period_end as string).getTime() <= inSevenDays.getTime(),
      )
      .sort((a, b) =>
        String(a.current_period_end || "").localeCompare(String(b.current_period_end || "")),
      )
      .map((subscription) => ({
        ...subscription,
        daysRemaining: daysRemaining(subscription.current_period_end),
        userEmail: emailMap.get(subscription.user_id) || "",
        userLabel: getUserLabel(subscription.user_id, profileMap, emailMap),
      })),
    kpis: {
      activePaidUsers: activePaidSubscriptions.length,
      activeProPlusUsers,
      activeProUsers,
      cancellationRequestsThisMonth: cancellations.filter((item) =>
        inCurrentMonth(item.created_at),
      ).length,
      expiredThisMonth,
      manualRevenueThisMonth,
      mrrVnd:
        activeProUsers * SUBSCRIPTION_PLANS.pro.priceVnd +
        activeProPlusUsers * SUBSCRIPTION_PLANS.pro_plus.priceVnd,
      renewalRate:
        renewalRateBase > 0 ? Math.round((renewedThisMonth / renewalRateBase) * 100) : 0,
      renewedThisMonth,
    },
    payments: filteredPayments.map((row) => ({
      ...row,
      reviewedByLabel: row.reviewed_by ? reviewerMap.get(row.reviewed_by) || row.reviewed_by : "",
      userEmail: emailMap.get(row.user_id) || "",
      userLabel: getUserLabel(row.user_id, profileMap, emailMap),
    })),
    schemaReady: true,
  };
}

export async function markSubscriptionContacted(subscriptionId: string, note?: string) {
  const admin = await requireAdminForApi();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "SUBSCRIPTION_NOT_FOUND");
  }

  const subscription = data as SubscriptionRecord;

  await createSubscriptionEvent({
    createdBy: admin.userId,
    eventType: SUBSCRIPTION_EVENT_TYPES.PLAN_CHANGED,
    fromPlanKey: subscription.plan_key,
    note: note || "Admin marked renewal contact",
    previousPeriodEnd: subscription.current_period_end ?? null,
    subscriptionId: subscription.id ?? null,
    toPlanKey: subscription.plan_key,
    userId: subscription.user_id,
  });
}

export async function updateCancellationReview(input: {
  adminNote?: string;
  id: string;
  status: "new" | "reviewing" | "resolved" | "cancelled" | "retained" | "closed";
}) {
  const admin = await requireAdminForApi();

  return updateCancellationRequestReview({
    adminNote: input.adminNote,
    adminUserId: admin.userId,
    id: input.id,
    status: input.status,
  });
}
