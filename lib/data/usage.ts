import { SUBSCRIPTION_PLANS } from "@/lib/constants/subscription-plans";
import type { DailyQuotaAction } from "@/lib/constants/quota";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { getDailyQuotaLimitForUser } from "@/lib/data/subscriptions";
import { isMissingSupabaseSchema } from "@/lib/supabase/schema-error";

export type DailyUsage = {
  actionType: DailyQuotaAction;
  limit: number;
  remaining: number;
  used: number;
};

export type DailyUsageSnapshot = {
  items: DailyUsage[];
  schemaReady: boolean;
};

export class QuotaExceededError extends Error {
  code = "QUOTA_EXCEEDED";

  constructor() {
    super("Bạn đã dùng hết lượt hôm nay.");
    this.name = "QuotaExceededError";
  }
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function toDailyUsage(actionType: DailyQuotaAction, used: number, limit: number): DailyUsage {
  return {
    actionType,
    limit,
    remaining: Math.max(0, limit - used),
    used,
  };
}

function isMissingUsageTable(error: unknown) {
  if (error instanceof Error) {
    return error.message.includes("daily_usage_limits") || error.message.includes("schema cache");
  }

  return isMissingSupabaseSchema(error as { code?: string; message?: string }, [
    "daily_usage_limits",
  ]);
}

function getDefaultUsage(actionType: DailyQuotaAction) {
  return toDailyUsage(actionType, 0, SUBSCRIPTION_PLANS.free_beta.dailyQuotas[actionType]);
}

export async function getDailyUsage(actionType: DailyQuotaAction) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const usageDate = getTodayDate();
  const limit = await getDailyQuotaLimitForUser(actionType, userId);

  const { data, error } = await supabase
    .from("daily_usage_limits")
    .select("id,used_count,limit_count")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .eq("action_type", actionType)
    .maybeSingle();

  if (error) {
    if (isMissingSupabaseSchema(error, ["daily_usage_limits"])) {
      return getDefaultUsage(actionType);
    }

    throw new Error(error.message);
  }

  if (data) {
    const usedCount = data.used_count ?? 0;

    if ((data.limit_count ?? limit) !== limit) {
      await supabase
        .from("daily_usage_limits")
        .update({
          limit_count: limit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    }

    return toDailyUsage(actionType, usedCount, limit);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("daily_usage_limits")
    .insert({
      action_type: actionType,
      limit_count: limit,
      usage_date: usageDate,
      used_count: 0,
      user_id: userId,
    })
    .select("used_count,limit_count")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return getDailyUsage(actionType);
    }

    if (isMissingSupabaseSchema(insertError, ["daily_usage_limits"])) {
      return getDefaultUsage(actionType);
    }

    throw new Error(insertError.message);
  }

  return toDailyUsage(actionType, inserted.used_count ?? 0, inserted.limit_count ?? limit);
}

export async function checkDailyQuota(actionType: DailyQuotaAction) {
  const usage = await getDailyUsage(actionType);

  if (usage.used >= usage.limit) {
    return {
      allowed: false,
      usage,
    };
  }

  return {
    allowed: true,
    usage,
  };
}

export async function consumeDailyQuota(actionType: DailyQuotaAction) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const usageDate = getTodayDate();
  const usage = await getDailyUsage(actionType);

  if (usage.used >= usage.limit) {
    throw new QuotaExceededError();
  }

  const nextUsed = usage.used + 1;
  const { data, error } = await supabase
    .from("daily_usage_limits")
    .update({
      limit_count: usage.limit,
      updated_at: new Date().toISOString(),
      used_count: nextUsed,
    })
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .eq("action_type", actionType)
    .select("used_count,limit_count")
    .single();

  if (error) {
    if (isMissingSupabaseSchema(error, ["daily_usage_limits"])) {
      return toDailyUsage(actionType, usage.used, usage.limit);
    }

    throw new Error(error.message);
  }

  return toDailyUsage(actionType, data.used_count ?? nextUsed, data.limit_count ?? usage.limit);
}

export async function getDailyUsageList(actionTypes: readonly DailyQuotaAction[]) {
  return Promise.all(actionTypes.map((actionType) => getDailyUsage(actionType)));
}

export async function getDailyUsageSnapshot(
  actionTypes: readonly DailyQuotaAction[],
): Promise<DailyUsageSnapshot> {
  try {
    return {
      items: await getDailyUsageList(actionTypes),
      schemaReady: true,
    };
  } catch (error) {
    if (isMissingUsageTable(error)) {
      return {
        items: actionTypes.map(getDefaultUsage),
        schemaReady: false,
      };
    }

    throw error;
  }
}
