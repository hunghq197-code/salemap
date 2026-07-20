import {
  getSubscriptionPlan,
  isPaidSubscriptionPlanKey,
  type PaidSubscriptionPlanKey,
} from "@/lib/constants/subscription-plans";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { createNotification } from "@/lib/data/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type PaymentRequestStatus =
  | "cancelled"
  | "expired"
  | "paid"
  | "pending"
  | "rejected"
  | "waiting_confirmation";

export type PaymentRequestType = "new_subscription" | "plan_change" | "renewal";

export type PaymentRequestRecord = {
  activated_subscription_id?: string | null;
  admin_note?: string | null;
  amount_vnd: number;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  billing_period: string;
  created_at?: string | null;
  checkout_url?: string | null;
  gateway_transaction_id?: string | null;
  id: string;
  months?: number | null;
  order_code?: number | null;
  plan_key: PaidSubscriptionPlanKey;
  plan_name: string;
  proof_url?: string | null;
  provider?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  request_type?: PaymentRequestType | null;
  status: PaymentRequestStatus;
  transaction_reference?: string | null;
  transfer_content?: string | null;
  updated_at?: string | null;
  user_id: string;
  user_note?: string | null;
};

export class PaymentRequestAuthError extends Error {
  constructor() {
    super("UNAUTHENTICATED");
    this.name = "PaymentRequestAuthError";
  }
}

function getBankConfig() {
  return {
    accountName: process.env.PAYMENT_BANK_ACCOUNT_NAME || "Chưa cấu hình",
    accountNumber: process.env.PAYMENT_BANK_ACCOUNT_NUMBER || "Chưa cấu hình",
    bankName: process.env.PAYMENT_BANK_NAME || "Chưa cấu hình",
  };
}

function normalizeTransferContent(userId: string, planKey: string) {
  return `SALEMAP-${userId.slice(0, 8).toUpperCase()}-${planKey.toUpperCase()}`;
}

export function getPaymentBankInfo(row?: Partial<PaymentRequestRecord> | null) {
  const config = getBankConfig();

  return {
    accountName: row?.bank_account_name || config.accountName,
    accountNumber: row?.bank_account_number || config.accountNumber,
    bankName: row?.bank_name || config.bankName,
    transferContent: row?.transfer_content || "",
  };
}

export async function createPaymentRequest(input: {
  months?: number;
  planKey: PaidSubscriptionPlanKey;
  requestType?: PaymentRequestType;
  userNote?: string;
}) {
  const { userId } = await createAuthedSupabaseServerClient();

  return createPaymentRequestForUser(userId, input);
}

export async function createPaymentRequestForUser(
  userId: string,
  input: {
    months?: number;
    planKey: PaidSubscriptionPlanKey;
    requestType?: PaymentRequestType;
    userNote?: string;
  },
) {
  const supabase = createSupabaseAdminClient();

  if (!isPaidSubscriptionPlanKey(input.planKey)) {
    throw new Error("INVALID_PLAN");
  }

  const plan = getSubscriptionPlan(input.planKey);
  const months = Math.max(1, Math.min(12, Number(input.months ?? 1) || 1));
  const requestType = input.requestType || "new_subscription";
  const bank = getBankConfig();
  const transferContent = normalizeTransferContent(userId, plan.key);
  const { data, error } = await supabase
    .from("payment_requests")
    .insert({
      amount_vnd: plan.priceVnd * months,
      bank_account_name: bank.accountName,
      bank_account_number: bank.accountNumber,
      bank_name: bank.bankName,
      billing_period: plan.billingPeriod,
      months,
      plan_key: plan.key,
      plan_name: plan.name,
      request_type: requestType,
      status: "pending",
      transfer_content: transferContent,
      user_id: userId,
      user_note: input.userNote || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await createNotification({
    actionUrl: `/app/billing/payment/${data.id}`,
    content: "Vui lòng chuyển khoản theo nội dung hiển thị để SaleMap có thể xác nhận nhanh.",
    metadata: {
      amountVnd: plan.priceVnd * months,
      months,
      planKey: plan.key,
      requestType,
      status: "pending",
    },
    title: requestType === "renewal"
      ? "Yêu cầu gia hạn đã được tạo"
      : "Yêu cầu nâng cấp đã được tạo",
    type: "payment_request_created",
    userId,
  });

  return data as PaymentRequestRecord;
}

export async function getMyPaymentRequests() {
  const { userId } = await createAuthedSupabaseServerClient();

  return getPaymentRequestsForUser(userId);
}

export async function getPaymentRequestsForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return [] as PaymentRequestRecord[];
  }

  return (data ?? []) as PaymentRequestRecord[];
}

export async function getPaymentRequestById(id: string) {
  const { userId } = await createAuthedSupabaseServerClient();

  return getPaymentRequestByIdForUser(userId, id);
}

export async function getPaymentRequestByIdForUser(userId: string, id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PaymentRequestRecord;
}

export async function updateMyPaymentRequest(
  id: string,
  input: {
    proofUrl?: string;
    status?: "cancelled" | "waiting_confirmation";
    transactionReference?: string;
    userNote?: string;
  },
) {
  const { userId } = await createAuthedSupabaseServerClient();

  return updatePaymentRequestForUser(userId, id, input);
}

export async function updatePaymentRequestForUser(
  userId: string,
  id: string,
  input: {
    proofUrl?: string;
    status?: "cancelled" | "waiting_confirmation";
    transactionReference?: string;
    userNote?: string;
  },
) {
  const supabase = createSupabaseAdminClient();
  const payload: Record<string, string | null> = {
    proof_url: input.proofUrl || null,
    transaction_reference: input.transactionReference || null,
    updated_at: new Date().toISOString(),
    user_note: input.userNote || null,
  };

  if (input.status) {
    payload.status = input.status;
  }

  const { data, error } = await supabase
    .from("payment_requests")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .in("status", ["pending", "waiting_confirmation"])
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "PAYMENT_REQUEST_UPDATE_FAILED");
  }

  if (input.status === "waiting_confirmation") {
    await createNotification({
      actionUrl: `/app/billing/payment/${id}`,
      content: "Chúng tôi đã ghi nhận thông tin chuyển khoản và sẽ kiểm tra thủ công.",
      metadata: {
        planKey: data.plan_key,
        status: "waiting_confirmation",
      },
      title: "Chúng tôi đang chờ xác nhận thanh toán",
      type: "payment_waiting_confirmation",
      userId,
    });
  }

  return data as PaymentRequestRecord;
}

export async function cancelMyPaymentRequest(id: string) {
  return updateMyPaymentRequest(id, { status: "cancelled" });
}
