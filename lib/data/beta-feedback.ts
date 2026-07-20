import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { isMissingSupabaseSchema } from "@/lib/supabase/schema-error";
import type { BetaFeedbackInput } from "@/lib/validators/beta-feedback";

export type BetaFeedbackRecord = {
  content: string;
  created_at: string | null;
  feedback_type: string;
  id: string;
  rating: number | null;
  status: string | null;
  title: string | null;
};

function cleanOptionalText(value?: string | number | null) {
  if (typeof value !== "string") {
    return null;
  }

  const clean = value.trim();
  return clean || null;
}

export async function createBetaFeedback(input: BetaFeedbackInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("beta_feedback")
    .insert({
      browser_info: cleanOptionalText(input.browserInfo),
      content: input.content.trim(),
      device_type: cleanOptionalText(input.deviceType),
      feedback_type: input.feedbackType,
      page_path: cleanOptionalText(input.pagePath),
      rating: typeof input.rating === "number" ? input.rating : null,
      title: cleanOptionalText(input.title),
      user_id: userId,
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingSupabaseSchema(error, ["beta_feedback"])) {
      throw new Error("Bảng beta_feedback chưa được tạo trong Supabase.");
    }

    throw new Error(error.message);
  }

  await trackUserActivity("feedback_submitted");

  return data.id as string;
}

export async function getMyBetaFeedback() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("beta_feedback")
    .select("id,feedback_type,rating,title,content,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    if (isMissingSupabaseSchema(error, ["beta_feedback"])) {
      return [] as BetaFeedbackRecord[];
    }

    throw new Error(error.message);
  }

  return (data ?? []) as BetaFeedbackRecord[];
}
