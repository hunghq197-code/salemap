import type { UpgradeInterestInput } from "@/lib/validators/upgrade-interest";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class UpgradeInterestAuthError extends Error {
  constructor() {
    super("User is not authenticated.");
    this.name = "UpgradeInterestAuthError";
  }
}

export class UpgradeInterestCreateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpgradeInterestCreateError";
  }
}

export async function createUpgradeInterest(input: UpgradeInterestInput) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new UpgradeInterestAuthError();
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role_type,industry")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("upgrade_interests")
    .insert({
      current_role_type: profile?.role_type || null,
      expected_price: input.expectedPrice || null,
      industry: profile?.industry || null,
      main_feature_interest: input.mainFeatureInterest || null,
      plan_key: input.planKey,
      plan_name: input.planName,
      reason: input.reason || null,
      source_page: input.sourcePage || "billing",
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    throw new UpgradeInterestCreateError(error.message);
  }

  await trackUserActivity("upgrade_interest_submitted");

  return {
    id: data.id as string,
  };
}
