import { NextResponse } from "next/server";
import { submitOnboardingFeedback } from "@/lib/data/onboarding";
import { guardMutationRequest } from "@/lib/security/request";
import { onboardingFeedbackInputSchema } from "@/lib/validators/onboarding";
import {
  onboardingApiError,
  onboardingJsonError,
  readJsonBody,
} from "../_utils";

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "onboarding-feedback",
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const parsed = onboardingFeedbackInputSchema.safeParse(await readJsonBody(request));

  if (!parsed.success) {
    return onboardingJsonError("Góp ý onboarding chưa hợp lệ.", 400, "INVALID_PAYLOAD");
  }

  try {
    const feedback = await submitOnboardingFeedback(parsed.data);

    return NextResponse.json({ data: feedback, success: true });
  } catch (error) {
    return onboardingApiError(error, "Không thể gửi góp ý onboarding.");
  }
}
