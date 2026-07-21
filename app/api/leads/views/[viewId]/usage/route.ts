import { NextResponse } from "next/server";
import { guardMutationRequest } from "@/lib/security/request";
import { incrementSavedViewUsage } from "@/lib/data/lead-saved-views";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    viewId: string;
  }>;
};

export async function POST(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "lead-saved-view-usage",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const params = await props.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await incrementSavedViewUsage(params.viewId);

  return NextResponse.json({ success: true });
}
