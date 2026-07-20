import { NextResponse } from "next/server";
import { getPipelineColumnsWithLeads } from "@/lib/data/lead-pipeline";
import { deserializeLeadFilters } from "@/lib/leads/lead-filters";
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
  const params = Object.fromEntries(url.searchParams.entries());
  const limitPerColumn = Number(url.searchParams.get("limitPerColumn") || 50);
  const result = await getPipelineColumnsWithLeads({
    filters: deserializeLeadFilters(params),
    limitPerColumn,
  });

  return NextResponse.json({ data: result, success: true });
}
