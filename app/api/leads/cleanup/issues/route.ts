import { NextResponse } from "next/server";
import { getDataQualityIssues } from "@/lib/leads/data-quality";
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
  const type = url.searchParams.get("type") || undefined;
  const result = await getDataQualityIssues({ page, status, type });

  return NextResponse.json({ data: result, success: true });
}
