import { NextResponse } from "next/server";
import {
  getPipelineColumnsWithLeads,
  type PipelineCadenceFilter,
  type PipelineSort,
} from "@/lib/data/lead-pipeline";
import { deserializeLeadFilters } from "@/lib/leads/lead-filters";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const followUpValues = ["future", "overdue", "this_week", "today", "today_or_overdue"] as const;
const cadenceValues = ["active", "none", "paused"] as const;
const sortValues = ["follow_up", "name", "position", "updated"] as const;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSafeEnum<T extends readonly string[]>(
  value: string | null,
  allowed: T,
  fallback = "",
) {
  return value && allowed.includes(value) ? value : fallback;
}

function getSafeSource(value: string | null) {
  const clean = value?.trim() ?? "";

  return /^[a-z0-9_-]{1,48}$/i.test(clean) ? clean : "";
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitPerColumn = Number(url.searchParams.get("limitPerColumn") || 50);
  const source = getSafeSource(url.searchParams.get("source"));
  const followUp = getSafeEnum(url.searchParams.get("followUp"), followUpValues);
  const cadence = getSafeEnum(url.searchParams.get("cadence"), cadenceValues);
  const tagId = uuidPattern.test(url.searchParams.get("tagId") ?? "")
    ? (url.searchParams.get("tagId") ?? "")
    : "";
  const sort = getSafeEnum(url.searchParams.get("sort"), sortValues, "position") as PipelineSort;
  const result = await getPipelineColumnsWithLeads({
    cadenceFilter: (cadence || undefined) as PipelineCadenceFilter | undefined,
    filters: deserializeLeadFilters({
      followUp: followUp || undefined,
      source: source || undefined,
      tagIds: tagId || undefined,
    }),
    limitPerColumn,
    sort,
  });

  return NextResponse.json({ data: result, success: true });
}
