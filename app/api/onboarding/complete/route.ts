import { NextResponse } from "next/server";
import { completeOnboarding } from "@/lib/data/onboarding";
import { guardMutationRequest } from "@/lib/security/request";
import { onboardingApiError } from "../_utils";

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "onboarding-complete",
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  try {
    const profile = await completeOnboarding();

    return NextResponse.json({ data: profile, success: true });
  } catch (error) {
    return onboardingApiError(error, "Không thể hoàn tất onboarding.");
  }
}
