import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getPaging,
  getParam,
  toListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";

export type AdminBetaSignupRow = {
  admin_note?: string | null;
  beta_readiness?: string | null;
  beta_score?: number | null;
  contact_status?: string | null;
  created_at?: string;
  current_role?: string;
  desired_features?: string[] | null;
  email?: string | null;
  full_name?: string;
  id: string;
  industry?: string;
  main_area?: string;
  persona_label?: string | null;
  phone_zalo?: string;
  utm_campaign?: string | null;
  utm_source?: string | null;
};

export const BETA_CONTACT_STATUS_OPTIONS = [
  "new",
  "contacted",
  "interview_scheduled",
  "interviewed",
  "invited_beta",
  "not_fit",
  "no_response",
] as const;

export async function getAdminBetaSignups(params?: AdminSearchParams) {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { from, limit, page, to } = getPaging(params);
  const persona = getParam(params, "persona") || "";
  const role = getParam(params, "role") || "";
  const industry = getParam(params, "industry") || "";
  const contactStatus = getParam(params, "contactStatus") || "";
  const betaReadiness = getParam(params, "betaReadiness") || "";
  const utmSource = getParam(params, "utmSource") || "";
  const betaScoreMin = Number(getParam(params, "betaScoreMin")) || 0;
  const fromDate = getParam(params, "fromDate") || "";
  const toDate = getParam(params, "toDate") || "";

  let query = supabase
    .from("beta_signups")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (persona) query = query.eq("persona_label", persona);
  if (role) query = query.eq("current_role", role);
  if (industry) query = query.eq("industry", industry);
  if (contactStatus) query = query.eq("contact_status", contactStatus);
  if (betaReadiness) query = query.eq("beta_readiness", betaReadiness);
  if (utmSource) query = query.eq("utm_source", utmSource);
  if (betaScoreMin > 0) query = query.gte("beta_score", betaScoreMin);
  if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
  if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);

  const { data, count, error } = await query;

  if (error) {
    return toListResult<AdminBetaSignupRow>([], 0, page, limit);
  }

  return toListResult((data ?? []) as AdminBetaSignupRow[], count ?? 0, page, limit);
}
