import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { approvePaymentRequest } from "@/lib/admin/data/payment-requests";
import { getPaymentById, processPaymentPaid } from "@/lib/billing/payments";

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
        await processPaymentPaid({
          adminUser: admin,
          paymentId,
          providerData: {
            adminNote: String(payload.adminNote || ""),
          },
          source: "admin_manual",
        }),
      );
    }

    return adminJson(
      await approvePaymentRequest(paymentId, String(payload.adminNote || "")),
    );
  });
}
