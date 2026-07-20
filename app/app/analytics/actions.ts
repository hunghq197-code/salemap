"use server";

import { redirect } from "next/navigation";
import { rebuildSalesActivityForUser } from "@/lib/data/sales-activity";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function rebuildSalesAnalyticsAction() {
  const { userId } = await createAuthedSupabaseServerClient();
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);

  await rebuildSalesActivityForUser(userId, dateOnly(from), dateOnly(to));
  redirect("/app/analytics?toast=sales_analytics_rebuilt");
}
