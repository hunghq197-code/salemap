import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { rejectPaymentRequest } from "@/lib/admin/data/payment-requests";
import { getPaymentById, markPaymentFailed } from "@/lib/billing/payments";

type AdminPaymentRouteProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function POST(request: Request, props: AdminPaymentRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_PAYMENT_STATUS, async (admin) => {
    const { paymentId } = await props.params;
    const payload = await request.json().catch(() => ({}));
    const billingPayment = await getPaymentById(paymentId);

    if (billingPayment) {
      return adminJson(
        await markPaymentFailed({
          adminUser: admin,
          note: String(payload.adminNote || ""),
          paymentId,
          reason: String(payload.reason || "admin_mark_failed"),
        }),
      );
    }

    await rejectPaymentRequest(paymentId, String(payload.adminNote || ""));

    return adminJson({ id: paymentId, status: "failed" });
  });
}
