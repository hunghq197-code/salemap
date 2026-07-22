import { NextResponse } from "next/server";
import { getLeadsWithoutTasks } from "@/lib/data/tasks";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const limit = Math.min(
    50,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 20),
  );

  try {
    const leads = await getLeadsWithoutTasks(limit);
    return NextResponse.json({ data: { items: leads }, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể tải lead chưa có lịch.",
      500,
    );
  }
}
