import { NextResponse } from "next/server";
import { PRICING_PLANS } from "@/lib/constants/plans";
import {
  FEATURE_FLAG_DISABLED_MESSAGE,
  isFeatureEnabled,
} from "@/lib/data/feature-flags";
import {
  createUpgradeInterest,
  UpgradeInterestAuthError,
} from "@/lib/data/upgrade-interest";
import { enforceSameOrigin, rateLimit } from "@/lib/security/request";
import { upgradeInterestSchema } from "@/lib/validators/upgrade-interest";

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);

  if (originError) {
    return originError;
  }

  const rateLimitError = rateLimit(request, {
    key: "upgrade-interest",
    limit: 10,
    message: "Bạn đã gửi quan tâm nâng cấp nhiều lần. Vui lòng chờ một lát rồi thử lại.",
    windowMs: 10 * 60 * 1000,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  if (!(await isFeatureEnabled("upgrade_interest"))) {
    return errorResponse("FEATURE_DISABLED", FEATURE_FLAG_DISABLED_MESSAGE, 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = upgradeInterestSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Vui lòng kiểm tra lại thông tin quan tâm nâng cấp.",
    );
  }

  const plan = PRICING_PLANS.find((item) => item.key === parsed.data.planKey);

  if (!plan || plan.key === "free_beta") {
    return errorResponse("INVALID_PLAN", "Gói nâng cấp chưa hợp lệ.");
  }

  try {
    const data = await createUpgradeInterest({
      ...parsed.data,
      planName: plan.name,
    });

    return NextResponse.json({
      data,
      success: true,
    });
  } catch (error) {
    if (error instanceof UpgradeInterestAuthError) {
      return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để gửi quan tâm nâng cấp.", 401);
    }

    return errorResponse(
      "UPGRADE_INTEREST_FAILED",
      "Không thể ghi nhận quan tâm nâng cấp lúc này. Vui lòng thử lại.",
      500,
    );
  }
}
