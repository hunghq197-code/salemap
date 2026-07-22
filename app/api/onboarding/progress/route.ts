import { NextResponse } from "next/server";
import { getActivationProgressWithChecklist } from "@/lib/data/onboarding";
import { onboardingApiError } from "../_utils";

export async function GET() {
  try {
    const progress = await getActivationProgressWithChecklist();

    return NextResponse.json({ data: progress, success: true });
  } catch (error) {
    return onboardingApiError(error, "Không thể tải tiến độ khởi động.");
  }
}
