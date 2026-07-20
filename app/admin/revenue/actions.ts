"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  markSubscriptionContacted,
  updateCancellationReview,
} from "@/lib/admin/data/revenue";

export async function markSubscriptionContactedAction(
  subscriptionId: string,
  formData: FormData,
) {
  try {
    await markSubscriptionContacted(
      subscriptionId,
      String(formData.get("note") || ""),
    );
    revalidatePath("/admin/revenue");
  } catch {
    redirect("/admin/revenue?error=contact_failed");
  }

  redirect("/admin/revenue?updated=contacted");
}

export async function updateCancellationReviewAction(
  cancellationRequestId: string,
  formData: FormData,
) {
  try {
    await updateCancellationReview({
      adminNote: String(formData.get("adminNote") || ""),
      id: cancellationRequestId,
      status: String(formData.get("status") || "reviewing") as
        | "cancelled"
        | "closed"
        | "new"
        | "resolved"
        | "retained"
        | "reviewing",
    });
    revalidatePath("/admin/revenue");
  } catch {
    redirect("/admin/revenue?error=cancellation_update_failed");
  }

  redirect("/admin/revenue?updated=cancellation");
}
