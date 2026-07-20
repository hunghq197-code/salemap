import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getUserLabel,
  listAuthUsers,
  listProfiles,
  toProfileMap,
  toUserEmailMap,
} from "@/lib/admin/data/common";
import {
  getPaging,
  getParam,
  toListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";

export const UPGRADE_INTEREST_STATUS_OPTIONS = [
  "new",
  "contacted",
  "high_intent",
  "low_intent",
  "converted_later",
  "closed",
] as const;

export type AdminUpgradeInterestRow = {
  admin_note?: string | null;
  created_at?: string;
  current_role_type?: string | null;
  expected_price?: string | null;
  id: string;
  industry?: string | null;
  main_feature_interest?: string | null;
  plan_key?: string;
  plan_name?: string;
  reason?: string | null;
  source_page?: string | null;
  status?: string | null;
  userLabel: string;
  user_id?: string | null;
};

function getMostCommon(items: Array<string | null | undefined>) {
  const counts = new Map<string, number>();

  items.filter(Boolean).forEach((item) => {
    const key = String(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "Chưa có";
}

export async function getAdminUpgradeInterests(params?: AdminSearchParams) {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { from, limit, page, to } = getPaging(params);
  const plan = getParam(params, "plan") || "";
  const expectedPrice = getParam(params, "expectedPrice") || "";
  const mainFeature = getParam(params, "mainFeature") || "";
  const role = getParam(params, "role") || "";
  const industry = getParam(params, "industry") || "";
  const status = getParam(params, "status") || "";
  const fromDate = getParam(params, "fromDate") || "";
  const toDate = getParam(params, "toDate") || "";

  let query = supabase
    .from("upgrade_interests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (plan) query = query.eq("plan_key", plan);
  if (expectedPrice) query = query.eq("expected_price", expectedPrice);
  if (mainFeature) query = query.eq("main_feature_interest", mainFeature);
  if (role) query = query.eq("current_role_type", role);
  if (industry) query = query.eq("industry", industry);
  if (status) query = query.eq("status", status);
  if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
  if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);

  const [result, allResult, users, profiles] = await Promise.all([
    query,
    supabase.from("upgrade_interests").select("plan_key,expected_price,main_feature_interest"),
    listAuthUsers(),
    listProfiles(),
  ]);

  if (result.error) {
    return {
      insights: {
        mostCommonFeature: "Chưa có",
        mostCommonPrice: "Chưa có",
        pro: 0,
        proPlus: 0,
      },
      result: toListResult<AdminUpgradeInterestRow>([], 0, page, limit),
    };
  }

  const profileMap = toProfileMap(profiles);
  const emailMap = toUserEmailMap(users);
  const rows = ((result.data ?? []) as Array<Omit<AdminUpgradeInterestRow, "userLabel">>).map(
    (item) => ({
      ...item,
      userLabel: getUserLabel(item.user_id, profileMap, emailMap),
    }),
  );
  const allRows = (allResult.data ?? []) as Array<{
    expected_price?: string | null;
    main_feature_interest?: string | null;
    plan_key?: string | null;
  }>;

  return {
    insights: {
      mostCommonFeature: getMostCommon(allRows.map((row) => row.main_feature_interest)),
      mostCommonPrice: getMostCommon(allRows.map((row) => row.expected_price)),
      pro: allRows.filter((row) => row.plan_key === "pro").length,
      proPlus: allRows.filter((row) => row.plan_key === "pro_plus").length,
    },
    result: toListResult(rows, result.count ?? 0, page, limit),
  };
}
