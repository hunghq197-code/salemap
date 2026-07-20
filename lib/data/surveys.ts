import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { requireAdmin } from "@/lib/admin/auth";
import { BETA_ROUND_2_SURVEY_KEY } from "@/lib/constants/surveys";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isMissingSupabaseSchema } from "@/lib/supabase/schema-error";

export type BetaSurveyInput = {
  mostConfusingPart?: string;
  mostUsefulFeature: string;
  npsScore: number;
  openFeedback?: string;
  rating: number;
  willingnessToPay: string;
  wouldContinueUsing: string;
};

export type BetaSurveyState = {
  eligible: boolean;
  hasSubmitted: boolean;
  leadCount: number;
};

export async function getBetaRound2SurveyState(): Promise<BetaSurveyState> {
  try {
    const { supabase, userId } = await createAuthedSupabaseServerClient();
    const [leadResult, surveyResult] = await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("deleted_at", null),
      supabase
        .from("in_app_surveys")
        .select("id,submitted_at")
        .eq("user_id", userId)
        .eq("survey_key", BETA_ROUND_2_SURVEY_KEY)
        .maybeSingle(),
    ]);

    if (surveyResult.error) {
      return {
        eligible: false,
        hasSubmitted: false,
        leadCount: leadResult.count ?? 0,
      };
    }

    const hasSubmitted = Boolean(surveyResult.data?.submitted_at);
    const leadCount = leadResult.count ?? 0;

    return {
      eligible: leadCount > 0 && !hasSubmitted,
      hasSubmitted,
      leadCount,
    };
  } catch {
    return {
      eligible: false,
      hasSubmitted: false,
      leadCount: 0,
    };
  }
}

export async function submitBetaRound2Survey(input: BetaSurveyInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("in_app_surveys")
    .upsert(
      {
        most_confusing_part: input.mostConfusingPart?.slice(0, 1000) || null,
        most_useful_feature: input.mostUsefulFeature,
        nps_score: input.npsScore,
        open_feedback: input.openFeedback?.slice(0, 1500) || null,
        rating: input.rating,
        submitted_at: now,
        survey_key: BETA_ROUND_2_SURVEY_KEY,
        updated_at: now,
        user_id: userId,
        willingness_to_pay: input.willingnessToPay,
        would_continue_using: input.wouldContinueUsing,
      },
      { onConflict: "user_id,survey_key" },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMissingSupabaseSchema(error, ["in_app_surveys"])) {
      throw new Error("Bảng in_app_surveys chưa được tạo trong Supabase.");
    }

    throw new Error(error.message);
  }

  await trackUserActivity("feedback_submitted");

  return data?.id as string | undefined;
}

export async function getAdminSurveyResults() {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const [surveyResult, usersResult, profilesResult] = await Promise.all([
    supabase
      .from("in_app_surveys")
      .select("*")
      .eq("survey_key", BETA_ROUND_2_SURVEY_KEY)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(1000),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from("user_profiles").select("user_id,full_name").limit(10000),
  ]);

  if (isMissingSupabaseSchema(surveyResult.error, ["in_app_surveys"])) {
    return {
      kpis: {
        averageNps: 0,
        averageRating: 0,
        percentContinue: 0,
        percentPay: 0,
        submitted: 0,
        topConfusingPart: "Chưa có",
        topUsefulFeature: "Chưa có",
      },
      rows: [],
    };
  }

  const profileMap = new Map(
    ((profilesResult.data ?? []) as Array<{ full_name?: string | null; user_id: string }>).map(
      (profile) => [profile.user_id, profile.full_name ?? ""],
    ),
  );
  const emailMap = new Map(
    (usersResult.data?.users ?? []).map((user) => [user.id, user.email ?? ""]),
  );
  const rows = ((surveyResult.data ?? []) as Array<{
    id: string;
    most_confusing_part?: string | null;
    most_useful_feature?: string | null;
    nps_score?: number | null;
    open_feedback?: string | null;
    rating?: number | null;
    submitted_at?: string | null;
    user_id: string;
    willingness_to_pay?: string | null;
    would_continue_using?: string | null;
  }>).map((survey) => ({
    ...survey,
    userLabel: profileMap.get(survey.user_id) || emailMap.get(survey.user_id) || survey.user_id,
  }));
  const submitted = rows.length;
  const averageRating =
    submitted > 0
      ? Math.round(
          (rows.reduce((total, row) => total + Number(row.rating ?? 0), 0) / submitted) *
            10,
        ) / 10
      : 0;
  const averageNps =
    submitted > 0
      ? Math.round(
          (rows.reduce((total, row) => total + Number(row.nps_score ?? 0), 0) /
            submitted) *
            10,
        ) / 10
      : 0;
  const percentContinue =
    submitted > 0
      ? Math.round(
          (rows.filter((row) => row.would_continue_using?.startsWith("Có")).length /
            submitted) *
            100,
        )
      : 0;
  const percentPay =
    submitted > 0
      ? Math.round(
          (rows.filter((row) => row.willingness_to_pay?.startsWith("Có")).length /
            submitted) *
            100,
        )
      : 0;
  const getTop = (key: "most_confusing_part" | "most_useful_feature") => {
    const counts = new Map<string, number>();

    rows.forEach((row) => {
      const value = String(row[key] || "").trim();

      if (value) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    });

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "Chưa có";
  };

  return {
    kpis: {
      averageNps,
      averageRating,
      percentContinue,
      percentPay,
      submitted,
      topConfusingPart: getTop("most_confusing_part").slice(0, 80),
      topUsefulFeature: getTop("most_useful_feature"),
    },
    rows,
  };
}
