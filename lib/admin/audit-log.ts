import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getRequestIp } from "@/lib/security/request";
import { sanitizeLogMetadataObject } from "@/lib/security/sanitize-log-metadata";

type AuditSeverity = "critical" | "info" | "warning";

type AuditInput = {
  action: string;
  actorRole?: string | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
  severity?: AuditSeverity;
  targetId?: string | null;
  targetType?: string | null;
};

type SecurityEventInput = {
  eventType: string;
  message?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
  severity?: AuditSeverity;
  userId?: string | null;
};

type SupportAccessInput = {
  accessType: string;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
  reason?: string | null;
  targetUserId: string;
};

function requestFields(request?: Request) {
  if (!request) {
    return {
      ip_address: null,
      user_agent: null,
    };
  }

  return {
    ip_address: getRequestIp(request),
    user_agent: request.headers.get("user-agent"),
  };
}

function logFailure(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(label, error);
  }
}

export async function writeAdminAuditLog(input: AuditInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("admin_audit_logs").insert({
      action: input.action,
      actor_role: input.actorRole || null,
      actor_user_id: input.actorUserId || null,
      metadata: sanitizeLogMetadataObject(input.metadata),
      severity: input.severity || "info",
      target_id: input.targetId || null,
      target_type: input.targetType || null,
      ...requestFields(input.request),
    });

    if (error) {
      logFailure("ADMIN_AUDIT_LOG_WRITE_FAILED", error.message);
    }
  } catch (error) {
    logFailure("ADMIN_AUDIT_LOG_WRITE_FAILED", error);
  }
}

export async function writeSecurityEvent(input: SecurityEventInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const url = input.request ? new URL(input.request.url) : null;
    const { error } = await supabase.from("security_events").insert({
      event_type: input.eventType,
      message: input.message || null,
      metadata: sanitizeLogMetadataObject(input.metadata),
      method: input.request?.method || null,
      resolved: false,
      route: url?.pathname || null,
      severity: input.severity || "info",
      user_id: input.userId || null,
      ...requestFields(input.request),
    });

    if (error) {
      logFailure("SECURITY_EVENT_WRITE_FAILED", error.message);
    }
  } catch (error) {
    logFailure("SECURITY_EVENT_WRITE_FAILED", error);
  }
}

export async function writeSupportAccessLog(input: SupportAccessInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("support_access_logs").insert({
      access_type: input.accessType,
      actor_user_id: input.actorUserId || null,
      metadata: sanitizeLogMetadataObject(input.metadata),
      reason: input.reason || null,
      target_user_id: input.targetUserId,
    });

    if (error) {
      logFailure("SUPPORT_ACCESS_LOG_WRITE_FAILED", error.message);
    }
  } catch (error) {
    logFailure("SUPPORT_ACCESS_LOG_WRITE_FAILED", error);
  }
}
