import { NextResponse } from "next/server";
import { z } from "zod";
import { createPayOSCheckoutTransactionForUser } from "@/lib/data/payment-gateway-transactions";
import { PayOSConfigError } from "@/lib/providers/payments";
import { enforceSameOrigin, rateLimit } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createPayOSLinkSchema = z.object({
  months: z.coerce.number().int().min(1).max(12).optional(),
  planKey: z.enum(["pro", "pro_plus"]),
  requestType: z.enum(["new_subscription", "renewal", "plan_change"]).optional(),
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
  const originError = enforceSameOrigin(request);

  if (originError) {
    return originError;
  }

  const rateLimitError = rateLimit(request, {
    key: "payos-create-link",
    limit: 8,
    message: "Bạn đã tạo nhiều link thanh toán. Vui lòng chờ một lát rồi thử lại.",
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
    return errorResponse(
      "UNAUTHENTICATED",
      "Vui lòng đăng nhập để tạo link thanh toán.",
      401,
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = createPayOSLinkSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Vui lòng chọn gói Pro hoặc Pro Plus.");
  }

  try {
    const result = await createPayOSCheckoutTransactionForUser(user.id, {
      buyerEmail: user.email ?? undefined,
      buyerName:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : undefined,
      months: parsed.data.months,
      planKey: parsed.data.planKey,
      requestType: parsed.data.requestType,
    });

    return NextResponse.json({
      data: {
        checkoutUrl: result.checkoutUrl,
        orderCode: result.orderCode,
        paymentRequestId: result.paymentRequest.id,
        transactionId: result.transaction.id,
      },
      success: true,
    });
  } catch (error) {
    if (error instanceof PayOSConfigError) {
      return errorResponse(
        "PAYOS_NOT_CONFIGURED",
        "Chưa cấu hình cổng thanh toán. Vui lòng dùng chuyển khoản thủ công hoặc liên hệ hỗ trợ.",
        503,
      );
    }

    return errorResponse(
      "PAYMENT_LINK_CREATE_FAILED",
      "Không thể tạo link thanh toán lúc này. Vui lòng thử lại.",
      500,
    );
  }
}
