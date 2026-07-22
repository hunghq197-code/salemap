import { NextResponse } from "next/server";
import { markActivationStep } from "@/lib/data/onboarding";
import { guardMutationRequest } from "@/lib/security/request";
import { activationMarkInputSchema } from "@/lib/validators/onboarding";
import {
  onboardingApiError,
  onboardingJsonError,
  readJsonBody,
} from "../../_utils";

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "onboarding-progress-mark",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const parsed = activationMarkInputSchema.safeParse(await readJsonBody(request));

  if (!parsed.success) {
    return onboardingJsonError("Bước activation chưa hợp lệ.", 400, "INVALID_PAYLOAD");
  }

  try {
    const progress = await markActivationStep(parsed.data.step);

    return NextResponse.json({ data: progress, success: true });
  } catch (error) {
    return onboardingApiError(error, "Không thể cập nhật tiến độ khởi động.");
  }
}
