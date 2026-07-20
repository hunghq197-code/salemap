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

export const FEEDBACK_STATUS_OPTIONS = [
  "new",
  "reviewing",
  "planned",
  "fixed",
  "rejected",
  "closed",
] as const;

export const FEEDBACK_PRIORITY_OPTIONS = [
  "low",
  "normal",
  "high",
  "urgent",
] as const;

export type AdminFeedbackRow = {
  admin_note?: string | null;
  browser_info?: string | null;
  content?: string;
  created_at?: string;
  device_type?: string | null;
  feedback_type?: string;
  id: string;
  page_path?: string | null;
  priority?: string | null;
  rating?: number | null;
  status?: string | null;
  title?: string | null;
  userLabel: string;
  user_id?: string | null;
};

export async function getAdminFeedback(params?: AdminSearchParams) {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { from, limit, page, to } = getPaging(params);
  const type = getParam(params, "type") || "";
  const rating = Number(getParam(params, "rating")) || 0;
  const status = getParam(params, "status") || "";
  const priority = getParam(params, "priority") || "";
  const fromDate = getParam(params, "fromDate") || "";
  const toDate = getParam(params, "toDate") || "";

  let query = supabase
    .from("beta_feedback")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (type) query = query.eq("feedback_type", type);
  if (rating > 0) query = query.eq("rating", rating);
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
  if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);

  const [result, users, profiles] = await Promise.all([
    query,
    listAuthUsers(),
    listProfiles(),
  ]);

  if (result.error) {
    return toListResult<AdminFeedbackRow>([], 0, page, limit);
  }

  const profileMap = toProfileMap(profiles);
  const emailMap = toUserEmailMap(users);
  const rows = ((result.data ?? []) as Array<Omit<AdminFeedbackRow, "userLabel">>).map(
    (item) => ({
      ...item,
      userLabel: getUserLabel(item.user_id, profileMap, emailMap),
    }),
  );

  return toListResult(rows, result.count ?? 0, page, limit);
}
