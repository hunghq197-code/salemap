import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabaseAdminClient,
  MissingSupabaseConfigError,
} from "@/lib/supabase/server";
import {
  INVITE_CODE_ERROR_MESSAGE,
  isBetaInviteOnlyMode,
  normalizeInviteCode,
  redeemBetaInviteCode,
  validateBetaInviteCode,
} from "@/lib/data/beta-invites";
import { enforceSameOrigin, rateLimit } from "@/lib/security/request";

const betaRegisterSchema = z.object({
  email: z.string().trim().email().max(160),
  fullName: z.string().trim().min(2).max(160),
  inviteCode: z.string().trim().max(80).optional(),
  password: z.string().min(8).max(128),
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

function isAlreadyRegistered(message?: string) {
  const lowerMessage = message?.toLowerCase() ?? "";

  return (
    lowerMessage.includes("already") ||
    lowerMessage.includes("registered") ||
    lowerMessage.includes("exists")
  );
}

function getCreateUserErrorMessage(message?: string) {
  const lowerMessage = message?.toLowerCase() ?? "";

  if (lowerMessage.includes("fetch failed") || lowerMessage.includes("eacces")) {
    return "Dev server chưa kết nối được Supabase. Hãy restart server với quyền network rồi thử lại.";
  }

  if (lowerMessage.includes("jwt") || lowerMessage.includes("service_role")) {
    return "SUPABASE_SERVICE_ROLE_KEY chưa đúng. Hãy copy lại service_role key trong Supabase Project Settings > API.";
  }

  return "Không thể tạo tài khoản lúc này. Vui lòng kiểm tra cấu hình Supabase Auth.";
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);

  if (originError) {
    return originError;
  }

  const rateLimitError = rateLimit(request, {
    key: "auth-register",
    limit: 5,
    message: "Bạn đã thử tạo tài khoản nhiều lần. Vui lòng chờ một lát rồi thử lại.",
    windowMs: 15 * 60 * 1000,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  const payload = await request.json().catch(() => null);
  const parsed = betaRegisterSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Vui lòng kiểm tra lại họ tên, email và mật khẩu.",
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { email, fullName, password } = parsed.data;
    const inviteCode = normalizeInviteCode(parsed.data.inviteCode);
    const inviteRequired = isBetaInviteOnlyMode();

    if (inviteRequired || inviteCode) {
      const inviteResult = await validateBetaInviteCode({
        code: inviteCode,
        email,
      });

      if (!inviteResult.valid) {
        return errorResponse("INVALID_INVITE_CODE", INVITE_CODE_ERROR_MESSAGE, 400);
      }
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: {
        beta_signup: true,
        full_name: fullName,
      },
    });

    if (error) {
      if (isAlreadyRegistered(error.message)) {
        return errorResponse(
          "USER_ALREADY_EXISTS",
          "Email này đã có tài khoản. Nếu đây là user test cũ chưa confirm, hãy xóa user đó trong Supabase Authentication rồi đăng ký lại.",
          409,
        );
      }

      return errorResponse(
        "AUTH_CREATE_USER_FAILED",
        getCreateUserErrorMessage(error.message),
        500,
      );
    }

    if (!data.user) {
      return errorResponse(
        "AUTH_CREATE_USER_FAILED",
        "Không thể tạo tài khoản lúc này. Vui lòng thử lại sau.",
        500,
      );
    }

    const { error: profileError } = await supabase.from("user_profiles").upsert(
      {
        full_name: fullName,
        user_id: data.user.id,
      },
      {
        onConflict: "user_id",
      },
    );

    if (profileError) {
      return errorResponse(
        "PROFILE_CREATE_FAILED",
        "Tài khoản đã tạo nhưng chưa tạo được hồ sơ. Vui lòng kiểm tra schema Supabase.",
        500,
      );
    }

    if (inviteCode) {
      try {
        await redeemBetaInviteCode({
          code: inviteCode,
          email,
          userId: data.user.id,
        });
      } catch {
        return errorResponse(
          "INVITE_REDEEM_FAILED",
          "Tài khoản đã tạo nhưng chưa ghi nhận được mã mời. Vui lòng liên hệ admin SaleMap để kiểm tra.",
          500,
        );
      }
    }

    return NextResponse.json({
      data: {
        userId: data.user.id,
      },
      success: true,
    });
  } catch (error) {
    if (error instanceof MissingSupabaseConfigError) {
      return errorResponse(
        "MISSING_SUPABASE_SERVICE_ROLE_KEY",
        "Thiếu SUPABASE_SERVICE_ROLE_KEY trong file môi trường server.",
        500,
      );
    }

    return errorResponse(
      "UNKNOWN_ERROR",
      "Không thể tạo tài khoản lúc này. Vui lòng thử lại sau.",
      500,
    );
  }
}
