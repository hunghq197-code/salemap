import { NextResponse } from "next/server";
import { createSalesGoal, getSalesGoals } from "@/lib/data/sales-goals";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSalesGoalSchema } from "@/lib/validators/sales-analytics";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function GET(request: Request) {
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const url = new URL(request.url);
  const result = await getSalesGoals({
    includeArchived: url.searchParams.get("includeArchived") === "true",
    pinnedOnly: url.searchParams.get("pinned") === "true",
    status: url.searchParams.get("status") || undefined,
  });

  return NextResponse.json({ data: result, success: true });
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "sales-goal-create",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = createSalesGoalSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const goal = await createSalesGoal(parsed.data);
    return NextResponse.json({ data: goal, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "CREATE_GOAL_FAILED", 500);
  }
}
