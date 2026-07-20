import { NextResponse } from "next/server";
import { AIResourceNotFoundError, saveAIOutput } from "@/lib/data/ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { aiSaveOutputSchema } from "@/lib/validators/ai";

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
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để lưu nội dung AI.", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = aiSaveOutputSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Nội dung AI cần lưu chưa hợp lệ.");
  }

  try {
    const id = await saveAIOutput({
      payload: parsed.data,
      userId: user.id,
    });

    return NextResponse.json({
      data: { id },
      success: true,
    });
  } catch (error) {
    if (error instanceof AIResourceNotFoundError) {
      return errorResponse("AI_RESOURCE_NOT_FOUND", error.message, 404);
    }

    return errorResponse(
      "AI_SAVE_OUTPUT_FAILED",
      "Không thể lưu nội dung AI lúc này.",
      500,
    );
  }
}
