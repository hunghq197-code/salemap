"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import {
  cancelSubscription,
  changePlan,
  extendSubscription,
  grantTrial,
} from "@/lib/billing/subscriptions";

export async function extendSubscriptionAction(
  subscriptionId: string,
  formData: FormData,
) {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION);
    await extendSubscription({
      adminUser: admin,
      days: 30,
      note: String(formData.get("note") || ""),
      subscriptionId,
    });
    revalidatePath("/admin/subscriptions");
  } catch {
    redirect("/admin/subscriptions?error=extend_failed");
  }

  redirect("/admin/subscriptions?updated=extended");
}

export async function downgradeSubscriptionAction(
  subscriptionId: string,
  formData: FormData,
) {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION);
    await changePlan({
      adminUser: admin,
      note: String(formData.get("reason") || ""),
      planId: "free",
      subscriptionId,
    });
    revalidatePath("/admin/subscriptions");
  } catch {
    redirect("/admin/subscriptions?error=downgrade_failed");
  }

  redirect("/admin/subscriptions?updated=downgraded");
}

export async function markSubscriptionCancelledAction(
  subscriptionId: string,
  formData: FormData,
) {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION);
    await cancelSubscription({
      adminUser: admin,
      reason: String(formData.get("note") || ""),
      subscriptionId,
    });
    revalidatePath("/admin/subscriptions");
  } catch {
    redirect("/admin/subscriptions?error=cancel_failed");
  }

  redirect("/admin/subscriptions?updated=cancelled");
}

export async function grantTrialAction(
  subscriptionId: string,
  formData: FormData,
) {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION);
    await grantTrial({
      adminUser: admin,
      days: Math.max(1, Math.min(90, Number(formData.get("days") || 14) || 14)),
      note: String(formData.get("note") || ""),
      planId: String(formData.get("planId") || "pro"),
      subscriptionId,
    });
    revalidatePath("/admin/subscriptions");
  } catch {
    redirect("/admin/subscriptions?error=grant_trial_failed");
  }

  redirect("/admin/subscriptions?updated=trial_granted");
}
