import {
  getSubscriptionPlan,
  isPaidSubscriptionPlanKey,
  type PaidSubscriptionPlanKey,
} from "@/lib/constants/subscription-plans";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { createNotification } from "@/lib/data/notifications";
import type {
  PaymentRequestRecord,
  PaymentRequestType,
} from "@/lib/data/payment-requests";
import {
  activateSubscriptionForUser,
  renewSubscriptionForUser,
} from "@/lib/data/subscriptions";
import { generateOrderCode } from "@/lib/payments/order-code";
import {
  createPayOSPaymentLink,
  getPayOSPaymentLinkInfo,
  verifyPayOSWebhookSignature,
  type PayOSWebhookPayload,
} from "@/lib/providers/payments";
import { getSiteUrl } from "@/lib/site-url";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type PaymentGatewayTransactionStatus =
  | "cancelled"
  | "expired"
  | "failed"
  | "paid"
  | "pending"
  | "unknown";

export type PaymentGatewayTransactionRecord = {
  amount_vnd: number;
  billing_period?: string | null;
  cancel_url?: string | null;
  cancelled_at?: string | null;
  checkout_url?: string | null;
  created_at?: string | null;
  expired_at?: string | null;
  id: string;
  months?: number | null;
  order_code: number;
  paid_at?: string | null;
  payment_link_id?: string | null;
  payment_request_id?: string | null;
  plan_key: PaidSubscriptionPlanKey;
  plan_name: string;
  provider: "payos" | string;
  provider_reference?: string | null;
  provider_status?: string | null;
  provider_transaction_datetime?: string | null;
  qr_code?: string | null;
  raw_create_response?: unknown;
  raw_status_response?: unknown;
  raw_webhook_payload?: unknown;
  return_url?: string | null;
  status: PaymentGatewayTransactionStatus;
  subscription_id?: string | null;
  updated_at?: string | null;
  user_id: string;
};

export class InvalidPayOSWebhookSignatureError extends Error {
  constructor() {
    super("INVALID_PAYOS_WEBHOOK_SIGNATURE");
    this.name = "InvalidPayOSWebhookSignatureError";
  }
}

function clampMonths(value?: number) {
  return Math.max(1, Math.min(12, Number(value ?? 1) || 1));
}

function buildPaymentUrl(path: string, orderCode: number) {
  const url = new URL(path, getSiteUrl());
  url.searchParams.set("orderCode", String(orderCode));

  return url.toString();
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function responseData(value: unknown) {
  const root = toRecord(value);
  const data = root.data;

  return toRecord(data && typeof data === "object" ? data : root);
}

function firstProviderTransaction(data: Record<string, unknown>) {
  const transactions = data.transactions;

  if (Array.isArray(transactions) && transactions[0]) {
    return toRecord(transactions[0]);
  }

  return {};
}

function textFrom(...values: unknown[]) {
  const value = values.find((item) => item !== undefined && item !== null && item !== "");

  return value === undefined || value === null ? null : String(value);
}

function numberFrom(...values: unknown[]) {
  const value = values.find((item) => item !== undefined && item !== null && item !== "");
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function statusFromProviderStatus(providerStatus?: string | null) {
  const value = String(providerStatus || "").toLowerCase();

  if (["00", "paid", "success", "successful"].includes(value)) {
    return "paid" satisfies PaymentGatewayTransactionStatus;
  }

  if (value.includes("cancel")) {
    return "cancelled" satisfies PaymentGatewayTransactionStatus;
  }

  if (value.includes("expire")) {
    return "expired" satisfies PaymentGatewayTransactionStatus;
  }

  if (value.includes("fail") || value.includes("error")) {
    return "failed" satisfies PaymentGatewayTransactionStatus;
  }

  if (value.includes("pending") || value.includes("processing")) {
    return "pending" satisfies PaymentGatewayTransactionStatus;
  }

  return "unknown" satisfies PaymentGatewayTransactionStatus;
}

function extractProviderInfo(raw: unknown) {
  const data = responseData(raw);
  const transaction = firstProviderTransaction(data);
  const providerStatus = textFrom(
    data.status,
    data.code,
    transaction.status,
    transaction.code,
  );

  return {
    amountVnd: numberFrom(
      data.amount,
      data.amountPaid,
      data.totalAmount,
      transaction.amount,
      transaction.amountPaid,
    ),
    orderCode: numberFrom(data.orderCode, transaction.orderCode),
    paymentLinkId: textFrom(data.paymentLinkId, data.id, transaction.paymentLinkId),
    providerReference: textFrom(data.reference, transaction.reference),
    providerStatus,
    providerTransactionDatetime: textFrom(
      data.transactionDateTime,
      data.transactionDatetime,
      transaction.transactionDateTime,
      transaction.transactionDatetime,
    ),
    status: statusFromProviderStatus(providerStatus),
  };
}

function sanitizePayOSWebhookPayload(payload: PayOSWebhookPayload) {
  const data = toRecord(payload.data);

  return {
    code: payload.code,
    data: {
      amount: numberFrom(data.amount, data.amountPaid, data.totalAmount),
      orderCode: numberFrom(data.orderCode),
      paymentLinkId: textFrom(data.paymentLinkId),
      providerStatus: textFrom(data.code, data.status),
      reference: textFrom(data.reference),
    },
    desc: payload.desc,
    success: payload.success,
  };
}

async function generateUniqueOrderCode() {
  const supabase = createSupabaseAdminClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const orderCode = generateOrderCode();
    const { data, error } = await supabase
      .from("payment_gateway_transactions")
      .select("id")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return orderCode;
    }
  }

  throw new Error("ORDER_CODE_GENERATION_FAILED");
}

async function getPaymentRequestById(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PaymentRequestRecord;
}

async function getTransactionById(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_gateway_transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PaymentGatewayTransactionRecord;
}

async function getTransactionByOrderCode(orderCode: number) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_gateway_transactions")
    .select("*")
    .eq("order_code", orderCode)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PaymentGatewayTransactionRecord;
}

async function markTransactionFailed(input: {
  paymentRequestId?: string | null;
  rawStatusResponse?: unknown;
  rawWebhookPayload?: unknown;
  reason: string;
  transactionId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  await supabase
    .from("payment_gateway_transactions")
    .update({
      provider_status: input.reason,
      raw_status_response: input.rawStatusResponse,
      raw_webhook_payload: input.rawWebhookPayload,
      status: "failed",
      updated_at: now,
    })
    .eq("id", input.transactionId);

  if (input.paymentRequestId) {
    await supabase
      .from("payment_requests")
      .update({
        admin_note: input.reason,
        status: "rejected",
        updated_at: now,
      })
      .eq("id", input.paymentRequestId)
      .neq("status", "paid");
  }
}

async function completePaidTransaction(
  transaction: PaymentGatewayTransactionRecord,
  input: {
    amountVnd?: number | null;
    providerReference?: string | null;
    providerStatus?: string | null;
    providerTransactionDatetime?: string | null;
    rawStatusResponse?: unknown;
    rawWebhookPayload?: unknown;
  },
) {
  const supabase = createSupabaseAdminClient();
  const freshTransaction = await getTransactionById(transaction.id);

  if (freshTransaction?.status === "paid" && freshTransaction.subscription_id) {
    return freshTransaction;
  }

  const paymentRequest = transaction.payment_request_id
    ? await getPaymentRequestById(transaction.payment_request_id)
    : null;

  if (!paymentRequest) {
    await markTransactionFailed({
      paymentRequestId: transaction.payment_request_id,
      rawStatusResponse: input.rawStatusResponse,
      rawWebhookPayload: input.rawWebhookPayload,
      reason: "PAYMENT_REQUEST_NOT_FOUND",
      transactionId: transaction.id,
    });
    throw new Error("PAYMENT_REQUEST_NOT_FOUND");
  }

  if (
    Number(input.amountVnd ?? transaction.amount_vnd) !== Number(transaction.amount_vnd) ||
    Number(paymentRequest.amount_vnd) !== Number(transaction.amount_vnd)
  ) {
    await markTransactionFailed({
      paymentRequestId: paymentRequest.id,
      rawStatusResponse: input.rawStatusResponse,
      rawWebhookPayload: input.rawWebhookPayload,
      reason: "PAYMENT_AMOUNT_MISMATCH",
      transactionId: transaction.id,
    });
    throw new Error("PAYMENT_AMOUNT_MISMATCH");
  }

  const requestType = paymentRequest.request_type || "new_subscription";
  const months = clampMonths(paymentRequest.months ?? transaction.months ?? 1);
  const subscription =
    requestType === "renewal"
      ? await renewSubscriptionForUser({
          amountVnd: paymentRequest.amount_vnd,
          months,
          note: "payos",
          paymentMethod: "payos",
          paymentRequestId: paymentRequest.id,
          planKey: paymentRequest.plan_key,
          userId: paymentRequest.user_id,
        })
      : await activateSubscriptionForUser({
          amountVnd: paymentRequest.amount_vnd,
          months,
          note: requestType === "plan_change" ? "payos_plan_change" : "payos",
          paymentMethod: "payos",
          paymentRequestId: paymentRequest.id,
          planKey: paymentRequest.plan_key,
          userId: paymentRequest.user_id,
        });

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("payment_gateway_transactions")
    .update({
      paid_at: now,
      provider_reference: input.providerReference ?? transaction.provider_reference ?? null,
      provider_status: input.providerStatus ?? "paid",
      provider_transaction_datetime:
        input.providerTransactionDatetime ??
        transaction.provider_transaction_datetime ??
        null,
      raw_status_response: input.rawStatusResponse,
      raw_webhook_payload: input.rawWebhookPayload,
      status: "paid",
      subscription_id: subscription.id ?? null,
      updated_at: now,
    })
    .eq("id", transaction.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("payment_requests")
    .update({
      activated_subscription_id: subscription.id ?? null,
      provider: "payos",
      reviewed_at: now,
      status: "paid",
      updated_at: now,
    })
    .eq("id", paymentRequest.id);

  await createNotification({
    actionUrl: "/app/billing",
    content: `Gói ${subscription.plan_name} của bạn đã được kích hoạt tự động sau khi payOS xác nhận thanh toán.`,
    metadata: {
      amountVnd: paymentRequest.amount_vnd,
      months,
      planKey: subscription.plan_key,
      provider: "payos",
      requestType,
      status: "active",
    },
    title: `Gói ${subscription.plan_name} đã được kích hoạt`,
    type: "subscription_activated",
    userId: paymentRequest.user_id,
  });

  return data as PaymentGatewayTransactionRecord;
}

export async function createPayOSCheckoutTransactionForUser(
  userId: string,
  input: {
    buyerEmail?: string;
    buyerName?: string;
    months?: number;
    planKey: PaidSubscriptionPlanKey;
    requestType?: PaymentRequestType;
  },
) {
  if (!isPaidSubscriptionPlanKey(input.planKey)) {
    throw new Error("INVALID_PLAN");
  }

  const supabase = createSupabaseAdminClient();
  const plan = getSubscriptionPlan(input.planKey);
  const months = clampMonths(input.months);
  const requestType = input.requestType || "new_subscription";
  const amountVnd = plan.priceVnd * months;
  const orderCode = await generateUniqueOrderCode();
  const returnUrl = buildPaymentUrl("/app/billing/payment/return", orderCode);
  const cancelUrl = buildPaymentUrl("/app/billing/payment/cancel", orderCode);
  const now = new Date().toISOString();
  const { data: paymentRequest, error: paymentRequestError } = await supabase
    .from("payment_requests")
    .insert({
      amount_vnd: amountVnd,
      billing_period: plan.billingPeriod,
      months,
      order_code: orderCode,
      plan_key: plan.key,
      plan_name: plan.name,
      provider: "payos",
      request_type: requestType,
      status: "pending",
      transfer_content: `PAYOS-${orderCode}`,
      user_id: userId,
    })
    .select("*")
    .single();

  if (paymentRequestError) {
    throw new Error(paymentRequestError.message);
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("payment_gateway_transactions")
    .insert({
      amount_vnd: amountVnd,
      billing_period: plan.billingPeriod,
      cancel_url: cancelUrl,
      months,
      order_code: orderCode,
      payment_request_id: paymentRequest.id,
      plan_key: plan.key,
      plan_name: plan.name,
      provider: "payos",
      return_url: returnUrl,
      status: "pending",
      user_id: userId,
    })
    .select("*")
    .single();

  if (transactionError) {
    throw new Error(transactionError.message);
  }

  try {
    const result = await createPayOSPaymentLink({
      amountVnd,
      buyerEmail: input.buyerEmail,
      buyerName: input.buyerName,
      cancelUrl,
      description: `SLM ${plan.key.toUpperCase()} ${orderCode}`,
      orderCode,
      paymentRequestId: paymentRequest.id,
      planKey: plan.key,
      planName: plan.name,
      returnUrl,
      userId,
    });

    const { data: updatedTransaction, error: updateTransactionError } = await supabase
      .from("payment_gateway_transactions")
      .update({
        checkout_url: result.checkoutUrl,
        payment_link_id: result.paymentLinkId ?? null,
        provider_status: result.status ?? null,
        qr_code: result.qrCode ?? null,
        raw_create_response: result.raw,
        updated_at: now,
      })
      .eq("id", transaction.id)
      .select("*")
      .single();

    if (updateTransactionError) {
      throw new Error(updateTransactionError.message);
    }

    await supabase
      .from("payment_requests")
      .update({
        checkout_url: result.checkoutUrl,
        gateway_transaction_id: transaction.id,
        order_code: orderCode,
        provider: "payos",
        updated_at: now,
      })
      .eq("id", paymentRequest.id);

    await createNotification({
      actionUrl: `/app/billing/payment/return?orderCode=${orderCode}`,
      content: "SaleMap đã tạo liên kết thanh toán payOS cho gói bạn chọn.",
      metadata: {
        amountVnd,
        months,
        planKey: plan.key,
        provider: "payos",
        requestType,
        status: "pending",
      },
      title: "Liên kết thanh toán payOS đã sẵn sàng",
      type: "payment_gateway_transaction_created",
      userId,
    });

    return {
      checkoutUrl: result.checkoutUrl,
      orderCode,
      paymentRequest: paymentRequest as PaymentRequestRecord,
      transaction: updatedTransaction as PaymentGatewayTransactionRecord,
    };
  } catch (error) {
    await supabase
      .from("payment_gateway_transactions")
      .update({
        provider_status: "create_failed",
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);
    await supabase
      .from("payment_requests")
      .update({
        admin_note: "PAYOS_CREATE_PAYMENT_LINK_FAILED",
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRequest.id)
      .neq("status", "paid");

    throw error;
  }
}

export async function getPaymentGatewayTransactionsForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_gateway_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return [] as PaymentGatewayTransactionRecord[];
  }

  return (data ?? []) as PaymentGatewayTransactionRecord[];
}

export async function getMyPaymentGatewayTransactions() {
  const { userId } = await createAuthedSupabaseServerClient();

  return getPaymentGatewayTransactionsForUser(userId);
}

export async function getPaymentGatewayTransactionByOrderCodeForCurrentUser(
  orderCode: number,
) {
  const { userId } = await createAuthedSupabaseServerClient();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_gateway_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("order_code", orderCode)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PaymentGatewayTransactionRecord;
}

export async function syncPayOSGatewayTransaction(input: {
  orderCode?: number;
  transactionId?: string;
  userId?: string;
}) {
  const transaction = input.transactionId
    ? await getTransactionById(input.transactionId)
    : input.orderCode
      ? await getTransactionByOrderCode(input.orderCode)
      : null;

  if (!transaction) {
    throw new Error("PAYMENT_GATEWAY_TRANSACTION_NOT_FOUND");
  }

  if (input.userId && transaction.user_id !== input.userId) {
    throw new Error("PAYMENT_GATEWAY_TRANSACTION_NOT_FOUND");
  }

  if (transaction.status === "paid" && transaction.subscription_id) {
    return transaction;
  }

  const rawStatusResponse = await getPayOSPaymentLinkInfo(
    transaction.payment_link_id || transaction.order_code,
  );
  const providerInfo = extractProviderInfo(rawStatusResponse);
  const nextStatus =
    providerInfo.status === "unknown" ? transaction.status : providerInfo.status;

  if (nextStatus === "paid") {
    return completePaidTransaction(transaction, {
      amountVnd: providerInfo.amountVnd ?? transaction.amount_vnd,
      providerReference: providerInfo.providerReference,
      providerStatus: providerInfo.providerStatus,
      providerTransactionDatetime: providerInfo.providerTransactionDatetime,
      rawStatusResponse,
    });
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("payment_gateway_transactions")
    .update({
      cancelled_at: nextStatus === "cancelled" ? now : transaction.cancelled_at,
      expired_at: nextStatus === "expired" ? now : transaction.expired_at,
      payment_link_id: providerInfo.paymentLinkId ?? transaction.payment_link_id ?? null,
      provider_reference:
        providerInfo.providerReference ?? transaction.provider_reference ?? null,
      provider_status: providerInfo.providerStatus ?? transaction.provider_status ?? null,
      provider_transaction_datetime:
        providerInfo.providerTransactionDatetime ??
        transaction.provider_transaction_datetime ??
        null,
      raw_status_response: rawStatusResponse,
      status: nextStatus,
      updated_at: now,
    })
    .eq("id", transaction.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (["cancelled", "expired", "failed"].includes(nextStatus)) {
    await supabase
      .from("payment_requests")
      .update({
        status: nextStatus === "failed" ? "rejected" : nextStatus,
        updated_at: now,
      })
      .eq("id", transaction.payment_request_id)
      .neq("status", "paid");
  }

  return data as PaymentGatewayTransactionRecord;
}

export async function cancelPayOSGatewayTransactionForCurrentUser(orderCode: number) {
  const { userId } = await createAuthedSupabaseServerClient();
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("payment_gateway_transactions")
    .update({
      cancelled_at: now,
      provider_status: "user_cancelled",
      status: "cancelled",
      updated_at: now,
    })
    .eq("user_id", userId)
    .eq("order_code", orderCode)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.payment_request_id) {
    await supabase
      .from("payment_requests")
      .update({
        status: "cancelled",
        updated_at: now,
      })
      .eq("id", data.payment_request_id)
      .eq("status", "pending");
  }

  return (data as PaymentGatewayTransactionRecord | null) ?? null;
}

export async function handlePayOSWebhook(payload: PayOSWebhookPayload) {
  if (!verifyPayOSWebhookSignature(payload)) {
    throw new InvalidPayOSWebhookSignatureError();
  }

  const safeWebhookPayload = sanitizePayOSWebhookPayload(payload);
  const providerInfo = extractProviderInfo(payload);
  const orderCode = numberFrom(payload.data?.orderCode, providerInfo.orderCode);

  if (!orderCode) {
    return {
      action: "ignored",
      reason: "MISSING_ORDER_CODE",
    };
  }

  const transaction = await getTransactionByOrderCode(orderCode);

  if (!transaction) {
    return {
      action: "ignored",
      orderCode,
      reason: "TRANSACTION_NOT_FOUND",
    };
  }

  const webhookCode = textFrom(payload.data?.code, payload.code);
  const isPaid =
    payload.success === true &&
    (webhookCode === "00" || providerInfo.status === "paid");

  if (isPaid) {
    const paid = await completePaidTransaction(transaction, {
      amountVnd: providerInfo.amountVnd ?? transaction.amount_vnd,
      providerReference: providerInfo.providerReference,
      providerStatus: webhookCode || providerInfo.providerStatus || "paid",
      providerTransactionDatetime: providerInfo.providerTransactionDatetime,
      rawWebhookPayload: safeWebhookPayload,
    });

    return {
      action: "paid",
      transaction: paid,
    };
  }

  const status =
    providerInfo.status === "unknown"
      ? payload.success === false
        ? "failed"
        : "unknown"
      : providerInfo.status;
  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_gateway_transactions")
    .update({
      cancelled_at: status === "cancelled" ? now : transaction.cancelled_at,
      expired_at: status === "expired" ? now : transaction.expired_at,
      provider_reference:
        providerInfo.providerReference ?? transaction.provider_reference ?? null,
      provider_status: webhookCode || providerInfo.providerStatus || status,
      provider_transaction_datetime:
        providerInfo.providerTransactionDatetime ??
        transaction.provider_transaction_datetime ??
        null,
      raw_webhook_payload: safeWebhookPayload,
      status,
      updated_at: now,
    })
    .eq("id", transaction.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (["cancelled", "expired", "failed"].includes(status)) {
    await supabase
      .from("payment_requests")
      .update({
        status: status === "failed" ? "rejected" : status,
        updated_at: now,
      })
      .eq("id", transaction.payment_request_id)
      .neq("status", "paid");
  }

  return {
    action: status,
    transaction: data as PaymentGatewayTransactionRecord,
  };
}
