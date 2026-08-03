import "server-only";

import { writeAdminAuditLog } from "@/lib/admin/audit-log";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import type { AdminContext } from "@/lib/admin/auth";
import { requirePermission } from "@/lib/admin/auth";
import { getActiveCatalogPrice } from "@/lib/catalog/products";
import { isValidOrderTransition, type OrderStatus } from "@/lib/orders/order-status";
import { createAddOnOrderSchema } from "@/lib/validators/orders";
import { SafeError } from "@/lib/security/safe-error";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const MIN_PAID_ORDER_AMOUNT = 50000;

type OrderRow = {
  cancelled_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  currency?: string | null;
  discount_amount?: number | null;
  fulfillment_status?: string | null;
  id: string;
  order_code?: string | null;
  paid_at?: string | null;
  payment_status?: string | null;
  status?: OrderStatus | null;
  subtotal_amount?: number | null;
  total_amount?: number | null;
  user_id?: string | null;
};

type OrderItemRow = {
  entitlement_snapshot?: Record<string, unknown> | null;
  id: string;
  order_id?: string | null;
  price_id?: string | null;
  price_snapshot?: number | null;
  product_id?: string | null;
  product_name_snapshot?: string | null;
  product_type?: string | null;
  quantity?: number | null;
  subtotal_amount?: number | null;
};

export type OrderListItem = {
  createdAt?: string | null;
  fulfillmentStatus: string;
  id: string;
  orderCode: string;
  paymentStatus: string;
  status: string;
  totalAmount: number;
  userId: string;
};

export type OrderDetail = OrderListItem & {
  items: Array<{
    id: string;
    productName: string;
    productType: string;
    quantity: number;
    subtotalAmount: number;
  }>;
};

function mapOrder(row: OrderRow): OrderListItem {
  return {
    createdAt: row.created_at ?? null,
    fulfillmentStatus: row.fulfillment_status || "unfulfilled",
    id: row.id,
    orderCode: row.order_code || row.id,
    paymentStatus: row.payment_status || "pending",
    status: row.status || "draft",
    totalAmount: Number(row.total_amount ?? 0),
    userId: row.user_id || "",
  };
}

function generateOrderCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `ORD-${timestamp}-${random}`;
}

async function writeOrderEvent(input: {
  actorAdminId?: string | null;
  eventType: string;
  fromStatus?: string | null;
  orderId: string;
  safeMetadata?: Record<string, unknown>;
  toStatus?: string | null;
  userId?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("order_events").insert({
    actor_admin_id: input.actorAdminId ?? null,
    event_type: input.eventType,
    from_status: input.fromStatus ?? null,
    order_id: input.orderId,
    safe_metadata: input.safeMetadata ?? {},
    to_status: input.toStatus ?? null,
    user_id: input.userId ?? null,
  });
}

export async function createAddOnOrderForUser(input: {
  formData: FormData;
  userId: string;
}) {
  const parsed = createAddOnOrderSchema.parse({
    priceId: input.formData.get("priceId"),
  });
  const catalog = await getActiveCatalogPrice(parsed.priceId);

  if (!catalog || !catalog.product.isPublic || !catalog.product.isActive) {
    throw new SafeError("NOT_FOUND", 404);
  }

  const amount = catalog.price.amount;

  if (amount > 0 && amount < MIN_PAID_ORDER_AMOUNT) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const supabase = createSupabaseAdminClient();
  const orderCode = generateOrderCode();
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      currency: "VND",
      fulfillment_status: "unfulfilled",
      order_code: orderCode,
      payment_status: "pending",
      source: "user_addon",
      status: "pending_payment",
      subtotal_amount: amount,
      total_amount: amount,
      user_id: input.userId,
    })
    .select("*")
    .single();

  if (error || !order) throw new SafeError("UNKNOWN_ERROR", 500);

  const { error: itemError } = await supabase.from("order_items").insert({
    entitlement_snapshot: catalog.price.entitlementTemplate,
    order_id: String(order.id),
    price_id: catalog.price.id,
    price_snapshot: amount,
    product_id: catalog.product.id,
    product_name_snapshot: catalog.product.name,
    product_type: catalog.product.productType,
    quantity: 1,
    subtotal_amount: amount,
  });

  if (itemError) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeOrderEvent({
    eventType: "order_created",
    orderId: String(order.id),
    safeMetadata: {
      productCode: catalog.product.productCode,
      source: "user_addon",
    },
    toStatus: "pending_payment",
    userId: input.userId,
  });

  return mapOrder(order as OrderRow);
}

export async function getOrdersForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id,user_id,order_code,total_amount,status,payment_status,fulfillment_status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return {
      items: [] as OrderListItem[],
      schemaReady: false,
    };
  }

  return {
    items: ((data ?? []) as OrderRow[]).map(mapOrder),
    schemaReady: true,
  };
}

export async function getAdminOrders() {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_ORDERS);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id,user_id,order_code,total_amount,status,payment_status,fulfillment_status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return {
      items: [] as OrderListItem[],
      schemaReady: false,
    };
  }

  return {
    items: ((data ?? []) as OrderRow[]).map(mapOrder),
    schemaReady: true,
  };
}

export async function getAdminOrderDetail(orderId: string) {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_ORDERS);

  const supabase = createSupabaseAdminClient();
  const [{ data: order, error }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,user_id,order_code,total_amount,status,payment_status,fulfillment_status,created_at")
      .eq("id", orderId)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("id,order_id,product_name_snapshot,product_type,quantity,subtotal_amount")
      .eq("order_id", orderId),
  ]);

  if (error || !order) return null;

  return {
    ...mapOrder(order as OrderRow),
    items: ((items ?? []) as OrderItemRow[]).map((item) => ({
      id: item.id,
      productName: item.product_name_snapshot || "",
      productType: item.product_type || "",
      quantity: Number(item.quantity ?? 1),
      subtotalAmount: Number(item.subtotal_amount ?? 0),
    })),
  } satisfies OrderDetail;
}

async function transitionOrder(input: {
  admin: AdminContext;
  order: OrderRow;
  toStatus: OrderStatus;
}) {
  const fromStatus = input.order.status || "draft";

  if (!isValidOrderTransition(fromStatus, input.toStatus)) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const patch: Record<string, unknown> = {
    status: input.toStatus,
  };

  if (input.toStatus === "paid") {
    patch.payment_status = "paid";
    patch.paid_at = new Date().toISOString();
  }

  if (input.toStatus === "provisioning") {
    patch.fulfillment_status = "provisioning";
  }

  if (input.toStatus === "completed") {
    patch.completed_at = new Date().toISOString();
    patch.fulfillment_status = "fulfilled";
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", input.order.id)
    .select("*")
    .single();

  if (error || !data) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeOrderEvent({
    actorAdminId: input.admin.userId,
    eventType: "order_status_changed",
    fromStatus,
    orderId: input.order.id,
    toStatus: input.toStatus,
    userId: input.order.user_id ?? null,
  });

  return data as OrderRow;
}

async function provisionOrderGrants(input: {
  admin: AdminContext;
  order: OrderRow;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: items, error } = await supabase
    .from("order_items")
    .select("id,order_id,entitlement_snapshot")
    .eq("order_id", input.order.id);

  if (error) throw new SafeError("UNKNOWN_ERROR", 500);

  for (const item of (items ?? []) as OrderItemRow[]) {
    const snapshot = item.entitlement_snapshot || {};
    const durationDays = Number(snapshot.durationDays ?? 30);
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const grants = Array.isArray(snapshot.grants) ? snapshot.grants : [];

    for (const grant of grants as Array<Record<string, unknown>>) {
      const featureKey = String(grant.featureKey || "");
      const grantType = String(grant.grantType || "quota");

      if (!featureKey) continue;

      await supabase.from("entitlement_grants").upsert(
        {
          amount: Number(grant.amount ?? 0),
          expires_at: expiresAt,
          feature_key: featureKey,
          grant_type: grantType,
          idempotency_key: `order_item:${item.id}:${featureKey}`,
          order_id: input.order.id,
          order_item_id: item.id,
          safe_metadata: {
            source: "order_provisioning",
          },
          source_id: input.order.id,
          source_type: "addon_purchase",
          status: "active",
          user_id: input.order.user_id,
        },
        { onConflict: "idempotency_key" },
      );
    }
  }

  await writeAdminAuditLog({
    action: "order_entitlements_provisioned",
    actorRole: input.admin.role,
    actorUserId: input.admin.userId,
    metadata: {
      orderCode: input.order.order_code,
    },
    severity: "warning",
    targetId: input.order.id,
    targetType: "order",
  });
}

export async function markOrderPaidAndProvision(orderId: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ORDERS);
  const supabase = createSupabaseAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) throw new SafeError("NOT_FOUND", 404);

  let current = order as OrderRow;

  if (current.status !== "paid" && current.status !== "provisioning" && current.status !== "completed") {
    current = await transitionOrder({ admin, order: current, toStatus: "paid" });
  }

  if (current.status === "paid") {
    current = await transitionOrder({ admin, order: current, toStatus: "provisioning" });
  }

  await provisionOrderGrants({ admin, order: current });

  if (current.status === "provisioning") {
    current = await transitionOrder({ admin, order: current, toStatus: "completed" });
  }

  return mapOrder(current);
}
