import { NextResponse } from "next/server";
import {
  handlePayOSWebhook,
  InvalidPayOSWebhookSignatureError,
} from "@/lib/data/payment-gateway-transactions";
import { PayOSConfigError, type PayOSWebhookPayload } from "@/lib/providers/payments";

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

function isPayOSWebhookPayload(value: unknown): value is PayOSWebhookPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.code === "string" &&
    typeof payload.desc === "string" &&
    typeof payload.success === "boolean" &&
    typeof payload.signature === "string" &&
    Boolean(payload.data) &&
    typeof payload.data === "object"
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!isPayOSWebhookPayload(payload)) {
    return errorResponse("INVALID_WEBHOOK_PAYLOAD", "Payload webhook không hợp lệ.");
  }

  try {
    const result = await handlePayOSWebhook(payload);

    return NextResponse.json({
      data: result,
      success: true,
    });
  } catch (error) {
    if (error instanceof InvalidPayOSWebhookSignatureError) {
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
