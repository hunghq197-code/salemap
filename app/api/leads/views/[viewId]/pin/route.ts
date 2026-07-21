import { NextResponse } from "next/server";
import { guardMutationRequest } from "@/lib/security/request";
import { pinSavedView, unpinSavedView } from "@/lib/data/lead-saved-views";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    viewId: string;
  }>;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function POST(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "lead-saved-view-pin",
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
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => null);
  const pinned = typeof body === "object" && body ? Boolean((body as { pinned?: boolean }).pinned) : true;

  try {
    if (pinned) {
      await pinSavedView(params.viewId);
    } else {
      await unpinSavedView(params.viewId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "PIN_VIEW_FAILED", 500);
  }
}
