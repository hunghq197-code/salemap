import { NextResponse } from "next/server";
import { z } from "zod";
import { billingErrorResponse } from "@/lib/billing/billing-errors";
import { cancelPayment, toSafeBillingPayment } from "@/lib/billing/payments";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const cancelPaymentSchema = z.object({
  paymentId: z.string().uuid(),
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
  const guardError = guardMutationRequest(request, {
    key: "billing-cancel-payment",
    limit: 20,
    message: "Bạn thao tác hơi nhanh. Vui lòng thử lại sau.",
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "Bạn cần đăng nhập.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = cancelPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Thanh toán chưa hợp lệ.");
  }

  try {
    const payment = await cancelPayment({
      paymentId: parsed.data.paymentId,
      reason: "user_cancelled",
      userId: user.id,
    });

    return NextResponse.json({
      data: {
        payment: toSafeBillingPayment(payment),
      },
      success: true,
    });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
