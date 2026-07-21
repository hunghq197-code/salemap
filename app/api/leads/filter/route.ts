import { NextResponse } from "next/server";
import { getFilteredLeads } from "@/lib/data/lead-filtered-list";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { leadFiltersSchema } from "@/lib/validators/lead-views";

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "lead-filter",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        filters?: unknown;
        limit?: number;
        page?: number;
        sortBy?: string;
        sortDirection?: "asc" | "desc";
      }
    | null;
  const parsed = leadFiltersSchema.safeParse(body?.filters ?? {});

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400 });
  }

  const result = await getFilteredLeads({
    filters: parsed.data,
    limit: body?.limit,
    page: body?.page,
    sortBy: body?.sortBy,
    sortDirection: body?.sortDirection,
  });

  return NextResponse.json({ data: result, success: true });
}
