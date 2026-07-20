import { requireAdmin } from "@/lib/admin/auth";
import { normalizeInviteCode } from "@/lib/data/beta-invites";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminInviteCode = {
  assigned_email?: string | null;
  assigned_phone?: string | null;
  code: string;
  cohort_id?: string | null;
  cohortName?: string | null;
  created_at?: string | null;
  description?: string | null;
  expires_at?: string | null;
  id: string;
  is_active?: boolean | null;
  label?: string | null;
  max_uses?: number | null;
  source?: string | null;
  used_count?: number | null;
};

export type InviteCodeListResult = {
  cohorts: Array<{ id: string; name: string }>;
  items: AdminInviteCode[];
  schemaReady: boolean;
};

function generateInviteCode() {
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();

  return `SALEMAP-INVITE-${suffix}`;
}

export async function listAdminInviteCodes(): Promise<InviteCodeListResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const [inviteResult, cohortResult] = await Promise.all([
    supabase
      .from("beta_invite_codes")
      .select(
        "id,code,label,description,max_uses,used_count,assigned_email,assigned_phone,source,cohort_id,is_active,expires_at,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("beta_cohorts")
      .select("id,name")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (inviteResult.error) {
    return {
      cohorts: [],
      items: [],
      schemaReady: false,
    };
  }

  const cohorts = ((cohortResult.data ?? []) as Array<{ id: string; name: string }>).map(
    (cohort) => ({
      id: cohort.id,
      name: cohort.name,
    }),
  );
  const cohortMap = new Map(cohorts.map((cohort) => [cohort.id, cohort.name]));

  return {
    cohorts,
    items: ((inviteResult.data ?? []) as AdminInviteCode[]).map((invite) => ({
      ...invite,
      cohortName: invite.cohort_id ? cohortMap.get(invite.cohort_id) ?? null : null,
    })),
    schemaReady: true,
  };
}

export async function createAdminInviteCode(input: {
  assignedEmail?: string;
  assignedPhone?: string;
  code?: string;
  cohortId?: string;
  description?: string;
  expiresAt?: string;
  isActive?: boolean;
  label?: string;
  maxUses?: number;
  source?: string;
}) {
  const admin = await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const code = normalizeInviteCode(input.code || generateInviteCode());
  const maxUses = Number(input.maxUses || 1);
  const { error } = await supabase.from("beta_invite_codes").insert({
    assigned_email: input.assignedEmail || null,
    assigned_phone: input.assignedPhone || null,
    code,
    cohort_id: input.cohortId || null,
    created_by: admin.userId,
    description: input.description || null,
    expires_at: input.expiresAt || null,
    is_active: input.isActive ?? true,
    label: input.label || null,
    max_uses: Math.max(1, maxUses),
    source: input.source || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return code;
}

export async function setAdminInviteCodeActive(inviteCodeId: string, isActive: boolean) {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("beta_invite_codes")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inviteCodeId);

  if (error) {
    throw new Error(error.message);
  }
}
