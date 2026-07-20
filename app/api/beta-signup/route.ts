import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createSupabaseAdminClient,
  MissingSupabaseConfigError,
} from "@/lib/supabase/server";
import { enforceSameOrigin, getRequestIp, rateLimit } from "@/lib/security/request";
import { betaSignupSchema, type BetaSignupInput } from "@/lib/validators/beta-signup";

export const runtime = "nodejs";

const roleScores: Record<string, number> = {
  "Sale thị trường": 4,
  "Sale B2B": 4,
  "Sale dịch vụ": 3,
  "Sale freelancer": 3,
  "Chủ kinh doanh tự đi bán": 2,
  "Telesales / Inside sales": 2,
  "Quản lý đội sale": 1,
  Khác: 0,
};

const featureScores: Record<string, number> = {
  "Tìm khách quanh tôi": 3,
  "Tìm khách theo khu vực": 3,
  "Tìm khách dọc tuyến đường": 4,
  "Lưu lead cá nhân": 3,
  "Ghi chú và phân loại khách": 2,
  "Nhắc follow-up": 3,
  "Mẫu tin nhắn/kịch bản sale": 2,
  "Xuất Excel/CSV": 1,
};

const readinessScores: Record<string, number> = {
  "Có, tôi sẵn sàng dùng thử và góp ý": 4,
  "Có, nhưng tôi cần xem sản phẩm trước": 3,
  "Có thể, nếu không mất nhiều thời gian": 1,
  "Chưa sẵn sàng": 0,
};

function calculateBetaScore(data: BetaSignupInput) {
  const roleScore = roleScores[data.currentRole] ?? 0;
  const desiredFeatureScore = data.desiredFeatures.reduce(
    (total, feature) => total + (featureScores[feature] ?? 0),
    0,
  );
  const readinessScore = readinessScores[data.betaReadiness] ?? 0;

  return roleScore + desiredFeatureScore + readinessScore;
}

function getPersonaLabel(currentRole: string) {
  if (currentRole === "Sale thị trường") return "FIELD_SALES_CORE";
  if (currentRole === "Sale B2B") return "B2B_HUNTER";
  if (currentRole === "Telesales / Inside sales") return "TELESALES_FOLLOWUP";
  if (currentRole === "Sale dịch vụ") return "SERVICE_SALES";
  if (currentRole === "Sale freelancer") return "SERVICE_SALES";
  if (currentRole === "Chủ kinh doanh tự đi bán") return "OWNER_OPERATOR";
  if (currentRole === "Quản lý đội sale") return "MANAGER_NOT_CORE";

  return "LOW_FIT";
}

function validationError(error: ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Vui lòng kiểm tra lại thông tin đã nhập.",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    },
    { status: 400 },
  );
}

function isSupabaseTableMissingError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "PGRST205"
  );
}

async function hasRecentDuplicate(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  data: BetaSignupInput,
) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: phoneMatches, error: phoneError } = await supabase
    .from("beta_signups")
    .select("id")
    .eq("phone_zalo", data.phoneZalo)
    .gte("created_at", since)
    .limit(1);

  if (phoneError) {
    throw phoneError;
  }

  if (phoneMatches && phoneMatches.length > 0) {
    return true;
  }

  if (!data.email) {
    return false;
  }

  const { data: emailMatches, error: emailError } = await supabase
    .from("beta_signups")
    .select("id")
    .eq("email", data.email)
    .gte("created_at", since)
    .limit(1);

  if (emailError) {
    throw emailError;
  }

  return Boolean(emailMatches && emailMatches.length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const originError = enforceSameOrigin(request);

    if (originError) {
      return originError;
    }

    const rateLimitError = rateLimit(request, {
      key: "landing-signup",
      limit: 8,
      message: "Bạn đã gửi form nhiều lần. Vui lòng chờ một lát rồi thử lại.",
      windowMs: 15 * 60 * 1000,
    });

    if (rateLimitError) {
      return rateLimitError;
    }

    const body = await request.json();
    const parsed = betaSignupSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const data = parsed.data;
    const supabase = createSupabaseAdminClient();
    const isDuplicate = await hasRecentDuplicate(supabase, data);

    if (isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_SIGNUP",
            message: "Thông tin này đã được đăng ký trước đó.",
          },
        },
        { status: 409 },
      );
    }

    const betaScore = calculateBetaScore(data);
    const personaLabel = getPersonaLabel(data.currentRole);

    const { data: inserted, error } = await supabase
      .from("beta_signups")
      .insert({
        full_name: data.fullName,
        phone_zalo: data.phoneZalo,
        email: data.email ?? null,
        current_role: data.currentRole,
        industry: data.industry,
        main_area: data.mainArea,
        desired_features: data.desiredFeatures,
        beta_readiness: data.betaReadiness,
        source: "landing_page",
        utm_source: data.utm_source ?? null,
        utm_medium: data.utm_medium ?? null,
        utm_campaign: data.utm_campaign ?? null,
        utm_content: data.utm_content ?? null,
        referrer: data.referrer ?? request.headers.get("referer"),
        user_agent: request.headers.get("user-agent"),
        ip_address: getRequestIp(request),
        beta_score: betaScore,
        persona_label: personaLabel,
        contact_status: "new",
      })
      .select("id,beta_score,persona_label")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: inserted.id,
        betaScore: inserted.beta_score,
        personaLabel: inserted.persona_label,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("beta-signup error", error);
    }

    if (error instanceof MissingSupabaseConfigError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SUPABASE_CONFIG_MISSING",
            message:
              "Form đăng ký chưa được cấu hình Supabase. Vui lòng kiểm tra file .env.local.",
          },
        },
        { status: 500 },
      );
    }

    if (isSupabaseTableMissingError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SUPABASE_TABLE_MISSING",
            message:
              "Chưa tìm thấy bảng beta_signups. Vui lòng chạy file supabase/schema.sql trong Supabase SQL Editor.",
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Không thể gửi đăng ký lúc này. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
