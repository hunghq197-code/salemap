import { NextResponse } from "next/server";
import { createTask, getLeadTasks } from "@/lib/data/tasks";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTaskSchema } from "@/lib/validators/tasks";

type RouteContext = {
  params: Promise<{
    leadId: string;
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
    const tasks = await getLeadTasks(params.leadId);
    return NextResponse.json({ data: { items: tasks }, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể tải task của lead.",
      500,
    );
  }
}

export async function POST(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "lead-task-create",
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
  const parsed = createTaskSchema.safeParse({
    ...(typeof body === "object" && body ? body : {}),
    leadId: params.leadId,
  });

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const task = await createTask(parsed.data);
    return NextResponse.json({ data: task, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể tạo task cho lead.",
      500,
    );
  }
}
