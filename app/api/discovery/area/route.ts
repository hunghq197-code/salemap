import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { guardMutationRequest } from "@/lib/security/request";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { safeMarkActivationStepForUser } from "@/lib/data/onboarding";
import { safeMarkChecklistItemCompleted } from "@/lib/data/beta-checklist";
import {
  FEATURE_FLAG_DISABLED_MESSAGE,
  isFeatureEnabled,
} from "@/lib/data/feature-flags";
import { checkDailyQuota, consumeDailyQuota } from "@/lib/data/usage";
import {
  searchAreaPlaces,
  searchNearbyPlaces,
} from "@/lib/providers/maps/google-maps";
import { toPublicDiscoveryPlaceResults } from "@/lib/providers/maps/public-results";
import { areaSearchSchema } from "@/lib/validators/discovery";
import type { DiscoveryPlaceResult } from "@/lib/providers/maps/types";
import { getMapProviderApiError } from "../map-provider-errors";

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

async function getSavedPlaces(userId: string, placeIds: string[]) {
  if (placeIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id,place_id")
    .eq("user_id", userId)
    .in("place_id", placeIds)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((lead) => [lead.place_id as string, lead.id as string]));
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "discovery-area-search",
    limit: 30,
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
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để tìm khách.", 401);
  }

  if (!(await isFeatureEnabled("map_discovery", user.id))) {
    return errorResponse("FEATURE_DISABLED", FEATURE_FLAG_DISABLED_MESSAGE, 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = areaSearchSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", "Thông tin tìm kiếm chưa hợp lệ.");
  }

  const quotaCheck = await checkDailyQuota("area_search");

  if (!quotaCheck.allowed) {
    return errorResponse(
      "QUOTA_EXCEEDED",
      "Bạn đã dùng hết lượt tìm hôm nay. Vui lòng quay lại vào ngày mai hoặc nâng cấp khi gói Pro được mở.",
      429,
    );
  }

  try {
    const searchResult = parsed.data.center
      ? {
          center: parsed.data.center,
          results: await searchNearbyPlaces({
            keyword: parsed.data.keyword,
            latitude: parsed.data.center.latitude,
            longitude: parsed.data.center.longitude,
            radiusMeters: parsed.data.radiusMeters,
          }),
        }
      : await searchAreaPlaces({
          areaText: parsed.data.areaText || "",
          keyword: parsed.data.keyword,
          radiusMeters: parsed.data.radiusMeters,
        });
    const { center, results } = searchResult;
    const usage = await consumeDailyQuota("area_search");
    await safeMarkChecklistItemCompleted("search_area");
    const savedPlaces = await getSavedPlaces(
      user.id,
      results.map((result) => result.placeId),
    );

    await supabase.from("map_searches").insert({
      area_text: parsed.data.areaText || null,
      center_lat: center.latitude,
      center_lng: center.longitude,
      keyword: parsed.data.keyword,
      radius_meters: parsed.data.radiusMeters,
      result_count: results.length,
      search_type: "area_search",
      user_id: user.id,
    });
    await trackUserActivity("area_search_completed");
    void safeMarkActivationStepForUser(supabase, user.id, "searched_map");

    const decoratedResults: DiscoveryPlaceResult[] = results.map((result) => {
      const savedLeadId = savedPlaces.get(result.placeId);

      return {
        ...result,
        isSaved: Boolean(savedLeadId),
        savedLeadId,
      };
    });

    return NextResponse.json({
      data: {
        center,
        quota: usage,
        results: toPublicDiscoveryPlaceResults(decoratedResults),
      },
      success: true,
    });
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String((error as Error & { code?: string }).code)
        : "MAP_PROVIDER_ERROR";

    const providerError = getMapProviderApiError(code, {
      fallback: "Không thể tìm dữ liệu bản đồ lúc này. Vui lòng thử lại sau.",
      quotaExceeded:
        "Bạn đã dùng hết lượt tìm hôm nay. Vui lòng quay lại vào ngày mai hoặc nâng cấp khi gói Pro được mở.",
    });

    return errorResponse(code, providerError.message, providerError.status);
  }
}
