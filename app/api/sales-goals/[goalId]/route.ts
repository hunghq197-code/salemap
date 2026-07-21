import { NextResponse } from "next/server";
import { guardMutationRequest } from "@/lib/security/request";
import {
  archiveSalesGoal,
  getSalesGoalById,
  updateSalesGoal,
} from "@/lib/data/sales-goals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateSalesGoalSchema } from "@/lib/validators/sales-analytics";

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

export async function GET(_request: Request, props: { params: Promise<{ goalId: string }> }) {
  const params = await props.params;
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const goal = await getSalesGoalById(params.goalId);

  if (!goal) {
    return jsonError("NOT_FOUND", 404);
  }

  return NextResponse.json({ data: goal, success: true });
}

export async function PATCH(request: Request, props: { params: Promise<{ goalId: string }> }) {
  const guardError = guardMutationRequest(request, {
    key: "sales-goal-update",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const params = await props.params;
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSalesGoalSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const goal = await updateSalesGoal(params.goalId, parsed.data);
    return NextResponse.json({ data: goal, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "UPDATE_GOAL_FAILED", 500);
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ goalId: string }> }) {
  const guardError = guardMutationRequest(request, {
    key: "sales-goal-delete",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const params = await props.params;
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  try {
    const goal = await archiveSalesGoal(params.goalId);
    return NextResponse.json({ data: goal, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "ARCHIVE_GOAL_FAILED", 500);
  }
}
