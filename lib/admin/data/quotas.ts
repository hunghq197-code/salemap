import { writeAdminAuditLog } from "@/lib/admin/audit-log";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
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
  normalizeText,
  toListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";
import { DAILY_QUOTA_LABELS, type DailyQuotaAction } from "@/lib/constants/quota";
import { SUBSCRIPTION_PLANS } from "@/lib/constants/subscription-plans";
import { SafeError } from "@/lib/security/safe-error";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const QUOTA_OVERRIDE_FIELDS = [
  { actionType: "near_me_search", key: "map_search_daily_limit", label: "Map search/ngày" },
  { actionType: "route_search", key: "route_search_daily_limit", label: "Route search/ngày" },
  { actionType: "ai_request", key: "ai_daily_limit", label: "AI/ngày" },
  { actionType: "export_leads", key: "export_daily_limit", label: "Export/ngày" },
  { actionType: "import_rows", key: "import_monthly_limit", label: "Import/tháng" },
  { actionType: "save_map_lead", key: "lead_limit", label: "Lead từ map/ngày" },
] as const;

export const FEATURE_OVERRIDE_FIELDS = [
  { key: "enable_map_discovery", label: "Map discovery" },
  { key: "enable_route_search", label: "Route search" },
  { key: "enable_ai_assistant", label: "AI assistant" },
  { key: "enable_export", label: "Export CSV" },
  { key: "enable_import", label: "Import lead" },
  { key: "enable_cadences", label: "Cadences" },
] as const;

export type QuotaOverrideFieldKey = (typeof QUOTA_OVERRIDE_FIELDS)[number]["key"];
export type FeatureOverrideFieldKey = (typeof FEATURE_OVERRIDE_FIELDS)[number]["key"];

export type UserQuotaOverrideRow = {
  ai_daily_limit?: number | null;
  created_at?: string | null;
  export_daily_limit?: number | null;
  id?: string;
  import_monthly_limit?: number | null;
  lead_limit?: number | null;
  map_search_daily_limit?: number | null;
  reason?: string | null;
  route_search_daily_limit?: number | null;
  updated_at?: string | null;
  user_id: string;
};

export type UserFeatureOverrideRow = {
  created_at?: string | null;
  enable_ai_assistant?: boolean | null;
  enable_cadences?: boolean | null;
  enable_export?: boolean | null;
  enable_import?: boolean | null;
  enable_map_discovery?: boolean | null;
  enable_route_search?: boolean | null;
  id?: string;
  reason?: string | null;
  updated_at?: string | null;
  user_id: string;
};

function clampLimit(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  return Math.max(0, Math.min(1_000_000, Math.round(parsed)));
}

function normalizeReason(value?: string | null) {
  return String(value || "").trim().slice(0, 500) || null;
}

function parseFeatureState(value: unknown) {
  if (value === "true" || value === true) {
    return true;
  }

  if (value === "false" || value === false) {
    return false;
  }

  return null;
}

async function listQuotaOverrides() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_quota_overrides")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1000);

  if (error) {
    return [] as UserQuotaOverrideRow[];
  }

  return (data ?? []) as UserQuotaOverrideRow[];
}

async function listFeatureOverrides() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_feature_overrides")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1000);

  if (error) {
    return [] as UserFeatureOverrideRow[];
  }

  return (data ?? []) as UserFeatureOverrideRow[];
}

export function getDefaultQuotaRows() {
  return Object.values(SUBSCRIPTION_PLANS).flatMap((plan) =>
    Object.entries(plan.dailyQuotas).map(([actionType, limit]) => ({
      actionType,
      label:
        DAILY_QUOTA_LABELS[actionType as DailyQuotaAction]?.label ||
        actionType,
      limit,
      planKey: plan.key,
      planName: plan.name,
    })),
  );
}

export async function getAdminQuotaOverrides(params?: AdminSearchParams) {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_USAGE);

  const { limit, page } = getPaging(params);
  const q = normalizeText(getParam(params, "q"));
  const onlyOverrides = getParam(params, "onlyOverrides") === "true";
  const [users, profiles, quotaOverrides, featureOverrides] = await Promise.all([
    listAuthUsers(),
    listProfiles(),
    listQuotaOverrides(),
    listFeatureOverrides(),
  ]);

  const emailMap = toUserEmailMap(users);
  const profileMap = toProfileMap(profiles);
  const quotaMap = new Map(quotaOverrides.map((row) => [row.user_id, row]));
  const featureMap = new Map(featureOverrides.map((row) => [row.user_id, row]));
  const rows = users.map((user) => ({
    email: emailMap.get(user.id) || "",
    featureOverride: featureMap.get(user.id) || null,
    fullName: profileMap.get(user.id)?.full_name || "",
    quotaOverride: quotaMap.get(user.id) || null,
    userId: user.id,
    userLabel: getUserLabel(user.id, profileMap, emailMap),
  }));

  const filtered = rows.filter((row) => {
    if (q && !normalizeText(`${row.userLabel} ${row.email}`).includes(q)) {
      return false;
    }

    if (onlyOverrides && !row.quotaOverride && !row.featureOverride) {
      return false;
    }

    return true;
  });

  return {
    defaultQuotas: getDefaultQuotaRows(),
    result: toListResult(
      filtered.slice((page - 1) * limit, page * limit),
      filtered.length,
      page,
      limit,
    ),
  };
}

export async function setUserQuotaOverride(
  input: {
    reason?: string | null;
    userId: string;
  } & Partial<Record<QuotaOverrideFieldKey, unknown>>,
  request?: Request,
) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_QUOTA);

  if (!input.userId) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const payload: Record<string, unknown> = {
    reason: normalizeReason(input.reason),
    updated_at: new Date().toISOString(),
    updated_by: admin.userId,
    user_id: input.userId,
  };

  QUOTA_OVERRIDE_FIELDS.forEach((field) => {
    payload[field.key] = clampLimit(input[field.key]);
  });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("user_quota_overrides")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw new SafeError("UNKNOWN_ERROR", 500);
  }

  await writeAdminAuditLog({
    action: "quota_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      fields: QUOTA_OVERRIDE_FIELDS.map((field) => field.key),
    },
    request,
    severity: "warning",
    targetId: input.userId,
    targetType: "user_quota_override",
  });
}

export async function removeUserQuotaOverride(userId: string, request?: Request) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_QUOTA);

  if (!userId) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("user_quota_overrides")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new SafeError("UNKNOWN_ERROR", 500);
  }

  await writeAdminAuditLog({
    action: "quota_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      removed: true,
    },
    request,
    severity: "warning",
    targetId: userId,
    targetType: "user_quota_override",
  });
}

export async function setUserFeatureOverride(
  input: {
    reason?: string | null;
    userId: string;
  } & Partial<Record<FeatureOverrideFieldKey, unknown>>,
  request?: Request,
) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_QUOTA);

  if (!input.userId) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const payload: Record<string, unknown> = {
    reason: normalizeReason(input.reason),
    updated_at: new Date().toISOString(),
    updated_by: admin.userId,
    user_id: input.userId,
  };

  FEATURE_OVERRIDE_FIELDS.forEach((field) => {
    payload[field.key] = parseFeatureState(input[field.key]);
  });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("user_feature_overrides")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw new SafeError("UNKNOWN_ERROR", 500);
  }

  await writeAdminAuditLog({
    action: "feature_flag_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      fields: FEATURE_OVERRIDE_FIELDS.map((field) => field.key),
    },
    request,
    severity: "warning",
    targetId: input.userId,
    targetType: "user_feature_override",
  });
}

export async function removeUserFeatureOverride(userId: string, request?: Request) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.UPDATE_QUOTA);

  if (!userId) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("user_feature_overrides")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new SafeError("UNKNOWN_ERROR", 500);
  }

  await writeAdminAuditLog({
    action: "feature_flag_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      removed: true,
    },
    request,
    severity: "warning",
    targetId: userId,
    targetType: "user_feature_override",
  });
}
