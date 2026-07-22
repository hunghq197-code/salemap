import { NextResponse } from "next/server";
import { getPaymentByIdForUser, toSafeBillingPayment } from "@/lib/billing/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BillingPaymentRouteProps = {
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

export async function GET(_request: Request, props: BillingPaymentRouteProps) {
  const params = await props.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "Bạn cần đăng nhập.", 401);
  }

  const payment = await getPaymentByIdForUser(params.paymentId, user.id);

  if (!payment) {
    return errorResponse("NOT_FOUND", "Không tìm thấy thanh toán.", 404);
  }

  return NextResponse.json({
    data: {
      payment: toSafeBillingPayment(payment),
    },
    success: true,
  });
}
