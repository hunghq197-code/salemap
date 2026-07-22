import { NextResponse } from "next/server";
import { createTask, getLeadsWithoutTasks, getTasksForUser } from "@/lib/data/tasks";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTaskSchema, getTasksQuerySchema } from "@/lib/validators/tasks";

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

  const searchParams = new URL(request.url).searchParams;
  const parsed = getTasksQuerySchema.safeParse({
    limit: searchParams.get("limit") || undefined,
    page: searchParams.get("page") || undefined,
    priority: searchParams.get("priority") || undefined,
    status: searchParams.get("status") || undefined,
    tab: searchParams.get("tab") || "today",
    taskType: searchParams.get("taskType") || undefined,
  });

  if (!parsed.success) {
    return jsonError("INVALID_QUERY");
  }

  try {
    if (parsed.data.tab === "no_schedule") {
      const leads = await getLeadsWithoutTasks(parsed.data.limit);
      return NextResponse.json({ data: { items: leads }, success: true });
    }

    const result = await getTasksForUser(parsed.data);
    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể tải việc cần làm.",
      500,
    );
  }
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "task-create",
    limit: 80,
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
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const task = await createTask(parsed.data);
    return NextResponse.json({ data: task, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể tạo task.",
      500,
    );
  }
}
