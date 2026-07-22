import { NextResponse } from "next/server";
import { snoozeTask } from "@/lib/data/tasks";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { snoozeTaskSchema } from "@/lib/validators/tasks";

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

export async function POST(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "task-snooze",
    limit: 80,
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

  const body = await request.json().catch(() => ({}));
  const parsed = snoozeTaskSchema.safeParse({
    ...(typeof body === "object" && body ? body : {}),
    taskId: params.taskId,
  });

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const task = await snoozeTask(parsed.data);
    return NextResponse.json({ data: task, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể dời lịch task.",
      500,
    );
  }
}
