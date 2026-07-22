import { NextResponse } from "next/server";
import { guardMutationRequest } from "@/lib/security/request";
import { z } from "zod";
import { writeAdminAuditLog } from "@/lib/admin/audit-log";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { AdminAuthError, requirePermission } from "@/lib/admin/auth";
import {
  FEEDBACK_PRIORITY_OPTIONS,
  FEEDBACK_STATUS_OPTIONS,
} from "@/lib/admin/data/feedback";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  adminNote: z.string().trim().max(1000).optional(),
  priority: z.enum(FEEDBACK_PRIORITY_OPTIONS),
  status: z.enum(FEEDBACK_STATUS_OPTIONS),
});

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: { message }, success: false }, { status });
}

function toAdminNote(value?: string) {
  return value && value.length > 0 ? value : null;
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const guardError = guardMutationRequest(request, {
    key: "admin-feedback-update",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const params = await props.params;
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.VIEW_FEEDBACK);

    const payload = updateSchema.safeParse(await request.json());

    if (!payload.success) {
      return jsonError(400, "Dữ liệu cập nhật không hợp lệ.");
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("beta_feedback")
      .update({
        admin_note: toAdminNote(payload.data.adminNote),
        priority: payload.data.priority,
        status: payload.data.status,
      })
      .eq("id", params.id);

    if (error) {
      return jsonError(500, "Không thể cập nhật feedback.");
    }

    await writeAdminAuditLog({
      action: "feedback_updated",
      actorRole: admin.role,
      actorUserId: admin.userId,
      metadata: {
        priority: payload.data.priority,
        status: payload.data.status,
      },
      request,
      targetId: params.id,
      targetType: "beta_feedback",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.status, error.message);
    }

    return jsonError(500, "Không thể cập nhật feedback.");
  }
}
