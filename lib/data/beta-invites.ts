import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const INVITE_CODE_ERROR_MESSAGE =
  "Mã mời không hợp lệ hoặc đã hết lượt sử dụng.";

type InviteRow = {
  assigned_email?: string | null;
  assigned_phone?: string | null;
  code: string;
  cohort_id?: string | null;
  expires_at?: string | null;
  id: string;
  is_active?: boolean | null;
  label?: string | null;
  max_uses?: number | null;
  source?: string | null;
  used_count?: number | null;
};

export type BetaInviteValidationResult = {
  cohortId?: string | null;
  errorCode?: string;
  inviteCodeId?: string;
  label?: string | null;
  source?: string | null;
  valid: boolean;
};

export function isBetaInviteOnlyMode() {
  return process.env.NEXT_PUBLIC_BETA_INVITE_ONLY === "true";
}

export function normalizeInviteCode(code?: string | null) {
  return String(code ?? "").trim().toUpperCase();
}

function genericInvalid(errorCode: string): BetaInviteValidationResult {
  return {
    errorCode,
    valid: false,
  };
}

function isExpired(value?: string | null) {
  return value ? new Date(value).getTime() < Date.now() : false;
}

function isAssignedEmailMismatch(invite: InviteRow, email?: string | null) {
  if (!invite.assigned_email) {
    return false;
  }

  return invite.assigned_email.trim().toLowerCase() !== String(email ?? "").trim().toLowerCase();
}

function isAssignedPhoneMismatch(invite: InviteRow, phoneZalo?: string | null) {
  if (!invite.assigned_phone || !phoneZalo) {
    return false;
  }

  return invite.assigned_phone.trim() !== phoneZalo.trim();
}

async function getInviteByCode(code: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("beta_invite_codes")
    .select(
      "id,code,label,source,cohort_id,max_uses,used_count,assigned_email,assigned_phone,is_active,expires_at",
    )
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as InviteRow | null;
}

export async function validateBetaInviteCode(input: {
  code?: string | null;
  email?: string | null;
  phoneZalo?: string | null;
}): Promise<BetaInviteValidationResult> {
  const code = normalizeInviteCode(input.code);

  if (!code) {
    return genericInvalid("MISSING_INVITE_CODE");
  }

  let invite: InviteRow | null = null;

  try {
    invite = await getInviteByCode(code);
  } catch {
    return genericInvalid("INVITE_SCHEMA_NOT_READY");
  }

  if (!invite) {
    return genericInvalid("INVALID_INVITE_CODE");
  }

  const maxUses = Number(invite.max_uses ?? 1);
  const usedCount = Number(invite.used_count ?? 0);

  if (!invite.is_active) {
    return genericInvalid("INVALID_INVITE_CODE");
  }

  if (isExpired(invite.expires_at)) {
    return genericInvalid("INVALID_INVITE_CODE");
  }

  if (maxUses > 0 && usedCount >= maxUses) {
    return genericInvalid("INVALID_INVITE_CODE");
  }

  if (isAssignedEmailMismatch(invite, input.email)) {
    return genericInvalid("INVALID_INVITE_CODE");
  }

  if (isAssignedPhoneMismatch(invite, input.phoneZalo)) {
    return genericInvalid("INVALID_INVITE_CODE");
  }

  return {
    cohortId: invite.cohort_id ?? null,
    inviteCodeId: invite.id,
    label: invite.label ?? null,
    source: invite.source ?? null,
    valid: true,
  };
}

export async function redeemBetaInviteCode(input: {
  code?: string | null;
  email?: string | null;
  phoneZalo?: string | null;
  userId: string;
}) {
  const code = normalizeInviteCode(input.code);
  const invite = await getInviteByCode(code);

  if (!invite) {
    throw new Error("INVALID_INVITE_CODE");
  }

  const validation = await validateBetaInviteCode({
    code,
    email: input.email,
    phoneZalo: input.phoneZalo,
  });

  if (!validation.valid) {
    throw new Error(validation.errorCode || "INVALID_INVITE_CODE");
  }

  const supabase = createSupabaseAdminClient();
  const usedCount = Number(invite.used_count ?? 0);
  const maxUses = Number(invite.max_uses ?? 1);
  const now = new Date().toISOString();
  let updateQuery = supabase
    .from("beta_invite_codes")
    .update({
      used_count: usedCount + 1,
      updated_at: now,
    })
    .eq("id", invite.id);

  if (maxUses > 0) {
    updateQuery = updateQuery.lt("used_count", maxUses);
  }

  const { error: updateError } = await updateQuery;

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: redemptionError } = await supabase
    .from("beta_invite_redemptions")
    .insert({
      email: input.email || null,
      invite_code_id: invite.id,
      metadata: {
        cohortId: invite.cohort_id ?? null,
        label: invite.label ?? null,
        source: invite.source ?? null,
      },
      phone_zalo: input.phoneZalo || null,
      redeemed_at: now,
      user_id: input.userId,
    });

  if (redemptionError) {
    throw new Error(redemptionError.message);
  }

  if (invite.cohort_id) {
    await supabase.from("beta_cohort_members").upsert(
      {
        accepted_at: now,
        cohort_id: invite.cohort_id,
        email: input.email || null,
        invite_status: "accepted",
        user_id: input.userId,
        updated_at: now,
      },
      { onConflict: "cohort_id,user_id" },
    );
  }

  return {
    cohortId: invite.cohort_id ?? null,
    inviteCodeId: invite.id,
    label: invite.label ?? null,
    source: invite.source ?? null,
  };
}
