"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAddOnOrderForUser } from "@/lib/orders/orders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return user.id;
}

export async function createAddOnOrderAction(formData: FormData) {
  const userId = await requireCurrentUserId();
  let orderId = "";

  try {
    const order = await createAddOnOrderForUser({ formData, userId });
    orderId = order.id;
    revalidatePath("/app/billing/orders");
  } catch {
    redirect("/app/billing/add-ons?error=create_order_failed");
  }

  redirect(`/app/billing/orders?created=${orderId}`);
}
