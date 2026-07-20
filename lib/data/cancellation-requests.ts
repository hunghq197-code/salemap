import type { CancellationReasonType } from "@/lib/constants/subscription-lifecycle";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type CancellationRequestStatus =
  | "cancelled"
  | "closed"
  | "new"
  | "resolved"
  | "retained"
  | "reviewing";

export type CancellationRequestRecord = {
  admin_note?: string | null;
  created_at?: string | null;
  id: string;
  reason_detail?: string | null;
  reason_type: CancellationReasonType | string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  status: CancellationRequestStatus;
  subscription_id?: string | null;
  updated_at?: string | null;
  user_id: string;
  would_return_if?: string | null;
};

export async function getMyCancellationRequests() {
  const { userId } = await createAuthedSupabaseServerClient();

  return getCancellationRequestsForUser(userId);
}

export async function getCancellationRequestsForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cancellation_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return [] as CancellationRequestRecord[];
  }

  return (data ?? []) as CancellationRequestRecord[];
}

export async function listCancellationRequests(limit = 500) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cancellation_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      items: [] as CancellationRequestRecord[],
      schemaReady: false,
    };
  }

  return {
    items: (data ?? []) as CancellationRequestRecord[],
    schemaReady: true,
  };
}

export async function updateCancellationRequestReview(input: {
  adminNote?: string;
  adminUserId: string;
  id: string;
  status: CancellationRequestStatus;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("cancellation_requests")
    .update({
      admin_note: input.adminNote || null,
      reviewed_at: now,
      reviewed_by: input.adminUserId,
      status: input.status,
      updated_at: now,
    })
    .eq("id", input.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "CANCELLATION_UPDATE_FAILED");
  }

  return data as CancellationRequestRecord;
}
