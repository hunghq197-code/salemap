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
import type { SubscriptionRecord } from "@/lib/data/subscriptions";
import { getSubscriptionPlan } from "@/lib/constants/subscription-plans";
import {
  downgradeUserToFree,
  renewSubscriptionForUser,
} from "@/lib/data/subscriptions";
import { createSubscriptionEvent } from "@/lib/data/subscription-events";
import { SUBSCRIPTION_EVENT_TYPES } from "@/lib/constants/subscription-lifecycle";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminSubscriptionRow = SubscriptionRecord & {
  daysRemaining: number | null;
  userEmail?: string;
  userLabel?: string;
};

export type AdminSubscriptionsResult = {
  items: AdminSubscriptionRow[];
  schemaReady: boolean;
};

function daysRemaining(value?: string | null) {
  if (!value) {
    return null;
  }

  return Math.ceil(
    (new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
}

export async function getAdminSubscriptions(
  params?: AdminSearchParams,
): Promise<AdminSubscriptionsResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const planKey = getParam(params, "planKey") || "";
  const status = getParam(params, "status") || "";
  const expiringSoon = getParam(params, "expiringSoon") === "true";
  const cancelledRequested = getParam(params, "cancelledRequested") === "true";
  let query = supabase
    .from("subscriptions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1000);

  if (planKey) {
    query = query.eq("plan_key", planKey);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (cancelledRequested) {
    query = query.not("cancelled_by_user_at", "is", null);
  }

  const [subscriptionsResult, users, profiles] = await Promise.all([
    query,
    listAuthUsers(),
    listProfiles(),
  ]);

  if (subscriptionsResult.error) {
    return {
      items: [],
      schemaReady: false,
    };
  }

  const emailMap = toUserEmailMap(users);
  const profileMap = toProfileMap(profiles);
  const rows = ((subscriptionsResult.data ?? []) as SubscriptionRecord[])
    .map((subscription) => {
      const plan = getSubscriptionPlan(subscription.plan_key);

      return {
        ...subscription,
        daysRemaining: daysRemaining(subscription.current_period_end),
        plan_name: plan.name,
        userEmail: emailMap.get(subscription.user_id) || "",
        userLabel: getUserLabel(subscription.user_id, profileMap, emailMap),
      };
    })
    .filter((subscription) => {
      if (!expiringSoon) {
        return true;
      }

      return (
        subscription.daysRemaining !== null &&
        subscription.daysRemaining >= 0 &&
        subscription.daysRemaining <= 7
      );
    });

  return {
    items: rows,
    schemaReady: true,
  };
}

export async function extendSubscriptionOneMonth(subscriptionId: string, note?: string) {
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

  if (subscription.plan_key !== "pro" && subscription.plan_key !== "pro_plus") {
    throw new Error("SUBSCRIPTION_NOT_PAID");
  }

  return renewSubscriptionForUser({
    adminUserId: admin.userId,
    months: 1,
    note: note || "Admin extend 1 month",
    planKey: subscription.plan_key,
    userId: subscription.user_id,
  });
}

export async function downgradeSubscriptionToFree(subscriptionId: string, reason?: string) {
  const admin = await requireAdminForApi();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "SUBSCRIPTION_NOT_FOUND");
  }

  return downgradeUserToFree({
    adminUserId: admin.userId,
    reason,
    userId: String(data.user_id),
  });
}

export async function markSubscriptionCancelled(subscriptionId: string, note?: string) {
  const admin = await requireAdminForApi();
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      cancelled_at: now,
      status: "cancelled",
      updated_at: now,
    })
    .eq("id", subscriptionId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "SUBSCRIPTION_CANCEL_FAILED");
  }

  const subscription = data as SubscriptionRecord;

  await createSubscriptionEvent({
    createdBy: admin.userId,
    eventType: SUBSCRIPTION_EVENT_TYPES.CANCELLED,
    fromPlanKey: subscription.plan_key,
    note: note || "Admin marked cancelled",
    previousPeriodEnd: subscription.current_period_end ?? null,
    subscriptionId: subscription.id ?? null,
    toPlanKey: subscription.plan_key,
    userId: subscription.user_id,
  });

  return subscription;
}
