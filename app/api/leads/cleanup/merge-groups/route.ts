import { NextResponse } from "next/server";
import { getMergeGroups } from "@/lib/leads/duplicate-detection";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || 1);
  const status = url.searchParams.get("status") || undefined;
  const result = await getMergeGroups({ page, status });

  return NextResponse.json({ data: result, success: true });
}
