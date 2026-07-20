import { requireAdmin, requireAdminForApi } from "@/lib/admin/auth";
import {
  getUserLabel,
  listAuthUsers,
  listProfiles,
  toProfileMap,
  toUserEmailMap,
} from "@/lib/admin/data/common";
import {
  syncPayOSGatewayTransaction,
  type PaymentGatewayTransactionRecord,
} from "@/lib/data/payment-gateway-transactions";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminPaymentGatewayTransaction = PaymentGatewayTransactionRecord & {
  paymentRequestStatus?: string;
  userEmail?: string;
  userLabel?: string;
};

export type AdminPaymentGatewayParams = {
  fromDate?: string;
  planKey?: string;
  provider?: string;
  q?: string;
  status?: string;
  toDate?: string;
};

export type AdminPaymentGatewayListResult = {
  items: AdminPaymentGatewayTransaction[];
  schemaReady: boolean;
};

function normalizeSearch(value?: string) {
  return String(value || "").trim().toLowerCase();
}

export async function getAdminPaymentGatewayTransactions(
  params?: AdminPaymentGatewayParams,
): Promise<AdminPaymentGatewayListResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("payment_gateway_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (params?.status) {
    query = query.eq("status", params.status);
  }

  if (params?.planKey) {
    query = query.eq("plan_key", params.planKey);
  }

  if (params?.provider) {
    query = query.eq("provider", params.provider);
  }

  if (params?.fromDate) {
    query = query.gte("created_at", params.fromDate);
  }

  if (params?.toDate) {
    query = query.lte("created_at", params.toDate);
  }

  const { data, error } = await query;

  if (error) {
    return {
      items: [],
      schemaReady: false,
    };
  }

  const transactions = (data ?? []) as PaymentGatewayTransactionRecord[];
  const paymentRequestIds = transactions
    .map((item) => item.payment_request_id)
    .filter((id): id is string => Boolean(id));
  const paymentRequestMap = new Map<string, string>();

  if (paymentRequestIds.length > 0) {
    const { data: paymentRequests } = await supabase
      .from("payment_requests")
      .select("id,status")
      .in("id", paymentRequestIds);

    (paymentRequests ?? []).forEach((request) => {
      paymentRequestMap.set(String(request.id), String(request.status || ""));
    });
  }

  const [users, profiles] = await Promise.all([listAuthUsers(), listProfiles()]);
  const emailMap = toUserEmailMap(users);
  const profileMap = toProfileMap(profiles);
  const search = normalizeSearch(params?.q);
  const items = transactions
    .map((row) => ({
      ...row,
      paymentRequestStatus: row.payment_request_id
        ? paymentRequestMap.get(row.payment_request_id)
        : "",
      userEmail: emailMap.get(row.user_id) || "",
      userLabel: getUserLabel(row.user_id, profileMap, emailMap),
    }))
    .filter((row) => {
      if (!search) return true;

      return [
        row.userLabel,
        row.userEmail,
        row.order_code,
        row.payment_link_id,
        row.provider_reference,
        row.plan_name,
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

export async function syncAdminPaymentGatewayTransaction(id: string) {
  await requireAdminForApi();

  return syncPayOSGatewayTransaction({ transactionId: id });
}
