import { NextResponse } from "next/server";
import {
  AIFeatureDisabledError,
  AIResourceNotFoundError,
  generateAIContent,
} from "@/lib/data/ai";
import { QuotaExceededError } from "@/lib/data/usage";
import { AIConfigError } from "@/lib/providers/ai/default-provider";
import { enforceSameOrigin, rateLimit } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { aiGenerateSchema } from "@/lib/validators/ai";

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
    key: "ai-generate",
    limit: 20,
    message: "Bạn đang gửi yêu cầu AI hơi nhanh. Vui lòng chờ một lát rồi thử lại.",
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
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để dùng trợ lý AI.", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = aiGenerateSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Yêu cầu AI chưa hợp lệ.");
  }

  try {
    const result = await generateAIContent({
      request: parsed.data,
      userId: user.id,
    });

    return NextResponse.json({
      data: {
        aiRequestId: result.aiRequestId,
        outputType: result.outputType,
        quota: result.quota,
        requestType: parsed.data.requestType,
        text: result.text,
      },
      success: true,
    });
  } catch (error) {
    if (error instanceof AIConfigError) {
      return errorResponse(
        "AI_NOT_CONFIGURED",
        "Chưa cấu hình AI. Vui lòng thêm AI_API_KEY hoặc thử lại sau.",
        503,
      );
    }

    if (error instanceof QuotaExceededError) {
      return errorResponse(
        "AI_QUOTA_EXCEEDED",
        "Bạn đã dùng hết lượt AI hôm nay. Hãy quay lại vào ngày mai hoặc nâng cấp gói.",
        429,
      );
    }

    if (error instanceof AIFeatureDisabledError) {
      return errorResponse(
        "AI_FEATURE_DISABLED",
        "Trợ lý AI đang được mở dần.",
        403,
      );
    }

    if (error instanceof AIResourceNotFoundError) {
      return errorResponse("AI_RESOURCE_NOT_FOUND", error.message, 404);
    }

    return errorResponse(
      "AI_GENERATE_FAILED",
      "Không thể tạo nội dung AI lúc này. Vui lòng thử lại sau.",
      500,
    );
  }
}
