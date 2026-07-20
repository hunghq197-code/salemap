import { requireAdmin } from "@/lib/admin/auth";
import {
  getUserLabel,
  listAuthUsers,
  listProfiles,
  toProfileMap,
  toUserEmailMap,
} from "@/lib/admin/data/common";
import type { AIRequestRecord } from "@/lib/data/ai";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminAIRequest = AIRequestRecord & {
  userEmail?: string;
  userLabel?: string;
};

export type AdminAIUsageResult = {
  errorCount: number;
  estimatedCost: number;
  items: AdminAIRequest[];
  mostPopularRequestType: string;
  monthCount: number;
  schemaReady: boolean;
  todayCount: number;
  userCount: number;
};

export async function getAdminAIUsage(): Promise<AdminAIUsageResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const sinceMonth = new Date();
  sinceMonth.setDate(1);
  sinceMonth.setHours(0, 0, 0, 0);
  const sinceToday = new Date();
  sinceToday.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("ai_requests")
    .select(
      "id,user_id,lead_id,template_id,request_type,status,error_code,tokens_input,tokens_output,estimated_cost,model_name,provider,created_at",
    )
    .gte("created_at", sinceMonth.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return {
      errorCount: 0,
      estimatedCost: 0,
      items: [],
      monthCount: 0,
      mostPopularRequestType: "Chưa có",
      schemaReady: false,
      todayCount: 0,
      userCount: 0,
    };
  }

  const rows = (data ?? []) as AIRequestRecord[];
  const [users, profiles] = await Promise.all([listAuthUsers(), listProfiles()]);
  const emailMap = toUserEmailMap(users);
  const profileMap = toProfileMap(profiles);
  const typeCounts = new Map<string, number>();

  rows.forEach((row) => {
    typeCounts.set(row.request_type, (typeCounts.get(row.request_type) ?? 0) + 1);
  });

  const mostPopularRequestType =
    Array.from(typeCounts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ||
    "Chưa có";

  return {
    errorCount: rows.filter((row) => row.status === "failed").length,
    estimatedCost: rows.reduce((total, row) => total + Number(row.estimated_cost || 0), 0),
    items: rows.map((row) => ({
      ...row,
      userEmail: emailMap.get(row.user_id) || "",
      userLabel: getUserLabel(row.user_id, profileMap, emailMap),
    })),
    monthCount: rows.length,
    mostPopularRequestType,
    schemaReady: true,
    todayCount: rows.filter(
      (row) => row.created_at && new Date(row.created_at).getTime() >= sinceToday.getTime(),
    ).length,
    userCount: new Set(rows.map((row) => row.user_id)).size,
  };
}
