import "server-only";

import type { BillingEntitlements } from "@/lib/billing/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type EntitlementGrantRow = {
  amount?: number | null;
  expires_at?: string | null;
  feature_key?: string | null;
  grant_type?: string | null;
  status?: string | null;
};

const GRANT_QUOTA_FIELD_BY_FEATURE: Record<string, keyof BillingEntitlements> = {
  "ai.request": "aiDailyLimit",
  "import.rows": "importMonthlyLimit",
  "leads.save_map_lead": "leadLimit",
  "map.area_search": "mapSearchDailyLimit",
  "map.near_me_search": "mapSearchDailyLimit",
  "map.route_search": "routeSearchDailyLimit",
};

export async function getActiveEntitlementGrants(userId: string) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("entitlement_grants")
    .select("feature_key,grant_type,amount,status,expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(500);

  if (error) return [] as EntitlementGrantRow[];

  return (data ?? []) as EntitlementGrantRow[];
}

export function applyEntitlementGrants(
  entitlements: BillingEntitlements,
  grants: EntitlementGrantRow[],
) {
  const next = { ...entitlements };

  grants.forEach((grant) => {
    if (grant.grant_type !== "quota" && grant.grant_type !== "capacity") return;

    const key = grant.feature_key ? GRANT_QUOTA_FIELD_BY_FEATURE[grant.feature_key] : null;

    if (!key) return;

    next[key] = Math.max(0, next[key] + Number(grant.amount ?? 0));
  });

  return next;
}
