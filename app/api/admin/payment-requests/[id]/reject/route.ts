import { NextResponse } from "next/server";
import { guardMutationRequest } from "@/lib/security/request";
import { AdminAuthError } from "@/lib/admin/auth";
import { rejectPaymentRequest } from "@/lib/admin/data/payment-requests";
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
  const guardError = guardMutationRequest(request, {
    key: "admin-payment-request-reject",
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const params = await props.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = adminReviewPaymentRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Ghi chú admin chưa hợp lệ.");
  }

  try {
    await rejectPaymentRequest(params.id, parsed.data.adminNote || "");

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return errorResponse(error.message, "Bạn không có quyền thao tác.", error.status);
    }

    return errorResponse(
      "PAYMENT_REQUEST_REJECT_FAILED",
      "Không thể từ chối thanh toán lúc này.",
      500,
    );
  }
}
