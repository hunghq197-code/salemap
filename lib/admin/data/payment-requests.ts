import { requireAdmin, requireAdminForApi } from "@/lib/admin/auth";
import {
  getUserLabel,
  listAuthUsers,
  listProfiles,
  toProfileMap,
  toUserEmailMap,
} from "@/lib/admin/data/common";
import { createNotification } from "@/lib/data/notifications";
import type { PaymentRequestRecord, PaymentRequestStatus } from "@/lib/data/payment-requests";
import {
  activateSubscriptionForUser,
  renewSubscriptionForUser,
} from "@/lib/data/subscriptions";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminPaymentRequest = PaymentRequestRecord & {
  reviewedByLabel?: string;
  userEmail?: string;
  userLabel?: string;
};

export type AdminPaymentRequestParams = {
  fromDate?: string;
  planKey?: string;
  q?: string;
  status?: string;
  toDate?: string;
};

export type AdminPaymentRequestListResult = {
  items: AdminPaymentRequest[];
  schemaReady: boolean;
};

function normalizeSearch(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function canReview(status: PaymentRequestStatus) {
  return status === "pending" || status === "waiting_confirmation";
}

export async function getAdminPaymentRequests(
  params?: AdminPaymentRequestParams,
): Promise<AdminPaymentRequestListResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("payment_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (params?.status) {
    query = query.eq("status", params.status);
  }

  if (params?.planKey) {
    query = query.eq("plan_key", params.planKey);
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

  const [users, profiles] = await Promise.all([listAuthUsers(), listProfiles()]);
  const emailMap = toUserEmailMap(users);
  const profileMap = toProfileMap(profiles);
  const reviewerMap = new Map(users.map((user) => [user.id, user.email ?? user.id]));
  const search = normalizeSearch(params?.q);
  const items = ((data ?? []) as PaymentRequestRecord[])
    .map((row) => ({
      ...row,
      reviewedByLabel: row.reviewed_by ? reviewerMap.get(row.reviewed_by) || row.reviewed_by : "",
      userEmail: emailMap.get(row.user_id) || "",
      userLabel: getUserLabel(row.user_id, profileMap, emailMap),
    }))
    .filter((row) => {
      if (!search) return true;

      return [row.userLabel, row.userEmail, row.plan_name, row.transaction_reference]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return {
    items,
    schemaReady: true,
  };
}

export async function approvePaymentRequest(id: string, adminNote?: string) {
  const admin = await requireAdminForApi();
  const supabase = createSupabaseAdminClient();
  const { data: paymentRequest, error: fetchError } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !paymentRequest) {
    throw new Error(fetchError?.message || "PAYMENT_REQUEST_NOT_FOUND");
  }

  const request = paymentRequest as PaymentRequestRecord;

  if (!canReview(request.status)) {
    throw new Error("PAYMENT_REQUEST_ALREADY_REVIEWED");
  }

  const subscription =
    request.request_type === "renewal" || request.request_type === "plan_change"
      ? await renewSubscriptionForUser({
          adminUserId: admin.userId,
          amountVnd: request.amount_vnd,
          months: request.months ?? 1,
          note: request.request_type,
          paymentRequestId: request.id,
          planKey: request.plan_key,
          userId: request.user_id,
        })
      : await activateSubscriptionForUser({
          adminUserId: admin.userId,
          amountVnd: request.amount_vnd,
          months: request.months ?? 1,
          paymentRequestId: request.id,
          planKey: request.plan_key,
          userId: request.user_id,
        });
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("payment_requests")
    .update({
      activated_subscription_id: subscription.id,
      admin_note: adminNote || null,
      reviewed_at: now,
      reviewed_by: admin.userId,
      status: "paid",
      updated_at: now,
    })
    .eq("id", id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await createNotification({
    actionUrl: "/app/billing",
    content: `Gói ${subscription.plan_name} của bạn đã được kích hoạt.`,
    metadata: {
      months: request.months ?? 1,
      planKey: subscription.plan_key,
      requestType: request.request_type || "new_subscription",
      status: "active",
    },
    title: `Gói ${subscription.plan_name} của bạn đã được kích hoạt`,
    type: "subscription_activated",
    userId: request.user_id,
  });

  return subscription;
}

export async function rejectPaymentRequest(id: string, adminNote?: string) {
  const admin = await requireAdminForApi();
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("payment_requests")
    .update({
      admin_note: adminNote || null,
      reviewed_at: now,
      reviewed_by: admin.userId,
      status: "rejected",
      updated_at: now,
    })
    .eq("id", id)
    .in("status", ["pending", "waiting_confirmation"])
    .select("user_id,plan_key")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "PAYMENT_REQUEST_REJECT_FAILED");
  }

  await createNotification({
    actionUrl: "/app/billing",
    content: "Yêu cầu thanh toán bị từ chối. Vui lòng kiểm tra ghi chú hoặc gửi lại thông tin chuyển khoản.",
    metadata: {
      planKey: String(data.plan_key || ""),
      status: "rejected",
    },
    title: "Yêu cầu thanh toán bị từ chối",
    type: "payment_request_rejected",
    userId: String(data.user_id),
  });
}
