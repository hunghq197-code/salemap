import { NextResponse } from "next/server";
import { skipOnboarding } from "@/lib/data/onboarding";
import { guardMutationRequest } from "@/lib/security/request";
import { onboardingApiError } from "../_utils";

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "onboarding-skip",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  try {
    const profile = await skipOnboarding();

    return NextResponse.json({ data: profile, success: true });
  } catch (error) {
    return onboardingApiError(error, "Không thể bỏ qua onboarding.");
  }
}
