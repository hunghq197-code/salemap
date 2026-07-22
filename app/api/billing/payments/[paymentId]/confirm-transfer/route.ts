import { NextResponse } from "next/server";
import { billingErrorResponse } from "@/lib/billing/billing-errors";
import {
  markPaymentWaitingConfirmation,
  toSafeBillingPayment,
} from "@/lib/billing/payments";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BillingPaymentConfirmRouteProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

export async function POST(request: Request, props: BillingPaymentConfirmRouteProps) {
  const guardError = guardMutationRequest(request, {
    key: "billing-confirm-transfer",
    limit: 20,
    message: "Bạn thao tác hơi nhanh. Vui lòng thử lại sau.",
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const params = await props.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "Bạn cần đăng nhập.", 401);
  }

  try {
    const payment = await markPaymentWaitingConfirmation(params.paymentId, user.id);

    return NextResponse.json({
      data: {
        message:
          "Chúng tôi đã ghi nhận bạn đã chuyển khoản. Gói sẽ được kích hoạt sau khi giao dịch được xác nhận.",
        payment: toSafeBillingPayment(payment),
      },
      success: true,
    });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
