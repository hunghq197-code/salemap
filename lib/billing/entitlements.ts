import "server-only";

import type { DailyQuotaAction } from "@/lib/constants/quota";
import { getPlanEntitlements } from "@/lib/billing/plans";
import { getSubscriptionStatus } from "@/lib/billing/subscriptions";
import type { BillingEntitlements } from "@/lib/billing/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type FeatureKey =
  | "ai_assistant"
  | "cadences"
  | "export"
  | "import"
  | "map_discovery"
  | "route_search";

const QUOTA_FIELD_BY_ACTION: Record<DailyQuotaAction, keyof BillingEntitlements> = {
  ai_request: "aiDailyLimit",
  area_search: "mapSearchDailyLimit",
  export_leads: "exportDailyLimit",
  import_rows: "importMonthlyLimit",
  near_me_search: "mapSearchDailyLimit",
  route_search: "routeSearchDailyLimit",
  save_map_lead: "leadLimit",
};

const OVERRIDE_COLUMN_BY_ACTION: Record<DailyQuotaAction, string> = {
  ai_request: "ai_daily_limit",
  area_search: "map_search_daily_limit",
  export_leads: "export_daily_limit",
  import_rows: "import_monthly_limit",
  near_me_search: "map_search_daily_limit",
  route_search: "route_search_daily_limit",
  save_map_lead: "lead_limit",
};

const FEATURE_COLUMN_BY_FEATURE: Record<FeatureKey, string> = {
  ai_assistant: "enable_ai_assistant",
  cadences: "enable_cadences",
  export: "enable_export",
  import: "enable_import",
  map_discovery: "enable_map_discovery",
  route_search: "enable_route_search",
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function applyQuotaOverrides(
  entitlements: BillingEntitlements,
  override?: Record<string, unknown> | null,
) {
  if (!override) {
    return entitlements;
  }

  const next = { ...entitlements };
  const pairs: Array<[keyof BillingEntitlements, string]> = [
    ["aiDailyLimit", "ai_daily_limit"],
    ["exportDailyLimit", "export_daily_limit"],
    ["importMonthlyLimit", "import_monthly_limit"],
    ["leadLimit", "lead_limit"],
    ["mapSearchDailyLimit", "map_search_daily_limit"],
    ["routeSearchDailyLimit", "route_search_daily_limit"],
  ];

  for (const [key, column] of pairs) {
    const value = override[column];

    if (typeof value === "number" && Number.isFinite(value)) {
      next[key] = Math.max(0, Math.round(value));
    }
  }

  return next;
}

export async function getUserEntitlements(userId: string) {
  const supabase = createSupabaseAdminClient();
  const status = await getSubscriptionStatus(userId);
  const entitlements = getPlanEntitlements(status.planId);
  const { data: override } = await supabase
    .from("user_quota_overrides")
    .select(
      "map_search_daily_limit,route_search_daily_limit,ai_daily_limit,export_daily_limit,import_monthly_limit,lead_limit",
    )
    .eq("user_id", userId)
    .maybeSingle();

  return {
    entitlements: applyQuotaOverrides(entitlements, override as Record<string, unknown> | null),
    plan: status.plan,
    planId: status.planId,
    subscription: status.subscription,
  };
}

export async function canUseFeature(userId: string, feature: FeatureKey) {
  const entitlement = await getUserEntitlements(userId);
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("user_feature_overrides")
    .select(FEATURE_COLUMN_BY_FEATURE[feature])
    .eq("user_id", userId)
    .maybeSingle();
  const override = (data as Record<string, unknown> | null)?.[
    FEATURE_COLUMN_BY_FEATURE[feature]
  ];

  if (typeof override === "boolean") {
    return override;
  }

  if (feature === "ai_assistant") return entitlement.entitlements.aiDailyLimit > 0;
  if (feature === "cadences") return entitlement.entitlements.cadenceLimit > 0;
  if (feature === "export") return entitlement.entitlements.exportDailyLimit > 0;
  if (feature === "import") return entitlement.entitlements.importMonthlyLimit > 0;
  if (feature === "route_search") return entitlement.entitlements.routeSearchDailyLimit > 0;

  return entitlement.entitlements.mapSearchDailyLimit > 0;
}

export async function getQuotaLimit(userId: string, quotaType: DailyQuotaAction) {
  const { entitlements } = await getUserEntitlements(userId);

  return entitlements[QUOTA_FIELD_BY_ACTION[quotaType]];
}

export async function checkQuota(userId: string, quotaType: DailyQuotaAction) {
  const supabase = createSupabaseAdminClient();
  const usageDate = getTodayDate();
  const limit = await getQuotaLimit(userId, quotaType);
  const { data } = await supabase
    .from("daily_usage_limits")
    .select("used_count")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .eq("action_type", quotaType)
    .maybeSingle();
  const used = Number((data as { used_count?: number } | null)?.used_count ?? 0);

  return {
    allowed: used < limit,
    limit,
    remaining: Math.max(0, limit - used),
    used,
  };
}

export async function consumeQuota(userId: string, quotaType: DailyQuotaAction) {
  const supabase = createSupabaseAdminClient();
  const usageDate = getTodayDate();
  const usage = await checkQuota(userId, quotaType);

  if (!usage.allowed) {
    return usage;
  }

  const nextUsed = usage.used + 1;
  const { error } = await supabase.from("daily_usage_limits").upsert(
    {
      action_type: quotaType,
      limit_count: usage.limit,
      updated_at: new Date().toISOString(),
      usage_date: usageDate,
      used_count: nextUsed,
      user_id: userId,
    },
    { onConflict: "user_id,usage_date,action_type" },
  );

  if (error) {
    return usage;
  }

  return {
    allowed: nextUsed < usage.limit,
    limit: usage.limit,
    remaining: Math.max(0, usage.limit - nextUsed),
    used: nextUsed,
  };
}

export async function getQuotaSummary(userId: string) {
  const supabase = createSupabaseAdminClient();
  const usageDate = getTodayDate();
  const { entitlements, plan, planId, subscription } = await getUserEntitlements(userId);
  const actions = Object.keys(OVERRIDE_COLUMN_BY_ACTION) as DailyQuotaAction[];
  const { data } = await supabase
    .from("daily_usage_limits")
    .select("action_type,used_count")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .in("action_type", actions);
  const usedMap = new Map(
    ((data ?? []) as Array<{ action_type: DailyQuotaAction; used_count: number }>).map(
      (item) => [item.action_type, Number(item.used_count || 0)],
    ),
  );

  return {
    entitlements,
    items: actions.map((actionType) => {
      const limit = entitlements[QUOTA_FIELD_BY_ACTION[actionType]];
      const used = usedMap.get(actionType) ?? 0;

      return {
        actionType,
        limit,
        remaining: Math.max(0, limit - used),
        used,
      };
    }),
    plan,
    planId,
    subscription,
  };
}
