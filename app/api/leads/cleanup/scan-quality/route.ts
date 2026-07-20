import { NextResponse } from "next/server";
import { scanLeadDataQualityForUser } from "@/lib/leads/data-quality";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  try {
    const summary = await scanLeadDataQualityForUser(user.id);

    return NextResponse.json({ data: summary, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "SCAN_QUALITY_FAILED", 500);
  }
}
