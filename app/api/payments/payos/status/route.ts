import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getPaymentGatewayTransactionByOrderCodeForCurrentUser,
  syncPayOSGatewayTransaction,
} from "@/lib/data/payment-gateway-transactions";
import { PayOSConfigError } from "@/lib/providers/payments";
import { enforceSameOrigin, rateLimit } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusSchema = z.object({
  orderCode: z.coerce.number().int().positive(),
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
    key: "payos-status",
    limit: 20,
    message: "Bạn kiểm tra thanh toán hơi nhanh. Vui lòng chờ một lát rồi thử lại.",
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
      "Vui lòng đăng nhập để kiểm tra thanh toán.",
      401,
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Mã đơn hàng chưa hợp lệ.");
  }

  let syncWarning: string | null = null;

  try {
    const transaction = await syncPayOSGatewayTransaction({
      orderCode: parsed.data.orderCode,
      userId: user.id,
    });

    return NextResponse.json({
      data: { transaction },
      success: true,
    });
  } catch (error) {
    if (error instanceof PayOSConfigError) {
      syncWarning = "PAYOS_NOT_CONFIGURED";
    }
  }

  const transaction = await getPaymentGatewayTransactionByOrderCodeForCurrentUser(
    parsed.data.orderCode,
  );

  if (!transaction) {
    return errorResponse(
      "PAYMENT_GATEWAY_TRANSACTION_NOT_FOUND",
      "Không tìm thấy giao dịch thanh toán.",
      404,
    );
  }

  return NextResponse.json({
    data: {
      syncWarning,
      transaction,
    },
    success: true,
  });
}
