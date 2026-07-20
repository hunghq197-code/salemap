import { NextResponse } from "next/server";
import {
  getPaymentBankInfo,
  getPaymentRequestByIdForUser,
  updatePaymentRequestForUser,
} from "@/lib/data/payment-requests";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updatePaymentRequestSchema } from "@/lib/validators/payment-request";

type PaymentRequestRouteProps = {
  params: Promise<{
    id: string;
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

async function getUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function GET(_request: Request, props: PaymentRequestRouteProps) {
  const params = await props.params;
  const userId = await getUserId();

  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để xem yêu cầu thanh toán.", 401);
  }

  const paymentRequest = await getPaymentRequestByIdForUser(userId, params.id);

  if (!paymentRequest) {
    return errorResponse("NOT_FOUND", "Không tìm thấy yêu cầu thanh toán.", 404);
  }

  return NextResponse.json({
    data: {
      ...paymentRequest,
      bank: getPaymentBankInfo(paymentRequest),
    },
    success: true,
  });
}

export async function PATCH(request: Request, props: PaymentRequestRouteProps) {
  const params = await props.params;
  const userId = await getUserId();

  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để cập nhật yêu cầu thanh toán.", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = updatePaymentRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Thông tin thanh toán chưa hợp lệ.");
  }

  try {
    const paymentRequest = await updatePaymentRequestForUser(userId, params.id, {
      proofUrl: parsed.data.proofUrl || "",
      status: parsed.data.status,
      transactionReference: parsed.data.transactionReference || "",
      userNote: parsed.data.userNote || "",
    });

    return NextResponse.json({
      data: paymentRequest,
      success: true,
    });
  } catch {
    return errorResponse(
      "PAYMENT_REQUEST_UPDATE_FAILED",
      "Không thể cập nhật yêu cầu thanh toán lúc này.",
      500,
    );
  }
}
