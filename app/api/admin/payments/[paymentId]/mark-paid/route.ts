import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { approvePaymentRequest } from "@/lib/admin/data/payment-requests";

type AdminPaymentRouteProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function POST(request: Request, props: AdminPaymentRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_PAYMENT_STATUS, async () => {
    const { paymentId } = await props.params;
    const payload = await request.json().catch(() => ({}));

    return adminJson(
      await approvePaymentRequest(paymentId, String(payload.adminNote || "")),
    );
  });
}
