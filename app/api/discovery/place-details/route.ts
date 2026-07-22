import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getPlaceDetails } from "@/lib/providers/maps/google-maps";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { placeDetailsSchema } from "@/lib/validators/discovery";
import { getMapProviderApiError } from "../map-provider-errors";

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    { error: { code, message }, success: false },
    { status },
  );
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "discovery-place-details",
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để xem địa điểm.", 401);
  }

  if (!(await isFeatureEnabled("map_discovery", user.id))) {
    return errorResponse("FEATURE_DISABLED", "Tính năng tìm khách hiện chưa được bật.", 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = placeDetailsSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", "Địa điểm chưa hợp lệ.");
  }

  try {
    const details = await getPlaceDetails(parsed.data.placeId);

    return NextResponse.json({ data: details, success: true });
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String((error as Error & { code?: string }).code)
        : "MAP_PROVIDER_ERROR";
    const providerError = getMapProviderApiError(code, {
      fallback: "Không thể tải thông tin liên hệ của địa điểm. Vui lòng thử lại.",
      quotaExceeded: "Google Maps đang giới hạn số lượt xem. Vui lòng thử lại sau.",
    });

    return errorResponse(code, providerError.message, providerError.status);
  }
}
