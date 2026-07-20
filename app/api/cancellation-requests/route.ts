import { NextResponse } from "next/server";
import { getCancellationRequestsForUser } from "@/lib/data/cancellation-requests";
import { requestSubscriptionCancellation } from "@/lib/data/subscriptions";
import { enforceSameOrigin, rateLimit } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cancellationRequestSchema } from "@/lib/validators/cancellation-request";

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

async function getUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();

  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để xem phản hồi hủy gói.", 401);
  }

  const items = await getCancellationRequestsForUser(userId);

  return NextResponse.json({
    data: { items },
    success: true,
  });
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);

  if (originError) {
    return originError;
  }

  const rateLimitError = rateLimit(request, {
    key: "cancellation-request",
    limit: 6,
    message: "Bạn đã gửi phản hồi hủy gói nhiều lần. Vui lòng chờ một lát rồi thử lại.",
    windowMs: 10 * 60 * 1000,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  const userId = await getUserId();

  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để gửi phản hồi hủy gói.", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = cancellationRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Vui lòng chọn lý do chính.");
  }

  try {
    const cancellationRequest = await requestSubscriptionCancellation({
      reasonDetail: parsed.data.reasonDetail || "",
      reasonType: parsed.data.reasonType,
      wouldReturnIf: parsed.data.wouldReturnIf || "",
    });

    return NextResponse.json({
      data: cancellationRequest,
      success: true,
    });
  } catch {
    return errorResponse(
      "CANCELLATION_CREATE_FAILED",
      "Không thể ghi nhận phản hồi lúc này. Vui lòng thử lại.",
      500,
    );
  }
}
