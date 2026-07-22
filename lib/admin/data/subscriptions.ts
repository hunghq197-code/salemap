import { writeAdminAuditLog } from "@/lib/admin/audit-log";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
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
import {
  getSubscriptionPlan,
  isPaidSubscriptionPlanKey,
  isSubscriptionPlanKey,
} from "@/lib/constants/subscription-plans";
import {
  activateSubscriptionForUser,
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
  await requirePermission(ADMIN_PERMISSIONS.VIEW_SUBSCRIPTIONS);

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
  const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION);
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

  const renewed = await renewSubscriptionForUser({
    adminUserId: admin.userId,
    months: 1,
    note: note || "Admin extend 1 month",
    planKey: subscription.plan_key,
    userId: subscription.user_id,
  });

  await writeAdminAuditLog({
    action: "subscription_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      months: 1,
      planKey: subscription.plan_key,
      status: "extended",
    },
    severity: "warning",
    targetId: subscriptionId,
    targetType: "subscription",
  });

  return renewed;
}

export async function downgradeSubscriptionToFree(subscriptionId: string, reason?: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "SUBSCRIPTION_NOT_FOUND");
  }

  const downgraded = await downgradeUserToFree({
    adminUserId: admin.userId,
    reason,
    userId: String(data.user_id),
  });

  await writeAdminAuditLog({
    action: "subscription_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      status: "downgraded_to_free",
    },
    severity: "warning",
    targetId: subscriptionId,
    targetType: "subscription",
  });

  return downgraded;
}

export async function markSubscriptionCancelled(subscriptionId: string, note?: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION);
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

  await writeAdminAuditLog({
    action: "subscription_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      planKey: subscription.plan_key,
      status: "cancelled",
    },
    severity: "warning",
    targetId: subscriptionId,
    targetType: "subscription",
  });

  return subscription;
}

export async function changeSubscriptionPlan(
  subscriptionId: string,
  planKey: string,
  input?: {
    months?: number;
    note?: string;
  },
) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION);

  if (!isSubscriptionPlanKey(planKey)) {
    throw new Error("INVALID_PLAN");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id,plan_key")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "SUBSCRIPTION_NOT_FOUND");
  }

  const previousPlanKey = String(data.plan_key || "free_beta");
  const userId = String(data.user_id);
  const subscription =
    planKey === "free_beta"
      ? await downgradeUserToFree({
          adminUserId: admin.userId,
          reason: input?.note || "Admin changed plan to free",
          userId,
        })
      : await activateSubscriptionForUser({
          adminUserId: admin.userId,
          months: Math.max(1, Math.min(12, Number(input?.months ?? 1) || 1)),
          note: input?.note || "Admin changed plan",
          paymentMethod: "admin_manual",
          planKey,
          userId,
        });

  await writeAdminAuditLog({
    action: "subscription_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      fromPlanKey: previousPlanKey,
      isPaidPlan: isPaidSubscriptionPlanKey(planKey),
      status: "plan_changed",
      toPlanKey: planKey,
    },
    severity: "warning",
    targetId: subscriptionId,
    targetType: "subscription",
  });

  return subscription;
}
