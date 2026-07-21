import { NextResponse } from "next/server";
import { guardMutationRequest } from "@/lib/security/request";
import { pinSalesGoal, unpinSalesGoal } from "@/lib/data/sales-goals";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function POST(request: Request, props: { params: Promise<{ goalId: string }> }) {
  const guardError = guardMutationRequest(request, {
    key: "sales-goal-pin",
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
  const pinned = body?.pinned === true;

  try {
    const goal = pinned ? await pinSalesGoal(params.goalId) : await unpinSalesGoal(params.goalId);
    return NextResponse.json({ data: goal, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "PIN_GOAL_FAILED", 500);
  }
}
