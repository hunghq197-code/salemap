"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { syncAdminPaymentGatewayTransaction } from "@/lib/admin/data/payment-gateway";

export async function syncPaymentGatewayAction(id: string) {
  try {
    await syncAdminPaymentGatewayTransaction(id);
    revalidatePath("/admin/payment-gateway");
    revalidatePath("/app/billing");
  } catch {
    redirect("/admin/payment-gateway?error=sync_failed");
  }

  redirect("/admin/payment-gateway?updated=synced");
}
