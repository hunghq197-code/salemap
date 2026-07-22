import { writeAdminAuditLog } from "@/lib/admin/audit-log";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import { listAuthUsers, toUserEmailMap } from "@/lib/admin/data/common";
import {
  getPaging,
  getParam,
  normalizeText,
  toListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";
import { sanitizeLogMetadataObject } from "@/lib/security/sanitize-log-metadata";
import { SafeError } from "@/lib/security/safe-error";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminAuditLogRow = {
  action: string;
  actorLabel: string;
  actor_role?: string | null;
  actor_user_id?: string | null;
  created_at?: string | null;
  id: string;
  ip_address?: string | null;
  metadata?: Record<string, unknown> | null;
  severity?: string | null;
  target_id?: string | null;
  target_type?: string | null;
};

export type AdminSecurityEventRow = {
  created_at?: string | null;
  event_type: string;
  id: string;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  method?: string | null;
  resolved?: boolean | null;
  route?: string | null;
  severity?: string | null;
  userLabel: string;
  user_id?: string | null;
};

function metadataSummary(value: unknown) {
  return sanitizeLogMetadataObject(
    value && typeof value === "object" ? (value as Record<string, unknown>) : {},
  );
}

export async function getAdminAuditLogs(params?: AdminSearchParams) {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS);

  const { from, limit, page, to } = getPaging(params);
  const action = getParam(params, "action") || "";
  const severity = getParam(params, "severity") || "";
  const targetType = getParam(params, "targetType") || "";
  const q = normalizeText(getParam(params, "q"));
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("admin_audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (action) {
    query = query.eq("action", action);
  }

  if (severity) {
    query = query.eq("severity", severity);
  }

  if (targetType) {
    query = query.eq("target_type", targetType);
  }

  const [logsResult, users] = await Promise.all([query, listAuthUsers()]);
  const emailMap = toUserEmailMap(users);

  if (logsResult.error) {
    return toListResult([] as AdminAuditLogRow[], 0, page, limit);
  }

  const rows = ((logsResult.data ?? []) as AdminAuditLogRow[]).map((row) => ({
    ...row,
    actorLabel: row.actor_user_id
      ? emailMap.get(row.actor_user_id) || row.actor_user_id
      : "system",
    metadata: metadataSummary(row.metadata),
  }));
  const filtered = q
    ? rows.filter((row) =>
        normalizeText(
          `${row.action} ${row.actorLabel} ${row.target_type} ${row.target_id}`,
        ).includes(q),
      )
    : rows;

  return toListResult(filtered, logsResult.count ?? filtered.length, page, limit);
}

export async function getAdminSecurityEvents(params?: AdminSearchParams) {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS);

  const { from, limit, page, to } = getPaging(params);
  const eventType = getParam(params, "eventType") || "";
  const severity = getParam(params, "severity") || "";
  const resolved = getParam(params, "resolved") || "";
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("security_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  if (severity) {
    query = query.eq("severity", severity);
  }

  if (resolved === "true" || resolved === "false") {
    query = query.eq("resolved", resolved === "true");
  }

  const [eventsResult, users] = await Promise.all([query, listAuthUsers()]);
  const emailMap = toUserEmailMap(users);

  if (eventsResult.error) {
    return toListResult([] as AdminSecurityEventRow[], 0, page, limit);
  }

  const rows = ((eventsResult.data ?? []) as AdminSecurityEventRow[]).map((row) => ({
    ...row,
    metadata: metadataSummary(row.metadata),
    userLabel: row.user_id ? emailMap.get(row.user_id) || row.user_id : "anonymous/system",
  }));

  return toListResult(rows, eventsResult.count ?? rows.length, page, limit);
}

export async function resolveSecurityEvent(eventId: string, request?: Request) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS);

  if (!eventId) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("security_events")
    .update({
      resolved: true,
      resolved_at: now,
      resolved_by: admin.userId,
    })
    .eq("id", eventId);

  if (error) {
    throw new SafeError("UNKNOWN_ERROR", 500);
  }

  await writeAdminAuditLog({
    action: "security_event_reviewed",
    actorRole: admin.role,
    actorUserId: admin.userId,
    request,
    severity: "info",
    targetId: eventId,
    targetType: "security_event",
  });
}
