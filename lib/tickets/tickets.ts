import "server-only";

import { writeAdminAuditLog } from "@/lib/admin/audit-log";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import { getUserLabel, listAuthUsers, listProfiles, toProfileMap, toUserEmailMap } from "@/lib/admin/data/common";
import { createNotification } from "@/lib/data/notifications";
import { SafeError } from "@/lib/security/safe-error";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  isValidTicketStatus,
  isValidTicketTransition,
  type TicketPriority,
  type TicketStatus,
  type TicketVisibility,
} from "@/lib/tickets/ticket-status";
import {
  adminTicketReplySchema,
  adminTicketUpdateSchema,
  createSupportTicketSchema,
  userTicketReplySchema,
} from "@/lib/validators/tickets";

type TicketCategoryRow = {
  default_priority?: TicketPriority | null;
  description?: string | null;
  display_order?: number | null;
  id: string;
  is_active?: boolean | null;
  name?: string | null;
  sla_first_response_minutes?: number | null;
  sla_resolution_minutes?: number | null;
  slug?: string | null;
};

type TicketRow = {
  assigned_admin_id?: string | null;
  cancelled_at?: string | null;
  category_id?: string | null;
  closed_at?: string | null;
  created_at?: string | null;
  description?: string | null;
  first_response_at?: string | null;
  first_response_due_at?: string | null;
  id: string;
  last_admin_reply_at?: string | null;
  last_message_at?: string | null;
  last_user_reply_at?: string | null;
  priority?: TicketPriority | null;
  resolution_due_at?: string | null;
  resolved_at?: string | null;
  status?: TicketStatus | null;
  subject?: string | null;
  ticket_code?: string | null;
  user_id?: string | null;
};

type TicketMessageRow = {
  author_admin_id?: string | null;
  author_type?: "admin" | "system" | "user" | null;
  author_user_id?: string | null;
  body?: string | null;
  created_at?: string | null;
  id: string;
  visibility?: TicketVisibility | null;
};

export type SupportTicketCategory = {
  defaultPriority: TicketPriority;
  description?: string | null;
  id: string;
  name: string;
  slug: string;
};

export type SupportTicketListItem = {
  assignedAdminId?: string | null;
  categoryId?: string | null;
  createdAt?: string | null;
  firstResponseBreached: boolean;
  firstResponseDueAt?: string | null;
  id: string;
  lastMessageAt?: string | null;
  priority: TicketPriority;
  resolutionBreached: boolean;
  resolutionDueAt?: string | null;
  status: TicketStatus;
  subject: string;
  ticketCode: string;
  userId: string;
  userLabel?: string;
};

export type SupportTicketMessage = {
  authorAdminId?: string | null;
  authorType: "admin" | "system" | "user";
  authorUserId?: string | null;
  body: string;
  createdAt?: string | null;
  id: string;
  visibility: TicketVisibility;
};

export type SupportTicketDetail = SupportTicketListItem & {
  category?: SupportTicketCategory | null;
  description: string;
  messages: SupportTicketMessage[];
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function nowIso() {
  return new Date().toISOString();
}

function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function generateTicketCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `TCK-${timestamp}-${random}`;
}

function safeStatus(value?: string | null): TicketStatus {
  return isValidTicketStatus(value) ? value : "new";
}

function isActiveTicket(status: TicketStatus) {
  return !["cancelled", "closed", "resolved"].includes(status);
}

function mapCategory(row: TicketCategoryRow): SupportTicketCategory {
  return {
    defaultPriority: row.default_priority || "normal",
    description: row.description ?? null,
    id: row.id,
    name: row.name || "",
    slug: row.slug || "",
  };
}

function mapTicket(row: TicketRow, userLabel?: string): SupportTicketListItem {
  const status = safeStatus(row.status);
  const now = Date.now();
  const firstResponseDue = row.first_response_due_at
    ? new Date(row.first_response_due_at).getTime()
    : null;
  const resolutionDue = row.resolution_due_at
    ? new Date(row.resolution_due_at).getTime()
    : null;

  return {
    assignedAdminId: row.assigned_admin_id ?? null,
    categoryId: row.category_id ?? null,
    createdAt: row.created_at ?? null,
    firstResponseBreached:
      isActiveTicket(status) && !row.first_response_at && Boolean(firstResponseDue && firstResponseDue < now),
    firstResponseDueAt: row.first_response_due_at ?? null,
    id: row.id,
    lastMessageAt: row.last_message_at ?? row.created_at ?? null,
    priority: row.priority || "normal",
    resolutionBreached: isActiveTicket(status) && Boolean(resolutionDue && resolutionDue < now),
    resolutionDueAt: row.resolution_due_at ?? null,
    status,
    subject: row.subject || "",
    ticketCode: row.ticket_code || row.id,
    userId: row.user_id || "",
    userLabel,
  };
}

function mapMessage(row: TicketMessageRow): SupportTicketMessage {
  return {
    authorAdminId: row.author_admin_id ?? null,
    authorType: row.author_type || "system",
    authorUserId: row.author_user_id ?? null,
    body: row.body || "",
    createdAt: row.created_at ?? null,
    id: row.id,
    visibility: row.visibility || "public",
  };
}

async function writeTicketEvent(input: {
  actorAdminId?: string | null;
  actorUserId?: string | null;
  eventType: string;
  fromStatus?: string | null;
  safeMetadata?: Record<string, unknown>;
  ticketId: string;
  toStatus?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("support_ticket_events").insert({
    actor_admin_id: input.actorAdminId ?? null,
    actor_user_id: input.actorUserId ?? null,
    event_type: input.eventType,
    from_status: input.fromStatus ?? null,
    safe_metadata: input.safeMetadata ?? {},
    ticket_id: input.ticketId,
    to_status: input.toStatus ?? null,
  });
}

async function getCategoryBySlug(slug?: string | null) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("support_ticket_categories")
    .select(
      "id,slug,name,description,default_priority,sla_first_response_minutes,sla_resolution_minutes,is_active,display_order",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (slug) {
    query = query.eq("slug", slug);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw new SafeError("UNKNOWN_ERROR", 500);
  }

  return data ? (data as TicketCategoryRow) : null;
}

export async function getSupportTicketCategories() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("support_ticket_categories")
    .select("id,slug,name,description,default_priority,is_active,display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(100);

  if (error) {
    return {
      items: [] as SupportTicketCategory[],
      schemaReady: false,
    };
  }

  return {
    items: ((data ?? []) as TicketCategoryRow[]).map(mapCategory),
    schemaReady: true,
  };
}

export async function getSupportTicketsForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select(
      "id,ticket_code,user_id,category_id,subject,status,priority,assigned_admin_id,first_response_due_at,resolution_due_at,first_response_at,last_message_at,created_at",
    )
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return {
      items: [] as SupportTicketListItem[],
      schemaReady: false,
    };
  }

  return {
    items: ((data ?? []) as TicketRow[]).map((row) => mapTicket(row)),
    schemaReady: true,
  };
}

export async function getSupportTicketDetailForUser(ticketId: string, userId: string) {
  if (!isUuid(ticketId)) return null;

  const supabase = createSupabaseAdminClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      ticket: null,
      schemaReady: false,
    };
  }

  if (!ticket) {
    return {
      ticket: null,
      schemaReady: true,
    };
  }

  const [{ data: messages }, { data: category }] = await Promise.all([
    supabase
      .from("support_ticket_messages")
      .select("id,ticket_id,author_user_id,author_admin_id,author_type,body,visibility,created_at")
      .eq("ticket_id", ticketId)
      .eq("visibility", "public")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(200),
    ticket.category_id
      ? supabase
          .from("support_ticket_categories")
          .select("id,slug,name,description,default_priority")
          .eq("id", String(ticket.category_id))
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    schemaReady: true,
    ticket: {
      ...mapTicket(ticket as TicketRow),
      category: category ? mapCategory(category as TicketCategoryRow) : null,
      description: String((ticket as TicketRow).description || ""),
      messages: ((messages ?? []) as TicketMessageRow[]).map(mapMessage),
    } satisfies SupportTicketDetail,
  };
}

export async function createSupportTicketForUser(input: {
  body: unknown;
  request?: Request;
  userId: string;
}) {
  const parsed = createSupportTicketSchema.parse(input.body);
  const category = await getCategoryBySlug(parsed.categorySlug || null);
  const firstResponseMinutes = category?.sla_first_response_minutes ?? 1440;
  const resolutionMinutes = category?.sla_resolution_minutes ?? 4320;
  const supabase = createSupabaseAdminClient();
  const now = nowIso();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      category_id: category?.id ?? null,
      description: parsed.description,
      first_response_due_at: addMinutes(firstResponseMinutes),
      last_message_at: now,
      last_user_reply_at: now,
      priority: category?.default_priority || "normal",
      resolution_due_at: addMinutes(resolutionMinutes),
      safe_metadata: {
        descriptionLength: parsed.description.length,
        pagePath: parsed.pagePath || null,
      },
      status: "new",
      subject: parsed.subject,
      ticket_code: generateTicketCode(),
      user_id: input.userId,
    })
    .select("*")
    .single();

  if (error || !ticket) throw new SafeError("UNKNOWN_ERROR", 500);

  const { error: messageError } = await supabase.from("support_ticket_messages").insert({
    author_type: "user",
    author_user_id: input.userId,
    body: parsed.description,
    safe_metadata: {
      source: "initial_description",
    },
    ticket_id: String(ticket.id),
    visibility: "public",
  });

  if (messageError) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeTicketEvent({
    actorUserId: input.userId,
    eventType: "ticket_created",
    safeMetadata: {
      categorySlug: category?.slug ?? null,
      priority: category?.default_priority || "normal",
    },
    ticketId: String(ticket.id),
    toStatus: "new",
  });

  return mapTicket(ticket as TicketRow);
}

export async function replyToTicketAsUser(input: {
  body: unknown;
  request?: Request;
  ticketId: string;
  userId: string;
}) {
  if (!isUuid(input.ticketId)) throw new SafeError("VALIDATION_ERROR", 400);

  const parsed = userTicketReplySchema.parse(input.body);
  const supabase = createSupabaseAdminClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", input.ticketId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error || !ticket) throw new SafeError("NOT_FOUND", 404);

  const current = ticket as TicketRow;
  const fromStatus = safeStatus(current.status);
  const nextStatus: TicketStatus =
    fromStatus === "resolved" || fromStatus === "closed"
      ? "open"
      : fromStatus === "waiting_on_customer"
        ? "waiting_on_support"
        : fromStatus;

  if (!isValidTicketTransition(fromStatus, nextStatus)) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const now = nowIso();
  const { error: messageError } = await supabase.from("support_ticket_messages").insert({
    author_type: "user",
    author_user_id: input.userId,
    body: parsed.body,
    ticket_id: input.ticketId,
    visibility: "public",
  });

  if (messageError) throw new SafeError("UNKNOWN_ERROR", 500);

  const { error: updateError } = await supabase
    .from("support_tickets")
    .update({
      last_message_at: now,
      last_user_reply_at: now,
      status: nextStatus,
    })
    .eq("id", input.ticketId);

  if (updateError) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeTicketEvent({
    actorUserId: input.userId,
    eventType: "user_replied",
    fromStatus,
    ticketId: input.ticketId,
    toStatus: nextStatus,
  });

  return {
    ticketId: input.ticketId,
  };
}

async function getTicketUserLabelMap(userIds: string[]) {
  const [authUsers, profiles] = await Promise.all([listAuthUsers(), listProfiles()]);
  const emailMap = toUserEmailMap(authUsers);
  const profileMap = toProfileMap(profiles);

  return new Map(userIds.map((userId) => [userId, getUserLabel(userId, profileMap, emailMap)]));
}

export async function getAdminSupportTickets() {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_TICKETS);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select(
      "id,ticket_code,user_id,category_id,subject,status,priority,assigned_admin_id,first_response_due_at,resolution_due_at,first_response_at,last_message_at,created_at",
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return {
      items: [] as SupportTicketListItem[],
      schemaReady: false,
    };
  }

  const rows = (data ?? []) as TicketRow[];
  const labels = await getTicketUserLabelMap(
    Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean))) as string[],
  );

  return {
    items: rows.map((row) => mapTicket(row, labels.get(row.user_id || ""))),
    schemaReady: true,
  };
}

export async function getAdminSupportTicketDetail(ticketId: string) {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_TICKETS);

  if (!isUuid(ticketId)) return null;

  const supabase = createSupabaseAdminClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();

  if (error || !ticket) return null;

  const [{ data: messages }, { data: category }, labels] = await Promise.all([
    supabase
      .from("support_ticket_messages")
      .select("id,ticket_id,author_user_id,author_admin_id,author_type,body,visibility,created_at")
      .eq("ticket_id", ticketId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(300),
    ticket.category_id
      ? supabase
          .from("support_ticket_categories")
          .select("id,slug,name,description,default_priority")
          .eq("id", String(ticket.category_id))
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getTicketUserLabelMap([String((ticket as TicketRow).user_id || "")]),
  ]);

  return {
    ...mapTicket(ticket as TicketRow, labels.get(String((ticket as TicketRow).user_id || ""))),
    category: category ? mapCategory(category as TicketCategoryRow) : null,
    description: String((ticket as TicketRow).description || ""),
    messages: ((messages ?? []) as TicketMessageRow[]).map(mapMessage),
  } satisfies SupportTicketDetail;
}

export async function updateSupportTicketAsAdmin(input: {
  body: unknown;
  request?: Request;
  ticketId: string;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_TICKETS);
  const parsed = adminTicketUpdateSchema.parse(input.body);

  if (!isUuid(input.ticketId)) throw new SafeError("VALIDATION_ERROR", 400);

  const supabase = createSupabaseAdminClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", input.ticketId)
    .maybeSingle();

  if (error || !ticket) throw new SafeError("NOT_FOUND", 404);

  const current = ticket as TicketRow;
  const fromStatus = safeStatus(current.status);

  if (!isValidTicketTransition(fromStatus, parsed.status)) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const now = nowIso();
  const patch: Record<string, unknown> = {
    assigned_admin_id: parsed.assignedAdminId || null,
    priority: parsed.priority,
    status: parsed.status,
  };

  if (parsed.status === "resolved" && fromStatus !== "resolved") {
    patch.resolved_at = now;
  }

  if (parsed.status === "closed" && fromStatus !== "closed") {
    patch.closed_at = now;
  }

  if (parsed.status === "cancelled" && fromStatus !== "cancelled") {
    patch.cancelled_at = now;
  }

  const { error: updateError } = await supabase
    .from("support_tickets")
    .update(patch)
    .eq("id", input.ticketId);

  if (updateError) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeTicketEvent({
    actorAdminId: admin.userId,
    eventType: "admin_ticket_updated",
    fromStatus,
    safeMetadata: {
      assigned: Boolean(parsed.assignedAdminId),
      priority: parsed.priority,
    },
    ticketId: input.ticketId,
    toStatus: parsed.status,
  });

  await writeAdminAuditLog({
    action: "support_ticket_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      fromStatus,
      priority: parsed.priority,
      toStatus: parsed.status,
    },
    request: input.request,
    severity: parsed.status === "cancelled" ? "warning" : "info",
    targetId: input.ticketId,
    targetType: "support_ticket",
  });

  return {
    ticketId: input.ticketId,
  };
}

export async function replyToTicketAsAdmin(input: {
  body: unknown;
  request?: Request;
  ticketId: string;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_TICKETS);
  const parsed = adminTicketReplySchema.parse(input.body);

  if (!isUuid(input.ticketId)) throw new SafeError("VALIDATION_ERROR", 400);

  const supabase = createSupabaseAdminClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", input.ticketId)
    .maybeSingle();

  if (error || !ticket) throw new SafeError("NOT_FOUND", 404);

  const current = ticket as TicketRow;
  const fromStatus = safeStatus(current.status);
  const publicReply = parsed.visibility === "public";
  const nextStatus: TicketStatus =
    publicReply && isActiveTicket(fromStatus) ? "waiting_on_customer" : fromStatus;

  if (!isValidTicketTransition(fromStatus, nextStatus)) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const now = nowIso();
  const { error: messageError } = await supabase.from("support_ticket_messages").insert({
    author_admin_id: admin.userId,
    author_type: "admin",
    body: parsed.body,
    safe_metadata: {
      bodyLength: parsed.body.length,
    },
    ticket_id: input.ticketId,
    visibility: parsed.visibility,
  });

  if (messageError) throw new SafeError("UNKNOWN_ERROR", 500);

  const patch: Record<string, unknown> = {
    last_admin_reply_at: publicReply ? now : current.last_admin_reply_at ?? null,
    last_message_at: now,
    status: nextStatus,
  };

  if (publicReply && !current.first_response_at) {
    patch.first_response_at = now;
  }

  const { error: updateError } = await supabase
    .from("support_tickets")
    .update(patch)
    .eq("id", input.ticketId);

  if (updateError) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeTicketEvent({
    actorAdminId: admin.userId,
    eventType: publicReply ? "admin_replied" : "internal_note_added",
    fromStatus,
    safeMetadata: {
      bodyLength: parsed.body.length,
      visibility: parsed.visibility,
    },
    ticketId: input.ticketId,
    toStatus: nextStatus,
  });

  await writeAdminAuditLog({
    action: publicReply ? "support_ticket_replied" : "support_ticket_internal_note_created",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      bodyLength: parsed.body.length,
      ticketCode: current.ticket_code,
      visibility: parsed.visibility,
    },
    request: input.request,
    severity: parsed.visibility === "internal" ? "info" : "warning",
    targetId: input.ticketId,
    targetType: "support_ticket",
  });

  if (publicReply && current.user_id) {
    await createNotification({
      actionUrl: `/app/support/tickets/${input.ticketId}`,
      content: "Đội ngũ SaleMap đã phản hồi ticket hỗ trợ của bạn.",
      metadata: {
        ticketCode: current.ticket_code,
        ticketId: input.ticketId,
      },
      title: "Ticket hỗ trợ có phản hồi mới",
      type: "support_ticket_reply",
      userId: current.user_id,
    });
  }

  return {
    ticketId: input.ticketId,
  };
}
