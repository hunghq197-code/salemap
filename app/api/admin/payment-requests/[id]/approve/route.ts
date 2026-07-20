import { NextResponse } from "next/server";
import { AdminAuthError } from "@/lib/admin/auth";
import { approvePaymentRequest } from "@/lib/admin/data/payment-requests";
import { adminReviewPaymentRequestSchema } from "@/lib/validators/payment-request";

type AdminReviewRouteProps = {
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

export async function POST(request: Request, props: AdminReviewRouteProps) {
  const params = await props.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = adminReviewPaymentRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Ghi chú admin chưa hợp lệ.");
  }

  try {
    const subscription = await approvePaymentRequest(
      params.id,
      parsed.data.adminNote || "",
    );

    return NextResponse.json({
      data: { subscription },
      success: true,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return errorResponse(error.message, "Bạn không có quyền thao tác.", error.status);
    }

    return errorResponse(
      "PAYMENT_REQUEST_APPROVE_FAILED",
      "Không thể xác nhận thanh toán lúc này.",
      500,
    );
  }
}
