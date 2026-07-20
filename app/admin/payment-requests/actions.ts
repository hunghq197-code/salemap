"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  approvePaymentRequest,
  rejectPaymentRequest,
} from "@/lib/admin/data/payment-requests";

export async function approvePaymentRequestAction(id: string, formData: FormData) {
  try {
    await approvePaymentRequest(id, String(formData.get("adminNote") || ""));
    revalidatePath("/admin/payment-requests");
    revalidatePath("/app/billing");
  } catch {
    redirect("/admin/payment-requests?error=approve_failed");
  }

  redirect("/admin/payment-requests?updated=approved");
}

export async function rejectPaymentRequestAction(id: string, formData: FormData) {
  try {
    await rejectPaymentRequest(id, String(formData.get("adminNote") || ""));
    revalidatePath("/admin/payment-requests");
    revalidatePath("/app/billing");
  } catch {
    redirect("/admin/payment-requests?error=reject_failed");
  }

  redirect("/admin/payment-requests?updated=rejected");
}
