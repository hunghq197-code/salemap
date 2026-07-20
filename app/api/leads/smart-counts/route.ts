import { NextResponse } from "next/server";
import { getSmartViewCounts } from "@/lib/data/lead-filtered-list";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const counts = await getSmartViewCounts();

  return NextResponse.json({ data: counts, success: true });
}
