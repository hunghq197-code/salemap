import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { guardMutationRequest } from "@/lib/security/request";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { safeMarkActivationStepForUser } from "@/lib/data/onboarding";
import { safeMarkChecklistItemCompleted } from "@/lib/data/beta-checklist";
import { checkDailyQuota, consumeDailyQuota } from "@/lib/data/usage";
import { savePlaceSchema } from "@/lib/validators/discovery";

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

function getOpeningHours(rawPlaceData: unknown) {
  if (
    rawPlaceData &&
    typeof rawPlaceData === "object" &&
    "opening_hours" in rawPlaceData
  ) {
    return (rawPlaceData as { opening_hours?: unknown }).opening_hours ?? null;
  }

  return null;
}

async function markRouteStopSaved(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  routeStopId: string | undefined,
  leadId: string,
) {
  if (!routeStopId) {
    return;
  }

  await supabase
    .from("route_stops")
    .update({
      is_saved_as_lead: true,
      lead_id: leadId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", routeStopId)
    .eq("user_id", userId);
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "discovery-save-place",
    limit: 60,
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
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để lưu lead.", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = savePlaceSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", "Thông tin địa điểm chưa hợp lệ.");
  }

  const input = parsed.data;
  const quotaCheck = await checkDailyQuota("save_map_lead");

  if (!quotaCheck.allowed) {
    return errorResponse(
      "QUOTA_EXCEEDED",
      "Bạn đã dùng hết lượt lưu lead từ bản đồ hôm nay. Vui lòng quay lại vào ngày mai.",
      429,
    );
  }

  const { data: existingLead, error: existingError } = await supabase
    .from("leads")
    .select("id")
    .eq("user_id", user.id)
    .eq("place_id", input.placeId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    return errorResponse("DATABASE_ERROR", "Không thể kiểm tra lead trùng. Vui lòng thử lại.", 500);
  }

  if (existingLead) {
    await markRouteStopSaved(supabase, user.id, input.routeStopId || undefined, existingLead.id);
    void safeMarkActivationStepForUser(supabase, user.id, "saved_first_lead");

    return NextResponse.json({
      data: {
        alreadySaved: true,
        leadId: existingLead.id,
      },
      success: true,
    });
  }

  try {
    const { data: insertedLead, error } = await supabase
      .from("leads")
      .insert({
        address: input.address || null,
        category: input.category || null,
        external_source: "google_maps",
        google_maps_url: input.googleMapsUrl || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        name: input.name,
        opening_hours: getOpeningHours(input.rawPlaceData),
        phone: input.phone || null,
        place_id: input.placeId,
        priority: "medium",
        rating: input.rating ?? null,
        raw_place_data: input.rawPlaceData || null,
        source: input.source,
        status: "new",
        user_id: user.id,
        user_ratings_total: input.userRatingsTotal ?? null,
        website: input.website || null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: duplicateLead } = await supabase
          .from("leads")
          .select("id")
          .eq("user_id", user.id)
          .eq("place_id", input.placeId)
          .is("deleted_at", null)
          .maybeSingle();

        if (duplicateLead) {
          await markRouteStopSaved(
            supabase,
            user.id,
            input.routeStopId || undefined,
            duplicateLead.id,
          );

          return NextResponse.json({
            data: {
              alreadySaved: true,
              leadId: duplicateLead.id,
            },
            success: true,
          });
        }
      }

      throw new Error(error.message);
    }

    await consumeDailyQuota("save_map_lead");
    await safeMarkChecklistItemCompleted("create_first_lead");
    await trackUserActivity("lead_created");
    await trackUserActivity("map_place_saved");
    void safeMarkActivationStepForUser(supabase, user.id, "saved_first_lead");
    await markRouteStopSaved(supabase, user.id, input.routeStopId || undefined, insertedLead.id);

    return NextResponse.json({
      data: {
        alreadySaved: false,
        leadId: insertedLead.id,
      },
      success: true,
    });
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String((error as Error & { code?: string }).code)
        : "DATABASE_ERROR";

    return errorResponse(
      code,
      code === "QUOTA_EXCEEDED"
        ? "Bạn đã dùng hết lượt lưu lead từ bản đồ hôm nay. Vui lòng quay lại vào ngày mai."
        : "Không thể lưu địa điểm này. Vui lòng thử lại.",
      code === "QUOTA_EXCEEDED" ? 429 : 500,
    );
  }
}
