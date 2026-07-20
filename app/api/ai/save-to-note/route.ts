import { NextResponse } from "next/server";
import { AIResourceNotFoundError, saveAIOutputToLeadNote } from "@/lib/data/ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { aiSaveToNoteSchema } from "@/lib/validators/ai";

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
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để lưu vào ghi chú.", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = aiSaveToNoteSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Nội dung ghi chú chưa hợp lệ.");
  }

  try {
    await saveAIOutputToLeadNote({
      payload: parsed.data,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    if (error instanceof AIResourceNotFoundError) {
      return errorResponse("AI_RESOURCE_NOT_FOUND", error.message, 404);
    }

    return errorResponse(
      "AI_SAVE_TO_NOTE_FAILED",
      "Không thể lưu nội dung AI vào ghi chú lúc này.",
      500,
    );
  }
}
