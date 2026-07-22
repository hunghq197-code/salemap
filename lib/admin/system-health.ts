import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type SystemHealthRisk = "high" | "low" | "medium";
export type SystemHealthStatus = "missing" | "ok" | "warning";

export type SystemHealthItem = {
  key: string;
  message: string;
  present: boolean;
  risk: SystemHealthRisk;
  source: "database" | "env" | "runtime";
  status: SystemHealthStatus;
};

const ENV_CHECKS: Array<{
  key: string;
  message: string;
  risk: SystemHealthRisk;
}> = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    message: "Supabase project URL cho server/browser client.",
    risk: "high",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    message: "Supabase anon/publishable key cho browser client.",
    risk: "high",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    message: "Service role key chỉ dùng server-side cho admin jobs.",
    risk: "high",
  },
  {
    key: "NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY",
    message: "Google Maps browser key cho bản đồ phía client.",
    risk: "medium",
  },
  {
    key: "GOOGLE_MAPS_API_KEY",
    message: "Google Maps server key cho Places/Directions API.",
    risk: "medium",
  },
  {
    key: "PAYOS_CLIENT_ID",
    message: "payOS client id cho thanh toán tự động.",
    risk: "medium",
  },
  {
    key: "PAYOS_API_KEY",
    message: "payOS API key chỉ dùng server-side.",
    risk: "medium",
  },
  {
    key: "PAYOS_CHECKSUM_KEY",
    message: "payOS checksum key để verify webhook/signature.",
    risk: "high",
  },
  {
    key: "AI_API_KEY",
    message: "AI provider key cho trợ lý AI.",
    risk: "medium",
  },
  {
    key: "RESEND_API_KEY",
    message: "Email provider key cho reminder/digest.",
    risk: "low",
  },
  {
    key: "EMAIL_FROM",
    message: "Email sender cho reminder/digest.",
    risk: "low",
  },
  {
    key: "CRON_SECRET",
    message: "Secret bảo vệ các cron route.",
    risk: "medium",
  },
];

function isEnvPresent(key: string) {
  if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  }

  return Boolean(process.env[key]?.trim());
}

async function checkSupabaseConnection(): Promise<SystemHealthItem> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true });

    return {
      key: "supabase_connection",
      message: error
        ? "Không kiểm tra được kết nối Supabase."
        : "Supabase service role query hoạt động.",
      present: !error,
      risk: "high",
      source: "database",
      status: error ? "missing" : "ok",
    };
  } catch {
    return {
      key: "supabase_connection",
      message: "Không khởi tạo được Supabase admin client.",
      present: false,
      risk: "high",
      source: "database",
      status: "missing",
    };
  }
}

async function countRecentRows(table: string, filter?: { key: string; value: unknown }) {
  try {
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (filter) {
      query = query.eq(filter.key, filter.value);
    }

    const { count, error } = await query;

    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

export async function checkSystemHealth() {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_SYSTEM_HEALTH);

  const envItems: SystemHealthItem[] = ENV_CHECKS.map((item) => {
    const present = isEnvPresent(item.key);

    return {
      key: item.key,
      message: item.message,
      present,
      risk: item.risk,
      source: "env",
      status: present ? "ok" : "missing",
    };
  });
  const [supabaseConnection, recentSecurityEvents, unresolvedSecurityEvents, recentAuditLogs] =
    await Promise.all([
      checkSupabaseConnection(),
      countRecentRows("security_events"),
      countRecentRows("security_events", { key: "resolved", value: false }),
      countRecentRows("admin_audit_logs"),
    ]);

  return {
    checks: [
      supabaseConnection,
      ...envItems,
      {
        key: "runtime_environment",
        message: process.env.VERCEL_ENV || process.env.NODE_ENV || "local",
        present: true,
        risk: "low" as const,
        source: "runtime" as const,
        status: "ok" as const,
      },
    ],
    stats: {
      recentAuditLogs,
      recentSecurityEvents,
      unresolvedSecurityEvents,
    },
  };
}
