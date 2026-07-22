import { NextResponse } from "next/server";

export type SafeErrorCode =
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "UNKNOWN_ERROR"
  | "VALIDATION_ERROR";

const SAFE_MESSAGES: Record<SafeErrorCode, string> = {
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  NOT_FOUND: "Không tìm thấy dữ liệu.",
  RATE_LIMITED: "Thao tác quá nhanh. Vui lòng thử lại sau.",
  UNAUTHORIZED: "Bạn cần đăng nhập.",
  UNKNOWN_ERROR: "Có lỗi xảy ra. Vui lòng thử lại.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ.",
};

export class SafeError extends Error {
  code: SafeErrorCode;
  status: number;

  constructor(code: SafeErrorCode, status: number, message = SAFE_MESSAGES[code]) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function toSafeError(error: unknown) {
  if (error instanceof SafeError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
    };
  }

  if (
    error instanceof Error &&
    ["FORBIDDEN", "NOT_FOUND", "RATE_LIMITED", "UNAUTHORIZED", "VALIDATION_ERROR"].includes(
      error.message,
    )
  ) {
    const code = error.message as SafeErrorCode;

    return {
      code,
      message: SAFE_MESSAGES[code],
      status: code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 400,
    };
  }

  return {
    code: "UNKNOWN_ERROR" as const,
    message:
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : SAFE_MESSAGES.UNKNOWN_ERROR,
    status: 500,
  };
}

export function adminApiError(error: unknown) {
  const safe = toSafeError(error);

  return NextResponse.json(
    {
      error: {
        code: safe.code,
        message: safe.message,
      },
      success: false,
    },
    { status: safe.status },
  );
}

export function userApiError(error: unknown) {
  const safe = toSafeError(error);

  return NextResponse.json(
    {
      error: {
        code: safe.code,
        message: safe.message,
      },
      success: false,
    },
    { status: safe.status },
  );
}
