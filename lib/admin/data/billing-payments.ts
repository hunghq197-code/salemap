import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import {
  getUserLabel,
  listAuthUsers,
  listProfiles,
  toProfileMap,
  toUserEmailMap,
} from "@/lib/admin/data/common";
import type { AdminSearchParams } from "@/lib/admin/data/utils";
import { getParam } from "@/lib/admin/data/utils";
import type { BillingPaymentRecord } from "@/lib/billing/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminBillingPayment = BillingPaymentRecord & {
  userEmail?: string;
  userLabel?: string;
};

export type AdminBillingPaymentsResult = {
  items: AdminBillingPayment[];
  schemaReady: boolean;
};

function normalizeSearch(value?: string) {
  return String(value || "").trim().toLowerCase();
}

export async function getAdminBillingPayments(
  params?: AdminSearchParams,
): Promise<AdminBillingPaymentsResult> {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_PAYMENTS);

  const supabase = createSupabaseAdminClient();
  const status = getParam(params, "status") || "";
  const provider = getParam(params, "provider") || "";
  const planId = getParam(params, "planId") || getParam(params, "planKey") || "";
  const fromDate = getParam(params, "fromDate") || "";
  const toDate = getParam(params, "toDate") || "";
  let query = supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (status) query = query.eq("status", status);
  if (provider) query = query.eq("provider", provider);
  if (planId) query = query.eq("plan_id", planId === "free_beta" ? "free" : planId);
  if (fromDate) query = query.gte("created_at", fromDate);
  if (toDate) query = query.lte("created_at", toDate);

  const [paymentsResult, users, profiles] = await Promise.all([
    query,
    listAuthUsers(),
    listProfiles(),
  ]);

  if (paymentsResult.error) {
    return {
      items: [],
      schemaReady: false,
    };
  }

  const emailMap = toUserEmailMap(users);
  const profileMap = toProfileMap(profiles);
  const search = normalizeSearch(getParam(params, "q") || "");
  const items = ((paymentsResult.data ?? []) as BillingPaymentRecord[])
    .map((row) => ({
      ...row,
      userEmail: emailMap.get(row.user_id) || "",
      userLabel: getUserLabel(row.user_id, profileMap, emailMap),
    }))
    .filter((row) => {
      if (!search) return true;

      return [
        row.userLabel,
        row.userEmail,
        row.order_code,
        row.payment_code,
        row.plan_id,
        row.provider,
        row.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return {
    items,
    schemaReady: true,
  };
}

export async function getAdminBillingPaymentById(paymentId: string) {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_PAYMENTS);

  const payments = await getAdminBillingPayments();

  return payments.items.find((payment) => payment.id === paymentId) ?? null;
}
