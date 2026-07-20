import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const COHORT_STATUS_OPTIONS = ["planning", "active", "completed", "paused"] as const;
export const INVITE_STATUS_OPTIONS = [
  "not_invited",
  "invited",
  "accepted",
  "no_response",
  "declined",
  "removed",
] as const;
export const INTERVIEW_STATUS_OPTIONS = [
  "not_scheduled",
  "scheduled",
  "completed",
  "cancelled",
  "not_needed",
] as const;

export type BetaCohort = {
  cohort_key?: string | null;
  created_at?: string | null;
  description?: string | null;
  ended_at?: string | null;
  id: string;
  membersCount: number;
  name: string;
  started_at?: string | null;
  status?: string | null;
  target_user_count?: number | null;
};

export type BetaCohortMember = {
  admin_note?: string | null;
  email?: string | null;
  health_label?: string | null;
  health_score?: number | null;
  id: string;
  industry?: string | null;
  interview_status?: string | null;
  invite_status?: string | null;
  last_active_at?: string | null;
  name?: string | null;
  persona_label?: string | null;
  phone_zalo?: string | null;
  role_type?: string | null;
  user_id?: string | null;
};

export async function listBetaCohorts() {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const [cohortsResult, membersResult] = await Promise.all([
    supabase
      .from("beta_cohorts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("beta_cohort_members").select("cohort_id").limit(10000),
  ]);
  const memberCounts = new Map<string, number>();

  ((membersResult.data ?? []) as Array<{ cohort_id?: string | null }>).forEach((member) => {
    if (member.cohort_id) {
      memberCounts.set(member.cohort_id, (memberCounts.get(member.cohort_id) ?? 0) + 1);
    }
  });

  return ((cohortsResult.data ?? []) as Array<Omit<BetaCohort, "membersCount">>).map(
    (cohort) => ({
      ...cohort,
      membersCount: memberCounts.get(cohort.id) ?? 0,
    }),
  );
}

export async function createBetaCohort(input: {
  cohortKey?: string;
  description?: string;
  name: string;
  status: string;
  targetUserCount?: number;
}) {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("beta_cohorts").insert({
    cohort_key: input.cohortKey || null,
    description: input.description || null,
    name: input.name,
    status: input.status || "planning",
    target_user_count: Number(input.targetUserCount) || 0,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getBetaCohortDetail(cohortId: string) {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const [cohortResult, membersResult, healthResult] = await Promise.all([
    supabase.from("beta_cohorts").select("*").eq("id", cohortId).maybeSingle(),
    supabase
      .from("beta_cohort_members")
      .select("*")
      .eq("cohort_id", cohortId)
      .order("created_at", { ascending: false }),
    supabase.from("user_health_scores").select("user_id,health_score,health_label,last_active_at"),
  ]);

  if (cohortResult.error || !cohortResult.data) {
    throw new Error("Không tìm thấy cohort.");
  }

  const healthMap = new Map(
    ((healthResult.data ?? []) as Array<{
      health_label?: string | null;
      health_score?: number | null;
      last_active_at?: string | null;
      user_id: string;
    }>).map((row) => [row.user_id, row]),
  );
  const members = ((membersResult.data ?? []) as BetaCohortMember[]).map((member) => {
    const health = member.user_id ? healthMap.get(member.user_id) : null;

    return {
      ...member,
      health_label: health?.health_label ?? null,
      health_score: health?.health_score ?? null,
      last_active_at: health?.last_active_at ?? null,
    };
  });

  return {
    cohort: cohortResult.data as Omit<BetaCohort, "membersCount">,
    members,
  };
}

export async function addManualCohortMember(
  cohortId: string,
  input: {
    email?: string;
    industry?: string;
    name?: string;
    personaLabel?: string;
    phoneZalo?: string;
    roleType?: string;
  },
) {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("beta_cohort_members").insert({
    cohort_id: cohortId,
    email: input.email || null,
    industry: input.industry || null,
    name: input.name || null,
    persona_label: input.personaLabel || null,
    phone_zalo: input.phoneZalo || null,
    role_type: input.roleType || null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCohortMember(
  memberId: string,
  input: {
    adminNote?: string;
    interviewStatus: string;
    inviteStatus: string;
  },
) {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const payload: Record<string, string | null> = {
    admin_note: input.adminNote || null,
    interview_status: input.interviewStatus,
    invite_status: input.inviteStatus,
    updated_at: now,
  };

  if (input.inviteStatus === "invited") {
    payload.invited_at = now;
  }

  const { error } = await supabase
    .from("beta_cohort_members")
    .update(payload)
    .eq("id", memberId);

  if (error) {
    throw new Error(error.message);
  }
}
