import { NextResponse } from "next/server";
import {
  createPaymentRequestForUser,
  getPaymentBankInfo,
  getPaymentRequestsForUser,
} from "@/lib/data/payment-requests";
import { enforceSameOrigin, rateLimit } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPaymentRequestSchema } from "@/lib/validators/payment-request";

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
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để xem yêu cầu thanh toán.", 401);
  }

  const items = await getPaymentRequestsForUser(userId);

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
    key: "payment-request",
    limit: 8,
    message: "Bạn đã tạo nhiều yêu cầu thanh toán. Vui lòng chờ một lát rồi thử lại.",
    windowMs: 10 * 60 * 1000,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  const userId = await getUserId();

  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để tạo yêu cầu thanh toán.", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = createPaymentRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Vui lòng chọn gói Pro hoặc Pro Plus.");
  }

  try {
    const paymentRequest = await createPaymentRequestForUser(userId, {
      months: parsed.data.months,
      planKey: parsed.data.planKey,
      requestType: parsed.data.requestType,
      userNote: parsed.data.userNote || "",
    });
    const bank = getPaymentBankInfo(paymentRequest);

    return NextResponse.json({
      data: {
        amountVnd: paymentRequest.amount_vnd,
        bank,
        id: paymentRequest.id,
        months: paymentRequest.months ?? 1,
        planKey: paymentRequest.plan_key,
        planName: paymentRequest.plan_name,
        requestType: paymentRequest.request_type || "new_subscription",
        status: paymentRequest.status,
      },
      success: true,
    });
  } catch {
    return errorResponse(
      "PAYMENT_REQUEST_CREATE_FAILED",
      "Không thể tạo yêu cầu nâng cấp lúc này. Vui lòng thử lại.",
      500,
    );
  }
}
