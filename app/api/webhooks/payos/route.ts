import { NextResponse } from "next/server";
import {
  handlePayOSWebhook,
  InvalidPayOSWebhookSignatureError,
} from "@/lib/data/payment-gateway-transactions";
import { writeSecurityEvent } from "@/lib/admin/audit-log";
import { handlePayOSWebhookForBilling } from "@/lib/billing/payments";
import { BillingError } from "@/lib/billing/billing-errors";
import { PayOSConfigError } from "@/lib/providers/payments";
import { rateLimitByIp, rateLimitResponse } from "@/lib/security/rate-limit";

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

export async function POST(request: Request) {
  const limit = rateLimitByIp({
    category: "payment_webhook",
    request,
  });

  if (!limit.allowed) {
    await writeSecurityEvent({
      eventType: "rate_limit_exceeded",
      message: "payOS webhook rate limit exceeded.",
      metadata: {
        provider: "payos",
      },
      request,
      severity: "warning",
    });

    return rateLimitResponse(limit.retryAfterSeconds);
  }

  const payload = await request.json().catch(() => null);

  try {
    const billingResult = await handlePayOSWebhookForBilling(payload, request);

    if (!("reason" in billingResult) || billingResult.reason !== "PAYMENT_NOT_FOUND") {
      return NextResponse.json({
        data: billingResult,
        success: true,
      });
    }

    const result = await handlePayOSWebhook(
      payload as Parameters<typeof handlePayOSWebhook>[0],
    );

    return NextResponse.json({
      data: result,
      success: true,
    });
  } catch (error) {
    if (error instanceof BillingError) {
      return errorResponse(error.code, error.message, error.status);
    }

    if (error instanceof InvalidPayOSWebhookSignatureError) {
      await writeSecurityEvent({
        eventType: "invalid_payment_webhook",
        message: "payOS webhook signature invalid.",
        metadata: {
          provider: "payos",
        },
        request,
        severity: "warning",
      });

      return errorResponse(
        "INVALID_PAYOS_WEBHOOK_SIGNATURE",
        "Webhook signature không hợp lệ.",
        400,
      );
    }

    if (error instanceof PayOSConfigError) {
      return errorResponse(
        "PAYOS_NOT_CONFIGURED",
        "Chưa cấu hình payOS nên chưa thể verify webhook.",
        503,
      );
    }

    return errorResponse(
      "PAYOS_WEBHOOK_PROCESS_FAILED",
      "Không thể xử lý webhook payOS lúc này.",
      500,
    );
  }
}
