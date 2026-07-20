import { NextResponse } from "next/server";
import { z } from "zod";
import {
  INVITE_CODE_ERROR_MESSAGE,
  normalizeInviteCode,
  validateBetaInviteCode,
} from "@/lib/data/beta-invites";
import { enforceSameOrigin, rateLimit } from "@/lib/security/request";

const validateInviteSchema = z.object({
  code: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  phoneZalo: z.string().trim().max(40).optional().or(z.literal("")),
});

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
  const originError = enforceSameOrigin(request);

  if (originError) {
    return originError;
  }

  const rateLimitError = rateLimit(request, {
    key: "invite-validate",
    limit: 12,
    message: "Bạn đã kiểm tra mã mời nhiều lần. Vui lòng chờ một lát rồi thử lại.",
    windowMs: 10 * 60 * 1000,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  const payload = await request.json().catch(() => null);
  const parsed = validateInviteSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("INVALID_INVITE_CODE", INVITE_CODE_ERROR_MESSAGE);
  }

  const result = await validateBetaInviteCode({
    code: normalizeInviteCode(parsed.data.code),
    email: parsed.data.email || undefined,
    phoneZalo: parsed.data.phoneZalo || undefined,
  });

  if (!result.valid) {
    return errorResponse("INVALID_INVITE_CODE", INVITE_CODE_ERROR_MESSAGE);
  }

  return NextResponse.json({
    data: {
      label: result.label,
      valid: true,
    },
    success: true,
  });
}
