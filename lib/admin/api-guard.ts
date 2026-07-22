import { NextResponse } from "next/server";
import type { AdminPermission } from "@/lib/admin/admin-permissions";
import type { AdminContext } from "@/lib/admin/auth";
import { requirePermission } from "@/lib/admin/auth";
import { writeSecurityEvent } from "@/lib/admin/audit-log";
import { rateLimitAdminAction, rateLimitResponse } from "@/lib/security/rate-limit";
import { adminApiError } from "@/lib/security/safe-error";

type AdminApiHandler = (admin: AdminContext) => Promise<Response> | Response;

export async function handleAdminApi(
  request: Request,
  permission: AdminPermission,
  handler: AdminApiHandler,
) {
  try {
    const admin = await requirePermission(permission);
    const limit = rateLimitAdminAction({ request, userId: admin.userId });

    if (!limit.allowed) {
      await writeSecurityEvent({
        eventType: "rate_limit_exceeded",
        message: "Admin API rate limit exceeded.",
        metadata: {
          permission,
        },
        request,
        severity: "warning",
        userId: admin.userId,
      });

      return rateLimitResponse(limit.retryAfterSeconds);
    }

    return handler(admin);
  } catch (error) {
    return adminApiError(error);
  }
}

export function adminJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(
    {
      data,
      success: true,
    },
    init,
  );
}

export function searchParamsToObject(url: string) {
  return Object.fromEntries(new URL(url).searchParams.entries());
}
