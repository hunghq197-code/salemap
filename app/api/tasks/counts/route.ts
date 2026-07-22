import { NextResponse } from "next/server";
import { getTaskCounts } from "@/lib/data/tasks";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  try {
    const counts = await getTaskCounts();
    return NextResponse.json({ data: counts, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể tải tổng quan task.",
      500,
    );
  }
}
