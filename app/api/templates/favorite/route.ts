import { NextResponse } from "next/server";
import { z } from "zod";
import { toggleTemplateFavorite } from "@/lib/data/templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const favoriteSchema = z.object({
  templateId: z.string().uuid(),
});

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

  const payload = await request.json().catch(() => null);
  const parsed = favoriteSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Template chưa hợp lệ.");
  }

  try {
    const result = await toggleTemplateFavorite(parsed.data.templateId);

    return NextResponse.json({
      data: result,
      success: true,
    });
  } catch {
    return errorResponse(
      "FAVORITE_FAILED",
      "Không thể cập nhật yêu thích lúc này. Vui lòng thử lại sau.",
      500,
    );
  }
}
