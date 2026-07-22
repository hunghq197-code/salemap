import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { getAdminBillingPaymentById } from "@/lib/admin/data/billing-payments";
import { getAdminPaymentRequests } from "@/lib/admin/data/payment-requests";
import { SafeError } from "@/lib/security/safe-error";

type AdminPaymentRouteProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function GET(request: Request, props: AdminPaymentRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_PAYMENTS, async () => {
    const { paymentId } = await props.params;
    const billingPayment = await getAdminBillingPaymentById(paymentId);

    if (billingPayment) {
      return adminJson(billingPayment);
    }

    const payments = await getAdminPaymentRequests();
    const payment = payments.items.find((item) => item.id === paymentId);

    if (!payment) {
      throw new SafeError("NOT_FOUND", 404);
    }

    return adminJson(payment);
  });
}
