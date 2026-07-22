import "server-only";

import { writeAdminAuditLog, writeSecurityEvent } from "@/lib/admin/audit-log";
import type { AdminContext } from "@/lib/admin/auth";
import { BillingError } from "@/lib/billing/billing-errors";
import {
  getPlanById,
  getPlanPrice,
  isPaidPlan,
  normalizePlanId,
} from "@/lib/billing/plans";
import { manualBankProvider, vietQrManualProvider } from "@/lib/billing/providers/manual-bank";
import {
  isPayOSWebhookPayload,
  payOSProvider,
} from "@/lib/billing/providers/payos";
import { activateSubscriptionFromPayment } from "@/lib/billing/subscriptions";
import type {
  BillingPaymentRecord,
  BillingPeriod,
  BillingProvider,
  CreatePaymentInput,
  NormalizedWebhookResult,
  PaymentProviderId,
  PaymentStatus,
  SafeBillingPayment,
} from "@/lib/billing/types";
import { createNotification } from "@/lib/data/notifications";
import { generateOrderCode } from "@/lib/payments/order-code";
import { getSiteUrl } from "@/lib/site-url";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const MANUAL_PROVIDERS = new Set<PaymentProviderId>([
  "manual_bank_transfer",
  "vietqr_manual",
]);

const FINAL_PAYMENT_STATUSES = new Set<PaymentStatus>([
  "cancelled",
  "failed",
  "paid",
  "refunded",
]);

function isBillingEnabled() {
  return process.env.BILLING_ENABLED !== "false";
}

function uniqueValues<T extends string>(values: T[]) {
  return Array.from(new Set(values));
}

export function getAllowedBillingProviders(): PaymentProviderId[] {
  const raw = process.env.BILLING_ALLOWED_PROVIDERS?.trim();
  const values = raw
    ? raw.split(",").map((value) => value.trim()).filter(Boolean)
    : ["manual_bank_transfer", "vietqr_manual", "payos"];
  const allowed = values.filter((value): value is PaymentProviderId =>
    value === "manual_bank_transfer" || value === "vietqr_manual" || value === "payos",
  );

  return uniqueValues(allowed.length ? allowed : ["manual_bank_transfer"]);
}

export function isBillingProviderEnabled(provider: PaymentProviderId) {
  if (!isBillingEnabled() || !getAllowedBillingProviders().includes(provider)) {
    return false;
  }

  if (provider === "payos") {
    return process.env.PAYOS_ENABLED === "true" || process.env.PAYMENT_PROVIDER === "payos";
  }

  if (provider === "vietqr_manual") {
    return process.env.VIETQR_ENABLED !== "false";
  }

  return true;
}

export function getBillingProvider(provider: PaymentProviderId): BillingProvider {
  if (!isBillingProviderEnabled(provider)) {
    throw new BillingError("INVALID_PAYMENT_METHOD", 400);
  }

  if (provider === "manual_bank_transfer") {
    return manualBankProvider;
  }

  if (provider === "vietqr_manual") {
    return vietQrManualProvider;
  }

  return payOSProvider;
}

function getDefaultProvider() {
  const configured = process.env.BILLING_DEFAULT_PROVIDER?.trim();

  if (
    configured === "manual_bank_transfer" ||
    configured === "vietqr_manual" ||
    configured === "payos"
  ) {
    return configured;
  }

  return "manual_bank_transfer" satisfies PaymentProviderId;
}

function buildBillingUrl(path: string, paymentId: string, orderCode: number) {
  const url = new URL(path, getSiteUrl());
  url.searchParams.set("paymentId", paymentId);
  url.searchParams.set("orderCode", String(orderCode));

  return url.toString();
}

async function generateUniqueBillingOrderCode() {
  const supabase = createSupabaseAdminClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const orderCode = generateOrderCode();
    const { data, error } = await supabase
      .from("payments")
      .select("id")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (error) {
      throw new BillingError("BILLING_NOT_CONFIGURED", 503);
    }

    if (!data) {
      return orderCode;
    }
  }

  throw new Error("ORDER_CODE_GENERATION_FAILED");
}

function safeProviderPayload(payload?: Record<string, unknown> | null) {
  if (!payload) {
    return {};
  }

  const allowedKeys = [
    "code",
    "desc",
    "orderCode",
    "paymentLinkId",
    "providerStatus",
    "success",
  ];

  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.includes(key)),
  );
}

async function createPaymentEvent(input: {
  eventType: string;
  orderCode?: number | null;
  paymentId?: string | null;
  paymentLinkId?: string | null;
  processingError?: string | null;
  processed?: boolean;
  provider?: string | null;
  safeEvent?: Record<string, unknown>;
  transactionReference?: string | null;
  userId?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("payment_events").insert({
    event_type: input.eventType,
    order_code: input.orderCode ?? null,
    payment_id: input.paymentId ?? null,
    payment_link_id: input.paymentLinkId ?? null,
    processed: input.processed ?? false,
    processing_error: input.processingError ?? null,
    provider: input.provider ?? null,
    raw_event: {},
    safe_event: input.safeEvent ?? {},
    transaction_reference: input.transactionReference ?? null,
    user_id: input.userId ?? null,
  });
}

export function toSafeBillingPayment(payment: BillingPaymentRecord): SafeBillingPayment {
  return {
    amount: payment.amount,
    bankInfo:
      payment.bank_name || payment.bank_account_number || payment.bank_account_name
        ? {
            accountName: payment.bank_account_name ?? null,
            accountNumber: payment.bank_account_number ?? null,
            bankName: payment.bank_name ?? null,
          }
        : undefined,
    billingPeriod: payment.billing_period || "monthly",
    checkoutUrl: payment.checkout_url ?? null,
    createdAt: payment.created_at ?? null,
    currency: payment.currency || "VND",
    id: payment.id,
    orderCode: payment.order_code,
    paidAt: payment.paid_at ?? null,
    paymentCode: payment.payment_code ?? null,
    paymentLinkId: payment.payment_link_id ?? null,
    planId: normalizePlanId(payment.plan_id),
    provider: payment.provider,
    qrCode: payment.qr_code ?? null,
    status: payment.status,
    transferContent: payment.transfer_content ?? null,
    userConfirmedTransferAt: payment.user_confirmed_transfer_at ?? null,
  };
}

export async function createPayment(input: {
  billingPeriod?: BillingPeriod;
  planId: string;
  provider?: PaymentProviderId;
  userId: string;
}) {
  if (!isBillingEnabled()) {
    throw new BillingError("BILLING_DISABLED", 503);
  }

  const planId = normalizePlanId(input.planId);
  const billingPeriod = input.billingPeriod || "monthly";

  if (!isPaidPlan(planId)) {
    throw new BillingError("INVALID_PLAN", 400);
  }

  if (billingPeriod !== "monthly") {
    throw new BillingError("VALIDATION_ERROR", 400);
  }

  const providerId = input.provider || getDefaultProvider();
  const provider = getBillingProvider(providerId);
  const plan = getPlanById(planId);
  const amount = getPlanPrice(plan.id, billingPeriod);
  const orderCode = await generateUniqueBillingOrderCode();
  const paymentCode = `SALEMAP-${orderCode}`;
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabase
    .from("payments")
    .insert({
      amount,
      billing_period: billingPeriod,
      currency: "VND",
      description: `SaleMap ${plan.name}`,
      order_code: orderCode,
      payment_code: paymentCode,
      plan_id: plan.id,
      provider: providerId,
      status: "pending",
      user_id: input.userId,
    })
    .select("*")
    .single();

  if (insertError) {
    throw new BillingError("PAYMENT_CREATE_FAILED", 500);
  }

  const payment = inserted as BillingPaymentRecord;
  const providerInput: CreatePaymentInput = {
    amount,
    billingPeriod,
    cancelUrl: buildBillingUrl(
      process.env.BILLING_CANCEL_PATH || "/app/billing/cancel",
      payment.id,
      orderCode,
    ),
    currency: "VND",
    description: `SLM ${plan.id.toUpperCase()} ${orderCode}`.slice(0, 25),
    orderCode,
    planId: plan.id,
    provider: providerId,
    returnUrl: buildBillingUrl(
      process.env.BILLING_RETURN_PATH || "/app/billing/success",
      payment.id,
      orderCode,
    ),
    userId: input.userId,
  };

  try {
    const result = await provider.createPayment(providerInput);
    const { data: updated, error: updateError } = await supabase
      .from("payments")
      .update({
        bank_account_name: result.bankAccountName ?? null,
        bank_account_number: result.bankAccountNumber ?? null,
        bank_name: result.bankName ?? null,
        checkout_url: result.checkoutUrl ?? null,
        payment_link_id: result.paymentLinkId ?? null,
        provider_payload: safeProviderPayload(result.providerPayload),
        qr_code: result.qrCode ?? null,
        transfer_content: result.transferContent ?? null,
        updated_at: now,
      })
      .eq("id", payment.id)
      .select("*")
      .single();

    if (updateError) {
      throw new BillingError("PAYMENT_CREATE_FAILED", 500);
    }

    await createPaymentEvent({
      eventType: providerId === "payos" ? "checkout_created" : "manual_payment_created",
      orderCode,
      paymentId: payment.id,
      paymentLinkId: result.paymentLinkId ?? null,
      processed: true,
      provider: providerId,
      safeEvent: {
        amount,
        planId: plan.id,
        provider: providerId,
      },
      userId: input.userId,
    });

    await createNotification({
      actionUrl: `/app/billing/checkout?paymentId=${payment.id}`,
      content:
        providerId === "payos"
          ? "SaleMap đã tạo checkout thanh toán tự động cho gói bạn chọn."
          : "Vui lòng chuyển khoản đúng số tiền và nội dung để SaleMap xác nhận nhanh.",
      metadata: {
        amount,
        planId: plan.id,
        provider: providerId,
        status: "pending",
      },
      title: "Yêu cầu thanh toán đã được tạo",
      type: "payment_created",
      userId: input.userId,
    });

    return updated as BillingPaymentRecord;
  } catch (error) {
    await supabase
      .from("payments")
      .update({
        failed_at: new Date().toISOString(),
        failure_reason: error instanceof BillingError ? error.code : "PROVIDER_CREATE_FAILED",
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    throw error;
  }
}

export async function getPaymentByIdForUser(paymentId: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as BillingPaymentRecord;
}

export async function getPaymentsForUser(userId: string, limit = 10) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [] as BillingPaymentRecord[];
  }

  return (data ?? []) as BillingPaymentRecord[];
}

export async function getPaymentByOrderCode(orderCode: number) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("order_code", orderCode)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as BillingPaymentRecord;
}

export async function getPaymentByOrderCodeForUser(orderCode: number, userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("order_code", orderCode)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as BillingPaymentRecord;
}

export async function getPaymentById(paymentId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as BillingPaymentRecord;
}

export async function markPaymentWaitingConfirmation(paymentId: string, userId: string) {
  const payment = await getPaymentByIdForUser(paymentId, userId);

  if (!payment) {
    throw new BillingError("NOT_FOUND", 404);
  }

  if (!MANUAL_PROVIDERS.has(payment.provider as PaymentProviderId)) {
    throw new BillingError("INVALID_PAYMENT_METHOD", 400);
  }

  if (payment.status !== "pending") {
    throw new BillingError("PAYMENT_ALREADY_FINAL", 409);
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("payments")
    .update({
      status: "waiting_confirmation",
      updated_at: now,
      user_confirmed_transfer_at: now,
    })
    .eq("id", paymentId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new BillingError("PAYMENT_ALREADY_FINAL", 409);
  }

  await createPaymentEvent({
    eventType: "user_confirmed_transfer",
    orderCode: payment.order_code,
    paymentId: payment.id,
    processed: true,
    provider: payment.provider,
    safeEvent: {
      planId: normalizePlanId(payment.plan_id),
      provider: payment.provider,
      status: "waiting_confirmation",
    },
    userId,
  });

  await createNotification({
    actionUrl: `/app/billing/checkout?paymentId=${paymentId}`,
    content:
      "Chúng tôi đã ghi nhận bạn đã chuyển khoản. Gói sẽ được kích hoạt sau khi giao dịch được xác nhận.",
    metadata: {
      planId: normalizePlanId(payment.plan_id),
      provider: payment.provider,
      status: "waiting_confirmation",
    },
    title: "Thanh toán đang chờ xác nhận",
    type: "payment_waiting_confirmation",
    userId,
  });

  return data as BillingPaymentRecord;
}

export async function isPaymentAlreadyProcessed(paymentId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscription_events")
    .select("id")
    .eq("payment_id", paymentId)
    .in("event_type", [
      "subscription_activated",
      "subscription_extended",
      "subscription_plan_changed",
      "subscription_renewed",
    ])
    .limit(1);

  return !error && Boolean(data?.length);
}

export async function processPaymentPaid(input: {
  adminUser?: AdminContext | null;
  paymentId: string;
  providerData?: Record<string, unknown> | null;
  source: "admin_manual" | "payos_webhook" | "provider_reconciliation";
}) {
  const payment = await getPaymentById(input.paymentId);

  if (!payment) {
    throw new BillingError("NOT_FOUND", 404);
  }

  if (payment.status !== "paid" && FINAL_PAYMENT_STATUSES.has(payment.status)) {
    throw new BillingError("PAYMENT_ALREADY_FINAL", 409);
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("payments")
    .update({
      paid_at: payment.paid_at || now,
      provider_payload: {
        ...safeProviderPayload(payment.provider_payload),
        ...safeProviderPayload(input.providerData ?? {}),
      },
      status: "paid",
      updated_at: now,
    })
    .eq("id", input.paymentId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await createPaymentEvent({
    eventType: "payment_marked_paid",
    orderCode: payment.order_code,
    paymentId: payment.id,
    paymentLinkId: payment.payment_link_id ?? null,
    processed: true,
    provider: payment.provider,
    safeEvent: {
      planId: normalizePlanId(payment.plan_id),
      provider: payment.provider,
      source: input.source,
      status: "paid",
    },
    transactionReference: payment.transaction_reference ?? null,
    userId: payment.user_id,
  });

  const subscription = await activateSubscriptionFromPayment(input.paymentId, {
    adminUser: input.adminUser ?? null,
    source: input.source,
  });

  if (input.source === "admin_manual" && input.adminUser) {
    await writeAdminAuditLog({
      action: "payment_status_updated",
      actorRole: input.adminUser.role,
      actorUserId: input.adminUser.userId,
      metadata: {
        amount: payment.amount,
        planId: normalizePlanId(payment.plan_id),
        provider: payment.provider,
        source: input.source,
        status: "paid",
      },
      severity: "warning",
      targetId: payment.id,
      targetType: "payment",
    });
  }

  return {
    payment: updated as BillingPaymentRecord,
    subscription,
  };
}

export async function markPaymentFailed(input: {
  adminUser?: AdminContext | null;
  note?: string;
  paymentId: string;
  reason?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("payments")
    .update({
      admin_note: input.note || null,
      failed_at: now,
      failure_reason: input.reason || "admin_mark_failed",
      status: "failed",
      updated_at: now,
    })
    .eq("id", input.paymentId)
    .neq("status", "paid")
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new BillingError("PAYMENT_ALREADY_FINAL", 409);
  }

  const payment = data as BillingPaymentRecord;
  await createPaymentEvent({
    eventType: "payment_marked_failed",
    orderCode: payment.order_code,
    paymentId: payment.id,
    processed: true,
    provider: payment.provider,
    safeEvent: {
      provider: payment.provider,
      reason: input.reason || "admin_mark_failed",
      status: "failed",
    },
    userId: payment.user_id,
  });

  if (input.adminUser) {
    await writeAdminAuditLog({
      action: "payment_status_updated",
      actorRole: input.adminUser.role,
      actorUserId: input.adminUser.userId,
      metadata: {
        provider: payment.provider,
        status: "failed",
      },
      severity: "warning",
      targetId: payment.id,
      targetType: "payment",
    });
  }

  return payment;
}

export async function cancelPayment(input: {
  adminUser?: AdminContext | null;
  paymentId: string;
  reason?: string;
  userId?: string;
}) {
  const payment = input.userId
    ? await getPaymentByIdForUser(input.paymentId, input.userId)
    : await getPaymentById(input.paymentId);

  if (!payment) {
    throw new BillingError("NOT_FOUND", 404);
  }

  if (FINAL_PAYMENT_STATUSES.has(payment.status)) {
    throw new BillingError("PAYMENT_ALREADY_FINAL", 409);
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("payments")
    .update({
      cancelled_at: now,
      failure_reason: input.reason || "cancelled",
      status: "cancelled",
      updated_at: now,
    })
    .eq("id", payment.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await createPaymentEvent({
    eventType: "payment_cancelled",
    orderCode: payment.order_code,
    paymentId: payment.id,
    processed: true,
    provider: payment.provider,
    safeEvent: {
      provider: payment.provider,
      reason: input.reason || "cancelled",
      status: "cancelled",
    },
    userId: payment.user_id,
  });

  return data as BillingPaymentRecord;
}

async function updatePaymentFromProviderStatus(
  payment: BillingPaymentRecord,
  status: Extract<PaymentStatus, "cancelled" | "expired" | "failed">,
  providerData?: Record<string, unknown>,
) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const timestampFields =
    status === "cancelled"
      ? { cancelled_at: now }
      : status === "expired"
        ? { expired_at: now }
        : { failed_at: now };
  const { data, error } = await supabase
    .from("payments")
    .update({
      ...timestampFields,
      provider_payload: {
        ...safeProviderPayload(payment.provider_payload),
        ...safeProviderPayload(providerData),
      },
      status,
      updated_at: now,
    })
    .eq("id", payment.id)
    .neq("status", "paid")
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return payment;
  }

  await createPaymentEvent({
    eventType: `payment_${status}`,
    orderCode: payment.order_code,
    paymentId: payment.id,
    processed: true,
    provider: payment.provider,
    safeEvent: {
      provider: payment.provider,
      status,
    },
    userId: payment.user_id,
  });

  return data as BillingPaymentRecord;
}

export async function handlePayOSWebhookForBilling(
  payload: unknown,
  request?: Request,
) {
  const safeEvent =
    payload && typeof payload === "object"
      ? {
          code: (payload as Record<string, unknown>).code,
          desc: (payload as Record<string, unknown>).desc,
          success: (payload as Record<string, unknown>).success,
        }
      : {};

  await createPaymentEvent({
    eventType: "webhook_received",
    provider: "payos",
    safeEvent,
  });

  let normalized: NormalizedWebhookResult;

  try {
    if (!isPayOSWebhookPayload(payload)) {
      throw new BillingError("VALIDATION_ERROR", 400);
    }

    normalized = await payOSProvider.verifyWebhook!(payload);
  } catch (error) {
    await createPaymentEvent({
      eventType: "webhook_invalid_signature",
      provider: "payos",
      safeEvent,
    });
    await writeSecurityEvent({
      eventType: "invalid_payment_webhook",
      message: "payOS webhook verification failed.",
      metadata: {
        provider: "payos",
      },
      request,
      severity: "warning",
    });
    throw error;
  }

  const payment = normalized.orderCode
    ? await getPaymentByOrderCode(normalized.orderCode)
    : null;

  if (!payment) {
    await createPaymentEvent({
      eventType: "webhook_payment_not_found",
      orderCode: normalized.orderCode || null,
      provider: "payos",
      safeEvent: normalized.safeEvent,
    });

    return {
      action: "ignored",
      orderCode: normalized.orderCode || null,
      reason: "PAYMENT_NOT_FOUND",
    };
  }

  if (Number(normalized.amount ?? payment.amount) !== Number(payment.amount)) {
    await createPaymentEvent({
      eventType: "payment_amount_mismatch",
      orderCode: payment.order_code,
      paymentId: payment.id,
      provider: "payos",
      safeEvent: {
        expectedAmount: payment.amount,
        providerAmount: normalized.amount ?? null,
      },
      userId: payment.user_id,
    });
    await writeSecurityEvent({
      eventType: "payment_amount_mismatch",
      message: "payOS webhook amount does not match local payment.",
      metadata: {
        orderCode: payment.order_code,
        provider: "payos",
      },
      request,
      severity: "critical",
      userId: payment.user_id,
    });

    return {
      action: "ignored",
      orderCode: payment.order_code,
      reason: "PAYMENT_AMOUNT_MISMATCH",
    };
  }

  if (payment.status === "paid" && (await isPaymentAlreadyProcessed(payment.id))) {
    return {
      action: "paid_idempotent",
      orderCode: payment.order_code,
    };
  }

  if (normalized.status === "paid") {
    const result = await processPaymentPaid({
      paymentId: payment.id,
      providerData: normalized.safeEvent,
      source: "payos_webhook",
    });

    return {
      action: "paid",
      payment: result.payment,
    };
  }

  if (
    normalized.status === "cancelled" ||
    normalized.status === "expired" ||
    normalized.status === "failed"
  ) {
    const updated = await updatePaymentFromProviderStatus(
      payment,
      normalized.status,
      normalized.safeEvent,
    );

    return {
      action: normalized.status,
      payment: updated,
    };
  }

  await createPaymentEvent({
    eventType: "webhook_ignored_status",
    orderCode: payment.order_code,
    paymentId: payment.id,
    provider: "payos",
    safeEvent: normalized.safeEvent,
    userId: payment.user_id,
  });

  return {
    action: "ignored",
    orderCode: payment.order_code,
    reason: "STATUS_NOT_FINAL",
  };
}

export async function reconcilePendingPayOSPayments() {
  if (!isBillingProviderEnabled("payos") || !payOSProvider.getPaymentStatus) {
    return {
      checked: 0,
      completed: 0,
      failedOrCancelled: 0,
    };
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const youngerThan = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const olderThan = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("provider", "payos")
    .in("status", ["pending", "processing"])
    .lt("created_at", youngerThan)
    .gt("created_at", olderThan)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  let completed = 0;
  let failedOrCancelled = 0;

  for (const payment of (data ?? []) as BillingPaymentRecord[]) {
    const status = await payOSProvider.getPaymentStatus({ orderCode: payment.order_code });

    if (Number(status.amount ?? payment.amount) !== Number(payment.amount)) {
      await writeSecurityEvent({
        eventType: "payment_amount_mismatch",
        message: "payOS reconciliation amount does not match local payment.",
        metadata: {
          orderCode: payment.order_code,
          provider: "payos",
          source: "reconciliation",
        },
        severity: "critical",
        userId: payment.user_id,
      });
      continue;
    }

    if (status.status === "paid") {
      await processPaymentPaid({
        paymentId: payment.id,
        providerData: {
          paymentLinkId: status.paymentLinkId,
          providerStatus: status.providerStatus,
        },
        source: "provider_reconciliation",
      });
      completed += 1;
      continue;
    }

    if (
      status.status === "cancelled" ||
      status.status === "expired" ||
      status.status === "failed"
    ) {
      await updatePaymentFromProviderStatus(payment, status.status, {
        paymentLinkId: status.paymentLinkId,
        providerStatus: status.providerStatus,
      });
      failedOrCancelled += 1;
    }
  }

  return {
    checked: (data ?? []).length,
    completed,
    failedOrCancelled,
  };
}
