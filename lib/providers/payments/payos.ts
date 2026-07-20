import crypto from "node:crypto";
import type {
  CreatePaymentLinkInput,
  CreatePaymentLinkResult,
  PayOSWebhookPayload,
} from "@/lib/providers/payments/types";

const PAYOS_API_BASE_URL = "https://api-merchant.payos.vn";

export class PayOSConfigError extends Error {
  constructor() {
    super(
      "Chua cau hinh cong thanh toan. Vui long dung chuyen khoan thu cong hoac lien he ho tro.",
    );
    this.name = "PayOSConfigError";
  }
}

function getPayOSConfig() {
  const clientId = process.env.PAYOS_CLIENT_ID?.trim();
  const apiKey = process.env.PAYOS_API_KEY?.trim();
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim();
  const partnerCode = process.env.PAYOS_PARTNER_CODE?.trim();

  if (!clientId || !apiKey || !checksumKey) {
    throw new PayOSConfigError();
  }

  return {
    apiKey,
    checksumKey,
    clientId,
    partnerCode: partnerCode || undefined,
  };
}

function stringifySignatureValue(value: unknown) {
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
}

export function buildPayOSSignatureData(data: Record<string, unknown>) {
  return Object.keys(data)
    .filter((key) => data[key] !== undefined && data[key] !== null)
    .sort()
    .map((key) => `${key}=${stringifySignatureValue(data[key])}`)
    .join("&");
}

export function createPayOSSignature(
  data: Record<string, unknown>,
  checksumKey: string,
) {
  return crypto
    .createHmac("sha256", checksumKey)
    .update(buildPayOSSignatureData(data))
    .digest("hex");
}

function safeCompareHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createHeaders() {
  const config = getPayOSConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": config.apiKey,
    "x-client-id": config.clientId,
  };

  if (config.partnerCode) {
    headers["x-partner-code"] = config.partnerCode;
  }

  return {
    checksumKey: config.checksumKey,
    headers,
  };
}

function normalizeDescription(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .slice(0, 25);
}

function readResponseData(response: unknown) {
  if (!response || typeof response !== "object") {
    return {};
  }

  const record = response as Record<string, unknown>;
  const data = record.data;

  return data && typeof data === "object"
    ? (data as Record<string, unknown>)
    : {};
}

export async function createPayOSPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<CreatePaymentLinkResult> {
  const { checksumKey, headers } = createHeaders();
  const description =
    normalizeDescription(input.description) || `SaleMap ${input.orderCode}`.slice(0, 25);
  const signatureData = {
    amount: input.amountVnd,
    cancelUrl: input.cancelUrl,
    description,
    orderCode: input.orderCode,
    returnUrl: input.returnUrl,
  };
  const payload: Record<string, unknown> = {
    amount: input.amountVnd,
    cancelUrl: input.cancelUrl,
    description,
    items: [
      {
        name: input.planName,
        price: input.amountVnd,
        quantity: 1,
      },
    ],
    orderCode: input.orderCode,
    returnUrl: input.returnUrl,
    signature: createPayOSSignature(signatureData, checksumKey),
  };

  if (input.buyerEmail) {
    payload.buyerEmail = input.buyerEmail;
  }

  if (input.buyerName) {
    payload.buyerName = input.buyerName;
  }

  if (input.buyerPhone) {
    payload.buyerPhone = input.buyerPhone;
  }

  const response = await fetch(`${PAYOS_API_BASE_URL}/v2/payment-requests`, {
    body: JSON.stringify(payload),
    headers,
    method: "POST",
  });
  const raw = await response.json().catch(() => null);
  const data = readResponseData(raw);
  const checkoutUrl = String(data.checkoutUrl || "");

  if (!response.ok || !checkoutUrl) {
    throw new Error("PAYOS_CREATE_PAYMENT_LINK_FAILED");
  }

  return {
    checkoutUrl,
    orderCode: input.orderCode,
    paymentLinkId: data.paymentLinkId ? String(data.paymentLinkId) : undefined,
    qrCode: data.qrCode ? String(data.qrCode) : undefined,
    raw,
    status: data.status ? String(data.status) : undefined,
  };
}

export function verifyPayOSWebhookSignature(payload: PayOSWebhookPayload) {
  const checksumKey = getPayOSConfig().checksumKey;
  const expectedSignature = createPayOSSignature(payload.data ?? {}, checksumKey);

  return safeCompareHex(expectedSignature, payload.signature || "");
}

export async function getPayOSPaymentLinkInfo(orderCodeOrPaymentLinkId: string | number) {
  const { headers } = createHeaders();
  const response = await fetch(
    `${PAYOS_API_BASE_URL}/v2/payment-requests/${orderCodeOrPaymentLinkId}`,
    {
      headers,
      method: "GET",
    },
  );

  return response.json();
}

export async function cancelPayOSPaymentLink(
  orderCodeOrPaymentLinkId: string | number,
  reason = "User cancelled payment",
) {
  const { headers } = createHeaders();
  const response = await fetch(
    `${PAYOS_API_BASE_URL}/v2/payment-requests/${orderCodeOrPaymentLinkId}/cancel`,
    {
      body: JSON.stringify({ cancellationReason: reason }),
      headers,
      method: "POST",
    },
  );

  return response.json();
}
