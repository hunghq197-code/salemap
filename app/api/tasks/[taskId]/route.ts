import { NextResponse } from "next/server";
import { getTaskById, reopenTask } from "@/lib/data/tasks";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

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

export async function GET(_request: Request, props: RouteContext) {
  const params = await props.params;
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  try {
    const task = await getTaskById(params.taskId);
    return NextResponse.json({ data: task, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "TASK_NOT_FOUND", 404);
  }
}

export async function PATCH(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "task-reopen",
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
    const task = await reopenTask(params.taskId);
    return NextResponse.json({ data: task, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể mở lại task.",
      500,
    );
  }
}
