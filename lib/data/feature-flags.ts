import { requireAdmin } from "@/lib/admin/auth";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export const FEATURE_FLAG_DISABLED_MESSAGE =
  "Tính năng này đang được mở dần. Vui lòng quay lại sau.";

export const FEATURE_FLAG_DEFINITIONS = [
  {
    defaultEnabled: true,
    description: "Tìm khách quanh tôi và theo khu vực.",
    key: "map_discovery",
    name: "Map discovery",
  },
  {
    defaultEnabled: true,
    description: "Tìm khách dọc tuyến đường.",
    key: "route_search",
    name: "Route search",
  },
  {
    defaultEnabled: true,
    description: "Xuất danh sách lead ra CSV.",
    key: "export_csv",
    name: "Export CSV",
  },
  {
    defaultEnabled: true,
    description: "Thư viện mẫu gọi điện, Zalo, email và follow-up.",
    key: "template_library",
    name: "Template library",
  },
  {
    defaultEnabled: false,
    description: "Email nhắc follow-up và digest hằng ngày.",
    key: "email_notifications",
    name: "Email notifications",
  },
  {
    defaultEnabled: true,
    description: "CTA ghi nhận quan tâm nâng cấp gói.",
    key: "upgrade_interest",
    name: "Upgrade interest",
  },
  {
    defaultEnabled: true,
    description: "Khảo sát trong app cho người dùng.",
    key: "beta_survey",
    name: "User survey",
  },
  {
    defaultEnabled: false,
    description: "Trợ lý AI viết tin nhắn, follow-up, xử lý từ chối và tóm tắt ghi chú.",
    key: "ai_assistant",
    name: "AI assistant",
  },
  {
    defaultEnabled: true,
    description: "Tạo dữ liệu mẫu cho tài khoản mới.",
    key: "sample_data",
    name: "Sample data",
  },
  {
    defaultEnabled: false,
    description: "Thanh toán tự động qua payOS.",
    key: "payment_gateway",
    name: "Payment gateway",
  },
  {
    defaultEnabled: true,
    description: "Import lead từ CSV/XLSX.",
    key: "import_leads",
    name: "Import leads",
  },
  {
    defaultEnabled: true,
    description: "Offline-lite, draft local và cài PWA.",
    key: "offline_pwa",
    name: "Offline PWA",
  },
  {
    defaultEnabled: true,
    description: "Dọn dữ liệu lead, duplicate và bulk actions.",
    key: "cleanup_tools",
    name: "Cleanup tools",
  },
  {
    defaultEnabled: true,
    description: "Pipeline bán hàng và saved views.",
    key: "pipeline",
    name: "Pipeline",
  },
  {
    defaultEnabled: true,
    description: "Analytics và sales goals.",
    key: "analytics",
    name: "Analytics",
  },
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_DEFINITIONS)[number]["key"];

export type FeatureFlag = {
  created_at?: string | null;
  description?: string | null;
  flag_key: string;
  id?: string;
  is_enabled: boolean;
  name: string;
  rollout_percentage: number;
  updated_at?: string | null;
};

export type FeatureFlagListResult = {
  items: FeatureFlag[];
  schemaReady: boolean;
};

const definitionMap = new Map(
  FEATURE_FLAG_DEFINITIONS.map((definition) => [definition.key, definition]),
);

function normalizeRollout(value?: number | null) {
  const numberValue = Number(value ?? 100);

  if (Number.isNaN(numberValue)) {
    return 100;
  }

  return Math.min(100, Math.max(0, numberValue));
}

function getFallbackFlag(flagKey: string): FeatureFlag | null {
  const definition = definitionMap.get(flagKey as FeatureFlagKey);

  if (!definition) {
    return null;
  }

  return {
    description: definition.description,
    flag_key: definition.key,
    is_enabled: definition.defaultEnabled,
    name: definition.name,
    rollout_percentage: 100,
  };
}

function getFallbackFlags() {
  return FEATURE_FLAG_DEFINITIONS.map((definition) => ({
    description: definition.description,
    flag_key: definition.key,
    is_enabled: definition.defaultEnabled,
    name: definition.name,
    rollout_percentage: 100,
  }));
}

function getStableBucket(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100;
  }

  return hash;
}

async function getCurrentUserId() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getGlobalFeatureFlags(): Promise<FeatureFlagListResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .select(
      "id,flag_key,name,description,is_enabled,rollout_percentage,created_at,updated_at",
    )
    .order("flag_key", { ascending: true });

  if (error) {
    return {
      items: getFallbackFlags(),
      schemaReady: false,
    };
  }

  const rows = (data ?? []) as FeatureFlag[];
  const rowsByKey = new Map(rows.map((row) => [row.flag_key, row]));
  const merged = FEATURE_FLAG_DEFINITIONS.map((definition) => {
    const row = rowsByKey.get(definition.key);

    return {
      description: row?.description ?? definition.description,
      flag_key: definition.key,
      id: row?.id,
      is_enabled: row?.is_enabled ?? definition.defaultEnabled,
      name: row?.name ?? definition.name,
      rollout_percentage: normalizeRollout(row?.rollout_percentage),
      updated_at: row?.updated_at,
    };
  });

  return {
    items: merged,
    schemaReady: true,
  };
}

export async function getUserFeatureFlags(userId?: string) {
  const safeUserId = userId || (await getCurrentUserId());

  if (!safeUserId) {
    return new Map<string, boolean>();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_feature_flags")
    .select("flag_key,is_enabled")
    .eq("user_id", safeUserId);

  if (error) {
    return new Map<string, boolean>();
  }

  return new Map(
    ((data ?? []) as Array<{ flag_key: string; is_enabled: boolean }>).map((row) => [
      row.flag_key,
      row.is_enabled,
    ]),
  );
}

export async function isFeatureEnabled(flagKey: string, userId?: string) {
  const safeUserId = userId || (await getCurrentUserId());
  const supabase = createSupabaseAdminClient();

  if (safeUserId) {
    const { data: userFlag } = await supabase
      .from("user_feature_flags")
      .select("is_enabled")
      .eq("user_id", safeUserId)
      .eq("flag_key", flagKey)
      .maybeSingle();

    if (typeof userFlag?.is_enabled === "boolean") {
      return userFlag.is_enabled;
    }
  }

  const { data, error } = await supabase
    .from("feature_flags")
    .select("flag_key,is_enabled,rollout_percentage")
    .eq("flag_key", flagKey)
    .maybeSingle();

  if (error) {
    return getFallbackFlag(flagKey)?.is_enabled ?? false;
  }

  if (!data) {
    return false;
  }

  if (!data.is_enabled) {
    return false;
  }

  const rollout = normalizeRollout(data.rollout_percentage);

  if (rollout >= 100) {
    return true;
  }

  if (rollout <= 0) {
    return false;
  }

  return safeUserId ? getStableBucket(`${flagKey}:${safeUserId}`) < rollout : true;
}

export async function setFeatureFlag(flagKey: string, enabled: boolean) {
  await requireAdmin();

  const fallback = getFallbackFlag(flagKey);

  if (!fallback) {
    throw new Error("Unknown feature flag.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("feature_flags").upsert(
    {
      description: fallback.description,
      flag_key: flagKey,
      is_enabled: enabled,
      name: fallback.name,
      rollout_percentage: fallback.rollout_percentage,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "flag_key" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function setUserFeatureFlag(
  userId: string,
  flagKey: string,
  enabled: boolean,
) {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("user_feature_flags").upsert(
    {
      flag_key: flagKey,
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
      user_id: userId,
    },
    { onConflict: "user_id,flag_key" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
