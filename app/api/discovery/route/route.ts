import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { safeMarkChecklistItemCompleted } from "@/lib/data/beta-checklist";
import {
  FEATURE_FLAG_DISABLED_MESSAGE,
  isFeatureEnabled,
} from "@/lib/data/feature-flags";
import { checkDailyQuota, consumeDailyQuota } from "@/lib/data/usage";
import { searchPlacesAlongRoute } from "@/lib/providers/maps/google-maps";
import { routeSearchSchema } from "@/lib/validators/discovery";
import type { DiscoveryPlaceResult } from "@/lib/providers/maps/types";

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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để tìm khách.", 401);
  }

  if (!(await isFeatureEnabled("route_search", user.id))) {
    return errorResponse("FEATURE_DISABLED", FEATURE_FLAG_DISABLED_MESSAGE, 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = routeSearchSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", "Thông tin tuyến đường chưa hợp lệ.");
  }

  const quotaCheck = await checkDailyQuota("route_search");

  if (!quotaCheck.allowed) {
    return errorResponse(
      "QUOTA_EXCEEDED",
      "Bạn đã dùng hết lượt tìm tuyến hôm nay. Vui lòng quay lại vào ngày mai.",
      429,
    );
  }

  try {
    const { results, route } = await searchPlacesAlongRoute(parsed.data);
    const savedPlaces = await getSavedPlaces(
      user.id,
      results.map((result) => result.placeId),
    );

    const { data: insertedRoute, error: routeError } = await supabase
      .from("routes")
      .insert({
        buffer_meters: parsed.data.bufferMeters,
        destination_lat: route.destination.latitude ?? null,
        destination_lng: route.destination.longitude ?? null,
        destination_text: route.destination.text || parsed.data.destinationText,
        distance_meters: route.distanceMeters ?? null,
        duration_seconds: route.durationSeconds ?? null,
        origin_lat: route.origin.latitude ?? null,
        origin_lng: route.origin.longitude ?? null,
        origin_text: route.origin.text || parsed.data.originText,
        route_polyline: route.polyline || null,
        search_keyword: parsed.data.keyword,
        user_id: user.id,
      })
      .select("id")
      .single();

    const routeId = routeError ? undefined : insertedRoute?.id;
    const stopRows = routeId
      ? results.map((result, index) => {
          const savedLeadId = savedPlaces.get(result.placeId);

          return {
            address: result.address || null,
            category: result.category || null,
            distance_from_origin_meters: result.distanceFromOriginMeters ?? null,
            distance_from_route_meters: result.distanceFromRouteMeters ?? null,
            google_maps_url: result.googleMapsUrl || null,
            is_saved_as_lead: Boolean(savedLeadId),
            latitude: result.latitude ?? null,
            lead_id: savedLeadId || null,
            longitude: result.longitude ?? null,
            name: result.name,
            order_index: result.orderIndex ?? index,
            phone: result.phone || null,
            place_id: result.placeId,
            rating: result.rating ?? null,
            raw_place_data: result.raw || null,
            route_id: routeId,
            user_id: user.id,
            user_ratings_total: result.userRatingsTotal ?? null,
            website: result.website || null,
          };
        })
      : [];

    const { data: insertedStops } =
      stopRows.length > 0
        ? await supabase
            .from("route_stops")
            .insert(stopRows)
            .select("id,place_id")
        : { data: [] };

    const usage = await consumeDailyQuota("route_search");
    await safeMarkChecklistItemCompleted("search_route");
    await trackUserActivity("route_search_completed");

    const stopIdsByPlaceId = new Map(
      (insertedStops ?? []).map((stop) => [stop.place_id as string, stop.id as string]),
    );
    const decoratedResults: DiscoveryPlaceResult[] = results.map((result) => {
      const savedLeadId = savedPlaces.get(result.placeId);

      return {
        ...result,
        isSaved: Boolean(savedLeadId),
        routeStopId: stopIdsByPlaceId.get(result.placeId),
        savedLeadId,
      };
    });

    return NextResponse.json({
      data: {
        quota: usage,
        results: decoratedResults,
        route: {
          destinationText: route.destination.text || parsed.data.destinationText,
          distanceMeters: route.distanceMeters,
          durationSeconds: route.durationSeconds,
          id: routeId,
          originText: route.origin.text || parsed.data.originText,
          polyline: route.polyline,
        },
      },
      success: true,
    });
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String((error as Error & { code?: string }).code)
        : "MAP_PROVIDER_ERROR";

    return errorResponse(
      code,
      code === "QUOTA_EXCEEDED"
        ? "Bạn đã dùng hết lượt tìm tuyến hôm nay. Vui lòng quay lại vào ngày mai."
        : "Không thể tìm dữ liệu tuyến đường lúc này. Vui lòng thử lại sau.",
      code === "QUOTA_EXCEEDED" ? 429 : 502,
    );
  }
}
