import type { SubscriptionEventType } from "@/lib/constants/subscription-lifecycle";
import type { SubscriptionPlanKey } from "@/lib/constants/subscription-plans";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type SubscriptionEventRecord = {
  amount_vnd?: number | null;
  created_at?: string | null;
  created_by?: string | null;
  event_type: SubscriptionEventType;
  from_plan_key?: string | null;
  id: string;
  months?: number | null;
  new_period_end?: string | null;
  new_period_start?: string | null;
  note?: string | null;
  payment_request_id?: string | null;
  previous_period_end?: string | null;
  subscription_id?: string | null;
  to_plan_key?: string | null;
  user_id: string;
};

export async function createSubscriptionEvent(input: {
  amountVnd?: number | null;
  createdBy?: string | null;
  eventType: SubscriptionEventType;
  fromPlanKey?: string | null;
  months?: number | null;
  newPeriodEnd?: string | null;
  newPeriodStart?: string | null;
  note?: string | null;
  paymentRequestId?: string | null;
  previousPeriodEnd?: string | null;
  subscriptionId?: string | null;
  toPlanKey?: SubscriptionPlanKey | string | null;
  userId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscription_events")
    .insert({
      amount_vnd: input.amountVnd ?? null,
      created_by: input.createdBy ?? null,
      event_type: input.eventType,
      from_plan_key: input.fromPlanKey ?? null,
      months: input.months ?? 1,
      new_period_end: input.newPeriodEnd ?? null,
      new_period_start: input.newPeriodStart ?? null,
      note: input.note ?? null,
      payment_request_id: input.paymentRequestId ?? null,
      previous_period_end: input.previousPeriodEnd ?? null,
      subscription_id: input.subscriptionId ?? null,
      to_plan_key: input.toPlanKey ?? null,
      user_id: input.userId,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as SubscriptionEventRecord;
}

export async function getMySubscriptionEvents() {
  const { userId } = await createAuthedSupabaseServerClient();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscription_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return [] as SubscriptionEventRecord[];
  }

  return (data ?? []) as SubscriptionEventRecord[];
}

export async function getSubscriptionEventsForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscription_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return [] as SubscriptionEventRecord[];
  }

  return (data ?? []) as SubscriptionEventRecord[];
}
