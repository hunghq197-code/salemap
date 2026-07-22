import { NextResponse } from "next/server";
import {
  getOnboardingProfile,
  upsertOnboardingProfile,
} from "@/lib/data/onboarding";
import { guardMutationRequest } from "@/lib/security/request";
import { onboardingProfileInputSchema } from "@/lib/validators/onboarding";
import {
  onboardingApiError,
  onboardingJsonError,
  readJsonBody,
} from "../_utils";

export async function GET() {
  try {
    const profile = await getOnboardingProfile();

    return NextResponse.json({ data: profile, success: true });
  } catch (error) {
    return onboardingApiError(error, "Không thể tải hồ sơ onboarding.");
  }
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "onboarding-profile",
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const parsed = onboardingProfileInputSchema.safeParse(await readJsonBody(request));

  if (!parsed.success) {
    return onboardingJsonError("Dữ liệu thiết lập ban đầu chưa hợp lệ.", 400, "INVALID_PAYLOAD");
  }

  try {
    const profile = await upsertOnboardingProfile(parsed.data);

    return NextResponse.json({ data: profile, success: true });
  } catch (error) {
    return onboardingApiError(error, "Không thể lưu hồ sơ onboarding.");
  }
}
