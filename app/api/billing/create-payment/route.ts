import { NextResponse } from "next/server";
import { z } from "zod";
import { billingErrorResponse } from "@/lib/billing/billing-errors";
import { createPayment, toSafeBillingPayment } from "@/lib/billing/payments";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createPaymentSchema = z.object({
  billingPeriod: z.enum(["monthly"]).optional(),
  planId: z.enum(["pro", "pro_plus"]),
  provider: z.enum(["manual_bank_transfer", "vietqr_manual", "payos"]).optional(),
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
    key: "billing-create-payment",
    limit: 8,
    message: "Bạn đã tạo nhiều yêu cầu thanh toán. Vui lòng chờ một lát rồi thử lại.",
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
  const parsed = createPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Vui lòng chọn gói và phương thức thanh toán hợp lệ.",
    );
  }

  try {
    const payment = await createPayment({
      billingPeriod: parsed.data.billingPeriod || "monthly",
      planId: parsed.data.planId,
      provider: parsed.data.provider,
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
