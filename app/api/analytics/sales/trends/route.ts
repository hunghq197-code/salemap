import { NextResponse } from "next/server";
import { calculateDailyTrendForUser } from "@/lib/analytics/sales-analytics";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyticsPeriodSchema } from "@/lib/validators/sales-analytics";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const url = new URL(request.url);
  const parsed = analyticsPeriodSchema.safeParse({
    customFrom: url.searchParams.get("customFrom") || undefined,
    customTo: url.searchParams.get("customTo") || undefined,
    period: url.searchParams.get("period") || "last_30_days",
  });

  if (!parsed.success) {
    return jsonError("INVALID_PERIOD");
  }

  const data = await calculateDailyTrendForUser(user.id, parsed.data);
  return NextResponse.json({ data, success: true });
}
