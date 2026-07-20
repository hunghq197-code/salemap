"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  downgradeSubscriptionToFree,
  extendSubscriptionOneMonth,
  markSubscriptionCancelled,
} from "@/lib/admin/data/subscriptions";

export async function extendSubscriptionAction(
  subscriptionId: string,
  formData: FormData,
) {
  try {
    await extendSubscriptionOneMonth(
      subscriptionId,
      String(formData.get("note") || ""),
    );
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
    await downgradeSubscriptionToFree(
      subscriptionId,
      String(formData.get("reason") || ""),
    );
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
    await markSubscriptionCancelled(
      subscriptionId,
      String(formData.get("note") || ""),
    );
    revalidatePath("/admin/subscriptions");
  } catch {
    redirect("/admin/subscriptions?error=cancel_failed");
  }

  redirect("/admin/subscriptions?updated=cancelled");
}
