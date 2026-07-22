import { NextResponse } from "next/server";
import {
  createDemoDataForUser,
  deleteDemoDataForUser,
} from "@/lib/data/onboarding";
import { guardMutationRequest } from "@/lib/security/request";
import { onboardingApiError } from "../_utils";

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "onboarding-demo-data-create",
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  try {
    const result = await createDemoDataForUser();

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    return onboardingApiError(error, "Không thể tạo dữ liệu mẫu.");
  }
}

export async function DELETE(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "onboarding-demo-data-delete",
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  try {
    const result = await deleteDemoDataForUser();

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    return onboardingApiError(error, "Không thể xóa dữ liệu mẫu.");
  }
}
