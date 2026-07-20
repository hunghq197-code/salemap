import { NextResponse } from "next/server";
import { createSalesAnalyticsSnapshot } from "@/lib/analytics/sales-analytics";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function unauthorized() {
  return NextResponse.json({ error: "UNAUTHORIZED", success: false }, { status: 401 });
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function authOk(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function getActiveUserIds() {
  const supabase = createSupabaseAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const activity = await supabase
    .from("sales_activity_daily")
    .select("user_id")
    .gte("activity_date", dateOnly(since))
    .limit(5000);

  if (!activity.error && activity.data?.length) {
    return Array.from(new Set(activity.data.map((row) => String(row.user_id))));
  }

  const fallback = await supabase
    .from("user_activity_daily")
    .select("user_id")
    .gte("activity_date", dateOnly(since))
    .limit(5000);

  if (!fallback.error && fallback.data?.length) {
    return Array.from(new Set(fallback.data.map((row) => String(row.user_id))));
  }

  const profiles = await supabase.from("user_profiles").select("user_id").limit(1000);

  if (profiles.error) {
    return [];
  }

  return Array.from(new Set((profiles.data ?? []).map((row) => String(row.user_id))));
}

export async function GET(request: Request) {
  if (!authOk(request)) {
    return unauthorized();
  }

  const userIds = await getActiveUserIds();
  let processed = 0;
  const failed: string[] = [];

  for (const userId of userIds) {
    try {
      await createSalesAnalyticsSnapshot(userId, "daily");
      await createSalesAnalyticsSnapshot(userId, "weekly");
      await createSalesAnalyticsSnapshot(userId, "monthly");
      processed += 1;
    } catch {
      failed.push(userId);
    }
  }

  return NextResponse.json({
    data: {
      failedCount: failed.length,
      processed,
      totalUsers: userIds.length,
    },
    success: true,
  });
}
