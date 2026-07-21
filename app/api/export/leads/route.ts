import { NextResponse } from "next/server";
import { isExportFieldKey } from "@/lib/constants/export";
import { guardMutationRequest } from "@/lib/security/request";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import {
  FEATURE_FLAG_DISABLED_MESSAGE,
  isFeatureEnabled,
} from "@/lib/data/feature-flags";
import { checkDailyQuota, consumeDailyQuota } from "@/lib/data/usage";
import { generateLeadsCsv, getExportLeads, insertExportJob } from "@/lib/data/export";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exportLeadsSchema } from "@/lib/validators/export";

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

function isMissingUsageTable(error: unknown) {
  return error instanceof Error && error.message.includes("daily_usage_limits");
}

async function checkExportQuota() {
  try {
    const quota = await checkDailyQuota("export_leads");
    return { allowed: quota.allowed, quotaReady: true, usage: quota.usage };
  } catch (error) {
    if (isMissingUsageTable(error)) {
      return { allowed: true, quotaReady: false, usage: null };
    }

    throw error;
  }
}

async function consumeExportQuota() {
  try {
    return await consumeDailyQuota("export_leads");
  } catch (error) {
    if (isMissingUsageTable(error)) {
      return null;
    }

    throw error;
  }
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "lead-export",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "Vui lòng đăng nhập để xuất dữ liệu.", 401);
  }

  if (!(await isFeatureEnabled("export_csv", user.id))) {
    return errorResponse("FEATURE_DISABLED", FEATURE_FLAG_DISABLED_MESSAGE, 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = exportLeadsSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Vui lòng kiểm tra lại cấu hình xuất CSV.");
  }

  const selectedFields = parsed.data.selectedFields.filter(isExportFieldKey);

  if (selectedFields.length === 0) {
    return errorResponse("VALIDATION_ERROR", "Vui lòng chọn ít nhất một trường để xuất.");
  }

  const quota = await checkExportQuota();

  if (!quota.allowed) {
    return errorResponse(
      "QUOTA_EXCEEDED",
      "Bạn đã dùng hết lượt xuất dữ liệu hôm nay. Vui lòng quay lại vào ngày mai.",
      429,
    );
  }

  try {
    const rows = await getExportLeads(parsed.data.filters);
    const csv = generateLeadsCsv(rows, selectedFields);
    await insertExportJob({
      filters: parsed.data.filters,
      rowCount: rows.length,
      selectedFields,
    });
    await consumeExportQuota();
    await trackUserActivity("export_completed");

    const filename = `salemap-leads-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch {
    return errorResponse(
      "EXPORT_FAILED",
      "Không thể xuất dữ liệu lúc này. Vui lòng thử lại sau.",
      500,
    );
  }
}
