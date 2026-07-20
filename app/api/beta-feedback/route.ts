import { NextResponse } from "next/server";
import { createBetaFeedback } from "@/lib/data/beta-feedback";
import { safeMarkChecklistItemCompleted } from "@/lib/data/beta-checklist";
import { enforceSameOrigin, rateLimit } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { betaFeedbackSchema } from "@/lib/validators/beta-feedback";

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
  const originError = enforceSameOrigin(request);

  if (originError) {
    return originError;
  }

  const rateLimitError = rateLimit(request, {
    key: "feedback",
    limit: 10,
    message: "Bạn đã gửi góp ý nhiều lần. Vui lòng chờ một lát rồi thử lại.",
    windowMs: 10 * 60 * 1000,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để gửi góp ý.", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = betaFeedbackSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Vui lòng kiểm tra lại nội dung góp ý.",
      400,
    );
  }

  try {
    const id = await createBetaFeedback(parsed.data);
    await safeMarkChecklistItemCompleted("send_feedback");

    return NextResponse.json({
      data: { id },
      success: true,
    });
  } catch {
    return errorResponse(
      "DATABASE_ERROR",
      "Không thể gửi góp ý lúc này. Vui lòng thử lại sau.",
      500,
    );
  }
}
