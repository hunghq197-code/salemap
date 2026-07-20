import { NextResponse } from "next/server";
import { isBetaChecklistKey } from "@/lib/constants/beta-checklist";
import { markChecklistItemCompleted } from "@/lib/data/beta-checklist";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập.", 401);
  }

  const payload = (await request.json().catch(() => null)) as { checklistKey?: string } | null;
  const checklistKey = payload?.checklistKey;

  if (!checklistKey || !isBetaChecklistKey(checklistKey)) {
    return errorResponse("INVALID_CHECKLIST_KEY", "Checklist key chưa hợp lệ.");
  }

  try {
    await markChecklistItemCompleted(checklistKey);

    return NextResponse.json({
      data: { checklistKey },
      success: true,
    });
  } catch {
    return errorResponse("DATABASE_ERROR", "Không thể cập nhật checklist.", 500);
  }
}
