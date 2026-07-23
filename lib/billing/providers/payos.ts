import "server-only";

import { BillingError } from "@/lib/billing/billing-errors";
import type {
  BillingProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  NormalizedPaymentStatus,
  NormalizedWebhookResult,
} from "@/lib/billing/types";
import {
  cancelPayOSPaymentLink,
  createPayOSPaymentLink,
  getPayOSPaymentLinkInfo,
  verifyPayOSWebhookSignature,
  type PayOSWebhookPayload,
} from "@/lib/providers/payments";

function isPayOSEnabled() {
  return process.env.PAYOS_ENABLED === "true";
}

function assertPayOSReady() {
  if (!isPayOSEnabled()) {
    throw new BillingError("INVALID_PAYMENT_METHOD", 400);
  }

  if (
    !process.env.PAYOS_CLIENT_ID?.trim() ||
    !process.env.PAYOS_API_KEY?.trim() ||
    !process.env.PAYOS_CHECKSUM_KEY?.trim()
  ) {
    throw new BillingError("BILLING_NOT_CONFIGURED", 503);
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function responseData(value: unknown) {
  const root = toRecord(value);
  const data = root.data;

  return toRecord(data && typeof data === "object" ? data : root);
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

function normalizeStatus(value?: string | null): NormalizedPaymentStatus["status"] {
  const status = String(value || "").toLowerCase();

  if (["00", "paid", "success", "successful"].includes(status)) {
    return "paid";
  }

  if (status.includes("cancel")) {
    return "cancelled";
  }

  if (status.includes("expire")) {
    return "expired";
  }

  if (status.includes("fail") || status.includes("error")) {
    return "failed";
  }

  if (status.includes("pending")) {
    return "pending";
  }

  if (status.includes("processing")) {
    return "processing";
  }

  return "unknown";
}

function safePayOSPayload(value: unknown) {
  const root = toRecord(value);
  const data = responseData(value);

  return {
    code: textFrom(root.code, data.code),
    desc: textFrom(root.desc, data.desc),
    orderCode: numberFrom(data.orderCode),
    paymentLinkId: textFrom(data.paymentLinkId),
    providerStatus: textFrom(data.status, data.code),
    success: typeof root.success === "boolean" ? root.success : undefined,
  };
}

export function isPayOSWebhookPayload(value: unknown): value is PayOSWebhookPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.code === "string" &&
    typeof payload.desc === "string" &&
    typeof payload.signature === "string" &&
    typeof payload.success === "boolean" &&
    Boolean(payload.data) &&
    typeof payload.data === "object"
  );
}

export async function createPayOSPaymentRequest(
  input: CreatePaymentInput,
): Promise<CreatePaymentResult> {
  assertPayOSReady();

  const result = await createPayOSPaymentLink({
    amountVnd: input.amount,
    cancelUrl: input.cancelUrl || "",
    description: input.description,
    orderCode: input.orderCode,
    paymentRequestId: String(input.orderCode),
    planKey: input.planId,
    planName: input.planId,
    returnUrl: input.returnUrl || "",
    userId: input.userId,
  });

  return {
    checkoutUrl: result.checkoutUrl,
    paymentLinkId: result.paymentLinkId,
    provider: "payos",
    providerPayload: safePayOSPayload(result.raw),
    qrCode: result.qrCode,
  };
}

export async function verifyPayOSWebhook(
  input: unknown,
): Promise<NormalizedWebhookResult> {
  assertPayOSReady();

  if (!isPayOSWebhookPayload(input) || !verifyPayOSWebhookSignature(input)) {
    throw new BillingError("FORBIDDEN", 400, "Webhook signature không hợp lệ.");
  }

  return normalizePayOSWebhookData(input);
}

export function normalizePayOSWebhookData(
  payload: PayOSWebhookPayload,
): NormalizedWebhookResult {
  const data = toRecord(payload.data);
  const providerStatus = textFrom(data.code, data.status, payload.code);
  const isPaid =
    payload.success === true && (providerStatus === "00" || normalizeStatus(providerStatus) === "paid");

  return {
    amount: numberFrom(data.amount, data.amountPaid, data.totalAmount),
    orderCode: numberFrom(data.orderCode) ?? 0,
    paidAt: textFrom(data.transactionDateTime, data.transactionDatetime),
    paymentLinkId: textFrom(data.paymentLinkId),
    providerReference: textFrom(data.reference),
    providerStatus,
    raw: payload,
    safeEvent: safePayOSPayload(payload),
    status: isPaid ? "paid" : normalizeStatus(providerStatus),
  };
}

export async function getPayOSPaymentStatus(input: {
  orderCode: number;
}): Promise<NormalizedPaymentStatus> {
  assertPayOSReady();

  const raw = await getPayOSPaymentLinkInfo(input.orderCode);
  const data = responseData(raw);
  const providerStatus = textFrom(data.status, data.code);

  return {
    amount: numberFrom(data.amount, data.amountPaid, data.totalAmount),
    orderCode: numberFrom(data.orderCode) ?? input.orderCode,
    paymentLinkId: textFrom(data.paymentLinkId),
    providerReference: textFrom(data.reference),
    providerStatus,
    status: normalizeStatus(providerStatus),
  };
}

export async function cancelPayOSPayment(input: { orderCode: number }) {
  assertPayOSReady();
  await cancelPayOSPaymentLink(input.orderCode, "User cancelled payment");
}

export const payOSProvider: BillingProvider = {
  cancelPayment: cancelPayOSPayment,
  createPayment: createPayOSPaymentRequest,
  getPaymentStatus: getPayOSPaymentStatus,
  id: "payos",
  verifyWebhook: verifyPayOSWebhook,
};
