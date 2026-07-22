"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import {
  cancelPayment,
  markPaymentFailed,
  processPaymentPaid,
} from "@/lib/billing/payments";

export async function markBillingPaymentPaidAction(
  paymentId: string,
  formData: FormData,
) {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_PAYMENT_STATUS);
    await processPaymentPaid({
      adminUser: admin,
      paymentId,
      providerData: {
        adminNote: String(formData.get("adminNote") || ""),
      },
      source: "admin_manual",
    });
    revalidatePath("/admin/payments");
  } catch {
    redirect("/admin/payments?error=mark_paid_failed");
  }

  redirect("/admin/payments?updated=paid");
}

export async function markBillingPaymentFailedAction(
  paymentId: string,
  formData: FormData,
) {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_PAYMENT_STATUS);
    await markPaymentFailed({
      adminUser: admin,
      note: String(formData.get("adminNote") || ""),
      paymentId,
      reason: "admin_mark_failed",
    });
    revalidatePath("/admin/payments");
  } catch {
    redirect("/admin/payments?error=mark_failed_failed");
  }

  redirect("/admin/payments?updated=failed");
}

export async function cancelBillingPaymentAction(
  paymentId: string,
  formData: FormData,
) {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_PAYMENT_STATUS);
    await cancelPayment({
      adminUser: admin,
      paymentId,
      reason: String(formData.get("reason") || "admin_cancelled"),
    });
    revalidatePath("/admin/payments");
  } catch {
    redirect("/admin/payments?error=cancel_failed");
  }

  redirect("/admin/payments?updated=cancelled");
}
