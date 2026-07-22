import { NextResponse } from "next/server";
import { SafeError } from "@/lib/security/safe-error";

export function onboardingJsonError(
  message: string,
  status = 400,
  code = "ONBOARDING_ERROR",
) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

export function onboardingApiError(
  error: unknown,
  fallback = "Không thể xử lý onboarding lúc này. Vui lòng thử lại.",
) {
  if (error instanceof SafeError) {
    return onboardingJsonError(error.message, error.status, error.code);
  }

  return onboardingJsonError(fallback, 500, "ONBOARDING_SERVER_ERROR");
}

export async function readJsonBody(request: Request) {
  return request.json().catch(() => null);
}
