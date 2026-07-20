import { NextResponse } from "next/server";
import { rebuildSalesActivityForUser } from "@/lib/data/sales-activity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  const processedDays = await rebuildSalesActivityForUser(user.id, dateOnly(from), dateOnly(to));

  return NextResponse.json({ data: { processedDays }, success: true });
}
