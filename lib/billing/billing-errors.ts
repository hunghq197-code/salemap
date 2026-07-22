import { NextResponse } from "next/server";

export type BillingErrorCode =
  | "BILLING_DISABLED"
  | "BILLING_NOT_CONFIGURED"
  | "FORBIDDEN"
  | "INVALID_PAYMENT_METHOD"
  | "INVALID_PLAN"
  | "NOT_FOUND"
  | "PAYMENT_ALREADY_FINAL"
  | "PAYMENT_CREATE_FAILED"
  | "UNAUTHENTICATED"
  | "VALIDATION_ERROR";

const MESSAGES: Record<BillingErrorCode, string> = {
  BILLING_DISABLED: "Thanh toán chưa được bật cho môi trường này.",
  BILLING_NOT_CONFIGURED: "Thanh toán chưa được cấu hình cho môi trường này.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  INVALID_PAYMENT_METHOD: "Vui lòng chọn phương thức thanh toán hợp lệ.",
  INVALID_PLAN: "Vui lòng chọn gói thanh toán hợp lệ.",
  NOT_FOUND: "Không tìm thấy thanh toán.",
  PAYMENT_ALREADY_FINAL: "Payment này đã được xử lý trước đó.",
  PAYMENT_CREATE_FAILED: "Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.",
  UNAUTHENTICATED: "Bạn cần đăng nhập.",
  VALIDATION_ERROR: "Dữ liệu thanh toán chưa hợp lệ.",
};

export class BillingError extends Error {
  code: BillingErrorCode;
  status: number;

  constructor(code: BillingErrorCode, status = 400, message = MESSAGES[code]) {
    super(message);
    this.code = code;
    this.name = "BillingError";
    this.status = status;
  }
}

export function billingErrorResponse(error: unknown) {
  if (error instanceof BillingError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
        success: false,
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "PAYMENT_CREATE_FAILED",
        message: MESSAGES.PAYMENT_CREATE_FAILED,
      },
      success: false,
    },
    { status: 500 },
  );
}
