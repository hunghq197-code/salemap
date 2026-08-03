"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { markOrderPaidAndProvision } from "@/lib/orders/orders";

export async function markOrderPaidAndProvisionAction(orderId: string) {
  try {
    await markOrderPaidAndProvision(orderId);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
  } catch {
    redirect(`/admin/orders/${orderId}?error=provision_failed`);
  }

  redirect(`/admin/orders/${orderId}?updated=provisioned`);
}
